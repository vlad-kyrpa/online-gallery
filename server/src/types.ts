/** Identifies one photo across its metadata index and image storage. */
export type PhotoId = string;

/** Represents the metadata indexed for a gallery image. */
export interface PhotoEntity {
  id: PhotoId;
  title: string;
}

/** Represents the complete photo returned to API consumers. */
export interface Photo extends PhotoEntity {
  imageUrl: string;
}

/** Captures the data accepted when a new photo is created. */
export interface CreatePhotoInput {
  title: string;
  imageUrl: string;
}

/** Defines the in-memory index boundary for photo metadata. */
export interface PhotoIndex {
  create(photo: PhotoEntity): PhotoEntity;
  delete(id: PhotoId): boolean;
  find(id: PhotoId): PhotoEntity | undefined;
  findAll(): ReadonlyArray<PhotoEntity>;
}
