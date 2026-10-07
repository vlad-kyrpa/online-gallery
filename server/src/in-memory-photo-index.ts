import { PhotoEntity, PhotoId, PhotoIndex } from "./types.js";

/** Keeps photo metadata in a V1 in-memory map index. */
export class InMemoryPhotoIndex implements PhotoIndex {
  private readonly photos = new Map<PhotoId, PhotoEntity>();

  /** Adds metadata to the lookup index. */
  public create(photo: PhotoEntity): PhotoEntity {
    this.photos.set(photo.id, photo);
    return photo;
  }

  /** Removes metadata from the lookup index. */
  public delete(id: PhotoId): boolean {
    return this.photos.delete(id);
  }

  /** Looks up indexed metadata by its photo id. */
  public find(id: PhotoId): PhotoEntity | undefined {
    return this.photos.get(id);
  }

  /** Returns a snapshot of all indexed metadata. */
  public findAll(): ReadonlyArray<PhotoEntity> {
    return Array.from(this.photos.values());
  }
}
