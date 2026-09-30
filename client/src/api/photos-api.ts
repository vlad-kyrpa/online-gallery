import { ApiPhoto, CreatePhotoInput, Photo } from "../types";

const photosEndpoint = "/api/photos";

/** Narrows an unknown API value to a photo response. */
function isApiPhoto(value: unknown): value is ApiPhoto {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string" && typeof candidate.title === "string" && typeof candidate.imageUrl === "string";
}

/** Converts the server response into the presentation model. */
function toPhoto(photo: ApiPhoto): Photo {
  return { id: photo.id, title: photo.title, url: photo.imageUrl, alt: photo.title };
}

/** Fetches every photo currently held by the local backend. */
export async function fetchPhotos(): Promise<ReadonlyArray<Photo>> {
  const response = await fetch(photosEndpoint);
  const payload: unknown = await response.json();
  if (!response.ok || !Array.isArray(payload) || !payload.every(isApiPhoto)) throw new Error("Could not load the gallery.");
  return payload.map(toPhoto);
}

/** Sends a selected image and title to the local backend. */
export async function createPhoto(input: CreatePhotoInput): Promise<Photo> {
  const response = await fetch(photosEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const payload: unknown = await response.json();
  if (!response.ok || !isApiPhoto(payload)) throw new Error("Could not save the photo.");
  return toPhoto(payload);
}

/** Deletes one photo from the local backend. */
export async function removePhoto(id: string): Promise<void> {
  const response = await fetch(`${photosEndpoint}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Could not delete the photo.");
}
