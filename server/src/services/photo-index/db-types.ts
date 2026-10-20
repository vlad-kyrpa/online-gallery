import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Describes the durable metadata record for an image stored in the gallery. */
export const photosTable = pgTable("photos", {
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
    .defaultNow()
    .notNull(),
  id: uuid("id").primaryKey().notNull(),
  title: text("title").notNull(),
});
