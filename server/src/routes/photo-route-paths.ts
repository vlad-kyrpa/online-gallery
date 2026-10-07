import { PhotoId } from "../types.js";

export const photoApiPrefix = "/api/photos";
const imageEndpointSuffix = "/image";

/** Builds the API URL used by browsers to request an image asset. */
export function createPhotoImageUrl(id: PhotoId): string {
  return `${photoApiPrefix}/${encodeURIComponent(id)}${imageEndpointSuffix}`;
}

/** Builds the route pattern used to serve one stored image asset. */
export function createPhotoImageRoute(): string {
  return `${photoApiPrefix}/:id${imageEndpointSuffix}`;
}

/** Builds the route pattern used to address one photo's metadata. */
export function createPhotoRoute(): string {
  return `${photoApiPrefix}/:id`;
}
