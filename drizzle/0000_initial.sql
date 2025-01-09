CREATE TABLE IF NOT EXISTS "users" (
    "id" serial PRIMARY KEY,
    "email" text NOT NULL UNIQUE,
    "display_name" text,
    "password" text,
    "google_id" text UNIQUE,
    "github_id" text UNIQUE,
    "avatar_url" text,
    "provider" text
);

CREATE TABLE IF NOT EXISTS "tasks" (
    "id" serial PRIMARY KEY,
    "title" text NOT NULL,
    "description" text,
    "priority" text NOT NULL DEFAULT 'medium',
    "deadline" timestamp,
    "completed" boolean DEFAULT false,
    "position" integer DEFAULT 0,
    "user_id" integer NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT NOW(),
    "updated_at" timestamp DEFAULT NOW()
); 