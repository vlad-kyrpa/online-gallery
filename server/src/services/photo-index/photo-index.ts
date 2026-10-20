/** Represents the metadata indexed for a gallery image. */
export interface PhotoEntity {
  id: string;
  title: string;
}

/** Defines the metadata persistence boundary independently of its backing store. */
export interface PhotoIndex {
  create(photo: PhotoEntity): Promise<PhotoEntity>;
  delete(id: string): Promise<boolean>;
  find(id: string): Promise<PhotoEntity | undefined>;
  findAll(): Promise<ReadonlyArray<PhotoEntity>>;
}
