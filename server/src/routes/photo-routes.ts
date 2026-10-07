import { Express, Request, RequestHandler, Response } from "express";
import { compressImage } from "../image-compression.js";
import { decodeImageDataUrl } from "../image-data-url.js";
import { PhotoService } from "../photo-service.js";
import { CreatePhotoInput } from "../types.js";
import {
  createPhotoImageRoute,
  createPhotoRoute,
  photoApiPrefix,
} from "./photo-route-paths.js";

/** Groups the application dependencies required by the photo HTTP routes. */
export interface RegisterPhotoRoutesParameters {
  app: Express;
  service: PhotoService;
}

/** Registers the HTTP adapter for all gallery-photo operations. */
export function registerPhotoRoutes({ app, service }: RegisterPhotoRoutesParameters): void {
  app.get(photoApiPrefix, createListPhotosHandler(service));
  app.get(createPhotoImageRoute(), createGetImageHandler(service));
  app.get(createPhotoRoute(), createGetPhotoHandler(service));
  app.post(photoApiPrefix, createCreatePhotoHandler(service));
  app.delete(createPhotoRoute(), createDeletePhotoHandler(service));
}

/** Creates the handler that lists photo metadata and image-asset URLs. */
function createListPhotosHandler(service: PhotoService): RequestHandler {
  return async (_request: Request, response: Response): Promise<void> => {
    response.json(await service.findAll());
  };
}

/** Creates the handler that serves one native binary image asset. */
function createGetImageHandler(service: PhotoService): RequestHandler<{ id: string }> {
  return async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const image = await service.findImage(request.params.id);
    if (image === undefined) {
      response.sendStatus(404);
      return;
    }
    response.type(image.contentType).send(image.body);
  };
}

/** Creates the handler that returns one photo's metadata and image endpoint. */
function createGetPhotoHandler(service: PhotoService): RequestHandler<{ id: string }> {
  return async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    const photo = await service.find(request.params.id);
    if (photo === undefined) {
      response.sendStatus(404);
      return;
    }
    response.json(photo);
  };
}

/** Creates the handler that validates and stores one submitted image asset. */
function createCreatePhotoHandler(service: PhotoService): RequestHandler<unknown, unknown, CreatePhotoInput> {
  return async (
    request: Request<unknown, unknown, CreatePhotoInput>,
    response: Response,
  ): Promise<void> => {
    try {
      response.status(201).json(await service.create({
        image: await compressImage(decodeImageDataUrl(request.body.imageUrl.trim())),
        title: request.body.title,
      }));
    } catch (error: unknown) {
      response.status(400).json({
        message: error instanceof Error ? error.message : "Invalid photo.",
      });
    }
  };
}

/** Creates the handler that removes a photo and its corresponding image asset. */
function createDeletePhotoHandler(service: PhotoService): RequestHandler<{ id: string }> {
  return async (request: Request<{ id: string }>, response: Response): Promise<void> => {
    response.sendStatus((await service.delete(request.params.id)) ? 204 : 404);
  };
}
