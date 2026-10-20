import { defineConfig } from "drizzle-kit";

/** Configures schema-to-SQL migration generation for the gallery database. */
export default defineConfig({
  dialect: "postgresql",
  out: "./drizzle",
  schema: "./src/services/photo-index/db-types.ts",
});
