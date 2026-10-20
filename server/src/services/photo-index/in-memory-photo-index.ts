import { PhotoEntity, PhotoIndex } from "./photo-index.js";

/** Keeps photo metadata in a V1 in-memory map index. */
export class InMemoryPhotoIndex implements PhotoIndex {
  private readonly photos = new Map<string, PhotoEntity>();

  /** Adds metadata to the lookup index. */
  public async create(photo: PhotoEntity): Promise<PhotoEntity> {
    this.photos.set(photo.id, photo);
    return photo;
  }

  /** Removes metadata from the lookup index. */
  public async delete(id: string): Promise<boolean> {
    return this.photos.delete(id);
  }

  /** Looks up indexed metadata by its photo id. */
  public async find(id: string): Promise<PhotoEntity | undefined> {
    return this.photos.get(id);
  }

  /** Returns a snapshot of all indexed metadata. */
  public async findAll(): Promise<ReadonlyArray<PhotoEntity>> {
    return Array.from(this.photos.values());
  }
}
