import { asc, eq } from "drizzle-orm";
import * as databaseSchema from "./db-types.js";
export const PHOTO_COLUMNS = {
    id: databaseSchema.photosTable.id,
    title: databaseSchema.photosTable.title,
};
/** Persists gallery photo metadata in PostgreSQL through Drizzle. */
export class DrizzlePhotoIndex {
    database;
    /** Receives the already-configured database connection owned by application composition. */
    constructor({ database }) {
        this.database = database;
    }
    /** Inserts metadata and returns the row PostgreSQL accepted. */
    async create(photo) {
        const [createdPhoto] = await this.database
            .insert(databaseSchema.photosTable)
            .values(photo)
            .returning(PHOTO_COLUMNS);
        return createdPhoto;
    }
    /** Deletes metadata and reports whether a row existed. */
    async delete(id) {
        const deletedPhotos = await this.database
            .delete(databaseSchema.photosTable)
            .where(eq(databaseSchema.photosTable.id, id))
            .returning({ id: databaseSchema.photosTable.id });
        return deletedPhotos.length > 0;
    }
    /** Looks up one photo metadata row by its stable identifier. */
    async find(id) {
        const [photo] = await this.database
            .select(PHOTO_COLUMNS)
            .from(databaseSchema.photosTable)
            .where(eq(databaseSchema.photosTable.id, id))
            .limit(1);
        return photo;
    }
    /** Lists metadata oldest-first, matching the former in-memory insertion order. */
    async findAll() {
        return this.database
            .select(PHOTO_COLUMNS)
            .from(databaseSchema.photosTable)
            .orderBy(asc(databaseSchema.photosTable.createdAt), asc(databaseSchema.photosTable.id));
    }
}
