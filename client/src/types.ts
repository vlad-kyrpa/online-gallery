/** Represents a photo ready for display in the gallery. */
export interface Photo {
  id: string;
  title: string;
  url: string;
  alt: string;
}

/** Represents a photo returned by the backend. */
export interface ApiPhoto {
  id: string;
  title: string;
  imageUrl: string;
}

/** Captures the data sent to create a new photo. */
export interface CreatePhotoInput {
  title: string;
  imageUrl: string;
}

/** Identifies the active top-level application view. */
export type Page = "gallery" | "upload";
