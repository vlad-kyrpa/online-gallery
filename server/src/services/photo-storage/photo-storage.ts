/** Represents the raw image asset handled by a storage adapter. */
export interface StoredImage {
  body: Uint8Array;
  contentType: string;
}

/** Groups the identifier and binary image required for a storage write. */
export interface SavePhotoImageParameters {
  id: string;
  image: StoredImage;
}

/** Defines the binary-image storage boundary independently of the metadata index. */
export interface PhotoStorage {
  delete(id: string): Promise<boolean>;
  read(id: string): Promise<StoredImage | undefined>;
  save(parameters: SavePhotoImageParameters): Promise<void>;
  list(): Promise<string[]>;
}
