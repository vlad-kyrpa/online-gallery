import { PhotoStorage, SavePhotoImageParameters, StoredImage } from "./photo-storage.js";
import { PhotoId } from "./types.js";

/** Keeps actual image data separately from the metadata index. */
export class InMemoryPhotoStorage implements PhotoStorage {
  private readonly images = new Map<PhotoId, StoredImage>();

  /** Removes the image associated with a photo id. */
  public async delete(id: PhotoId): Promise<boolean> {
    return this.images.delete(id);
  }

  /** Lists identifiers whose image payloads are currently stored. */
  public async list(): Promise<string[]> {
    return Array.from(this.images.keys());
  }

  /** Looks up image data without exposing the backing map. */
  public async read(id: PhotoId): Promise<StoredImage | undefined> {
    return this.images.get(id);
  }

  /** Stores the submitted image payload under its photo id. */
  public async save({ id, image }: SavePhotoImageParameters): Promise<void> {
    this.images.set(id, image);
  }
}
