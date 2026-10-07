export const photoApiPrefix = "/api/photos";
const imageEndpointSuffix = "/image";
/** Builds the API URL used by browsers to request an image asset. */
export function createPhotoImageUrl(id) {
    return `${photoApiPrefix}/${encodeURIComponent(id)}${imageEndpointSuffix}`;
}
/** Builds the route pattern used to serve one stored image asset. */
export function createPhotoImageRoute() {
    return `${photoApiPrefix}/:id${imageEndpointSuffix}`;
}
/** Builds the route pattern used to address one photo's metadata. */
export function createPhotoRoute() {
    return `${photoApiPrefix}/:id`;
}
