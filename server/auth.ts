import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { type Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "task-manager-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            return done(null, false, { message: "Incorrect email." });
          }
          if (!user.password) {
            return done(null, false, { message: "Please use OAuth to login." });
          }
          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password." });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.NODE_ENV === 'production'
          ? `${process.env.PUBLIC_URL}/auth/google/callback`
          : "http://localhost:5000/auth/google/callback",
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: {
          id: string;
          displayName: string;
          emails?: { value: string }[];
          photos?: { value: string }[];
        },
        done: (error: any, user?: any) => void
      ) => {
        try {
          let [user] = await db
            .select()
            .from(users)
            .where(eq(users.googleId, profile.id))
            .limit(1);

          if (!user) {
            // Check if user exists with same email
            [user] = await db
              .select()
              .from(users)
              .where(eq(users.email, profile.emails![0].value))
              .limit(1);

            if (user) {
              // Update existing user with Google ID
              [user] = await db
                .update(users)
                .set({
                  googleId: profile.id,
                  provider: user.provider ? `${user.provider},google` : 'google',
                })
                .where(eq(users.id, user.id))
                .returning();
            } else {
              // Create new user
              [user] = await db
                .insert(users)
                .values({
                  email: profile.emails![0].value,
                  displayName: profile.displayName,
                  googleId: profile.id,
                  avatar: profile.photos?.[0].value,
                  provider: 'google',
                })
                .returning();
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  // GitHub Strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: process.env.NODE_ENV === 'production'
          ? `${process.env.PUBLIC_URL}/auth/github/callback`
          : "http://localhost:5000/auth/github/callback",
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: {
          id: string;
          displayName?: string;
          username?: string;
          emails?: { value: string }[];
          photos?: { value: string }[];
        },
        done: (error: any, user?: any) => void
      ) => {
        try {
          let [user] = await db
            .select()
            .from(users)
            .where(eq(users.githubId, profile.id.toString()))
            .limit(1);

          if (!user) {
            // Check if user exists with same email
            if (profile.emails && profile.emails[0]) {
              [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, profile.emails[0].value))
                .limit(1);
            }

            if (user) {
              // Update existing user with GitHub ID
              [user] = await db
                .update(users)
                .set({
                  githubId: profile.id.toString(),
                  provider: user.provider ? `${user.provider},github` : 'github',
                })
                .where(eq(users.id, user.id))
                .returning();
            } else {
              // Create new user
              [user] = await db
                .insert(users)
                .values({
                  email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
                  displayName: profile.displayName || profile.username,
                  githubId: profile.id.toString(),
                  avatar: profile.photos?.[0]?.value,
                  provider: 'github',
                })
                .returning();
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // OAuth routes
  app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req: Request, res: Response) => res.redirect("/")
  );

  app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));
  app.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/login" }),
    (req: Request, res: Response) => res.redirect("/")
  );

  app.post("/api/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { email, password, displayName } = result.data;

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Email already exists");
      }

      const hashedPassword = await crypto.hash(password);

      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          displayName: displayName || email.split('@')[0]
        })
        .returning();

      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: { id: newUser.id, email: newUser.email, displayName: newUser.displayName },
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
    }

    const cb = (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).send(info.message ?? "Login failed");
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        return res.json({
          message: "Login successful",
          user: { id: user.id, email: user.email, displayName: user.displayName },
        });
      });
    };
    passport.authenticate("local", cb)(req, res, next);
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });
}