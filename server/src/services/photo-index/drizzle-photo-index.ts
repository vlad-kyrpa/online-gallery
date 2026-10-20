import { asc, eq } from "drizzle-orm";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as databaseSchema from "./db-types.js";
import { PhotoEntity, PhotoIndex } from "./photo-index.js";

export const PHOTO_COLUMNS = {
  id: databaseSchema.photosTable.id,
  title: databaseSchema.photosTable.title,
};
/** Identifies the Drizzle database shape available to the photo metadata adapter. */
export type GalleryDatabase = NodePgDatabase<typeof databaseSchema>;

/** Groups the database dependency required by the PostgreSQL photo index. */
export interface DrizzlePhotoIndexDependencies {
  readonly database: GalleryDatabase;
}

/** Persists gallery photo metadata in PostgreSQL through Drizzle. */
export class DrizzlePhotoIndex implements PhotoIndex {
  private readonly database: GalleryDatabase;

  /** Receives the already-configured database connection owned by application composition. */
  public constructor({ database }: DrizzlePhotoIndexDependencies) {
    this.database = database;
  }

  /** Inserts metadata and returns the row PostgreSQL accepted. */
  public async create(photo: PhotoEntity): Promise<PhotoEntity> {
    const [createdPhoto] = await this.database
      .insert(databaseSchema.photosTable)
      .values(photo)
      .returning(PHOTO_COLUMNS);

    return createdPhoto;
  }

  /** Deletes metadata and reports whether a row existed. */
  public async delete(id: string): Promise<boolean> {
    const deletedPhotos = await this.database
      .delete(databaseSchema.photosTable)
      .where(eq(databaseSchema.photosTable.id, id))
      .returning({ id: databaseSchema.photosTable.id });

    return deletedPhotos.length > 0;
  }

  /** Looks up one photo metadata row by its stable identifier. */
  public async find(id: string): Promise<PhotoEntity | undefined> {
    const [photo] = await this.database
      .select(PHOTO_COLUMNS)
      .from(databaseSchema.photosTable)
      .where(eq(databaseSchema.photosTable.id, id))
      .limit(1);

    return photo;
  }

  /** Lists metadata oldest-first, matching the former in-memory insertion order. */
  public async findAll(): Promise<ReadonlyArray<PhotoEntity>> {
    return this.database
      .select(PHOTO_COLUMNS)
      .from(databaseSchema.photosTable)
      .orderBy(
        asc(databaseSchema.photosTable.createdAt),
        asc(databaseSchema.photosTable.id),
      );
  }
}
