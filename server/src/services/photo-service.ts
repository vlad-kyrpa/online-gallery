import { PhotoStorage, StoredImage } from "./photo-storage/photo-storage.js";
import { PhotoEntity, PhotoIndex } from "./photo-index/photo-index.js";
import { Photo } from "./types.js";

/** Captures validated metadata and binary image content for a new photo. */
export interface CreateStoredPhotoInput {
  image: StoredImage;
  title: string;
}

/** Groups the infrastructure required for gallery use cases. */
export interface PhotoServiceDependencies {
  createImageUrl: (id: string) => string;
  createId: () => string;
  index: PhotoIndex;
  storage: PhotoStorage;
}

/** Coordinates photo metadata indexing with actual image storage. */
export class PhotoService {
  private readonly createImageUrl: (id: string) => string;
  private readonly createId: () => string;
  private readonly index: PhotoIndex;
  private readonly storage: PhotoStorage;

  /** Receives independent index, storage, and identifier dependencies. */
  public constructor({
    createId,
    createImageUrl,
    index,
    storage,
  }: PhotoServiceDependencies) {
    this.createId = createId;
    this.createImageUrl = createImageUrl;
    this.index = index;
    this.storage = storage;
  }

  /** Saves image data and metadata together under one generated id. */
  public async create(input: CreateStoredPhotoInput): Promise<Photo> {
    const title = input.title.trim();
    if (title === "") throw new Error("A title is required.");
    const id = this.createId();
    const photo: PhotoEntity = { id, title };
    await this.storage.save({ id, image: input.image });
    await this.index.create(photo);
    return this.toPhoto(photo);
  }

  /** Removes metadata and its corresponding image payload. */
  public async delete(id: string): Promise<boolean> {
    const wasIndexed = await this.index.delete(id);
    await this.storage.delete(id);
    return wasIndexed;
  }

  /** Retrieves one photo's metadata and its stable image-asset endpoint. */
  public async find(id: string): Promise<Photo | undefined> {
    const photo = await this.index.find(id);
    return photo === undefined ? undefined : this.toPhoto(photo);
  }

  /** Lists metadata with image-asset endpoints without downloading image bytes. */
  public async findAll(): Promise<ReadonlyArray<Photo>> {
    return (await this.index.findAll()).map((photo) => this.toPhoto(photo));
  }

  /** Retrieves the raw image asset only when its metadata record still exists. */
  public async findImage(id: string): Promise<StoredImage | undefined> {
    return (await this.index.find(id)) === undefined
      ? undefined
      : this.storage.read(id);
  }

  /** Builds the public API representation without coupling storage to routing. */
  private toPhoto(photo: PhotoEntity): Photo {
    return { ...photo, imageUrl: this.createImageUrl(photo.id) };
  }
}
