import { decodeImageDataUrl } from "../image-data-url.js";
import { createPhotoImageRoute, createPhotoRoute, photoApiPrefix, } from "./photo-route-paths.js";
/** Registers the HTTP adapter for all gallery-photo operations. */
export function registerPhotoRoutes({ app, service }) {
    app.get(photoApiPrefix, createListPhotosHandler(service));
    app.get(createPhotoImageRoute(), createGetImageHandler(service));
    app.get(createPhotoRoute(), createGetPhotoHandler(service));
    app.post(photoApiPrefix, createCreatePhotoHandler(service));
    app.delete(createPhotoRoute(), createDeletePhotoHandler(service));
}
/** Creates the handler that lists photo metadata and image-asset URLs. */
function createListPhotosHandler(service) {
    return async (_request, response) => {
        response.json(await service.findAll());
    };
}
/** Creates the handler that serves one native binary image asset. */
function createGetImageHandler(service) {
    return async (request, response) => {
        const image = await service.findImage(request.params.id);
        if (image === undefined) {
            response.sendStatus(404);
            return;
        }
        response.type(image.contentType).send(image.body);
    };
}
/** Creates the handler that returns one photo's metadata and image endpoint. */
function createGetPhotoHandler(service) {
    return async (request, response) => {
        const photo = await service.find(request.params.id);
        if (photo === undefined) {
            response.sendStatus(404);
            return;
        }
        response.json(photo);
    };
}
/** Creates the handler that validates and stores one submitted image asset. */
function createCreatePhotoHandler(service) {
    return async (request, response) => {
        try {
            response.status(201).json(await service.create({
                image: decodeImageDataUrl(request.body.imageUrl.trim()),
                title: request.body.title,
            }));
        }
        catch (error) {
            response.status(400).json({
                message: error instanceof Error ? error.message : "Invalid photo.",
            });
        }
    };
}
/** Creates the handler that removes a photo and its corresponding image asset. */
function createDeletePhotoHandler(service) {
    return async (request, response) => {
        response.sendStatus((await service.delete(request.params.id)) ? 204 : 404);
    };
}
