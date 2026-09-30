import { PhotoEntity, PhotoId, PhotoIndex, PhotoStorage } from "./types.js";

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

/** Keeps actual image data separately from the metadata index. */
export class InMemoryPhotoStorage implements PhotoStorage {
  private readonly images = new Map<PhotoId, string>();

  /** Removes the image associated with a photo id. */
  public delete(id: PhotoId): boolean {
    return this.images.delete(id);
  }

  /** Looks up image data without exposing the backing map. */
  public find(id: PhotoId): string | undefined {
    return this.images.get(id);
  }

  /** Stores the submitted image payload under its photo id. */
  public save({ id, imageUrl }: { id: PhotoId; imageUrl: string }): void {
    this.images.set(id, imageUrl);
  }
}
