import { IMAGE_ENDPOINT_SUFFIX, PHOTO_API_PREFIX } from "../constants.js";
/** Builds the API URL used by browsers to request an image asset. */
export function createPhotoImageUrl(id) {
    return `${PHOTO_API_PREFIX}/${encodeURIComponent(id)}${IMAGE_ENDPOINT_SUFFIX}`;
}
/** Builds the route pattern used to serve one stored image asset. */
export function createPhotoImageRoute() {
    return `${PHOTO_API_PREFIX}/:id${IMAGE_ENDPOINT_SUFFIX}`;
}
/** Builds the route pattern used to address one photo's metadata. */
export function createPhotoRoute() {
    return `${PHOTO_API_PREFIX}/:id`;
}
