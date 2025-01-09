import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";

const runMigration = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema });

  console.log("Running migrations...");
  
  await migrate(db, { migrationsFolder: "./drizzle" });
  
  console.log("Migrations complete!");
  
  await sql.end();
};

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
}); 