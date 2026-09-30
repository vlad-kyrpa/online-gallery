import { CreatePhotoInput, Photo, PhotoEntity, PhotoId, PhotoIndex, PhotoStorage } from "./types.js";

/** Groups the infrastructure required for gallery use cases. */
export interface PhotoServiceDependencies {
  createId: () => PhotoId;
  index: PhotoIndex;
  storage: PhotoStorage;
}

/** Coordinates photo metadata indexing with actual image storage. */
export class PhotoService {
  private readonly createId: () => PhotoId;
  private readonly index: PhotoIndex;
  private readonly storage: PhotoStorage;

  /** Receives independent index, storage, and identifier dependencies. */
  public constructor({ createId, index, storage }: PhotoServiceDependencies) {
    this.createId = createId;
    this.index = index;
    this.storage = storage;
  }

  /** Saves image data and metadata together under one generated id. */
  public create(input: CreatePhotoInput): Photo {
    const title = input.title.trim();
    const imageUrl = input.imageUrl.trim();
    if (title === "" || imageUrl === "") throw new Error("A title and image URL are required.");
    const id = this.createId();
    const photo: PhotoEntity = { id, title };
    this.storage.save({ id, imageUrl });
    this.index.create(photo);
    return { ...photo, imageUrl };
  }

  /** Removes metadata and its corresponding image payload. */
  public delete(id: PhotoId): boolean {
    const wasIndexed = this.index.delete(id);
    this.storage.delete(id);
    return wasIndexed;
  }

  /** Retrieves one photo by combining its metadata and stored image payload. */
  public find(id: PhotoId): Photo | undefined {
    const photo = this.index.find(id);
    const imageUrl = this.storage.find(id);
    return photo === undefined || imageUrl === undefined ? undefined : { ...photo, imageUrl };
  }

  /** Combines indexed metadata with separately stored image payloads. */
  public findAll(): ReadonlyArray<Photo> {
    return this.index.findAll().flatMap((photo) => {
      const imageUrl = this.storage.find(photo.id);
      return imageUrl === undefined ? [] : [{ ...photo, imageUrl }];
    });
  }
}
