import express, { Request, Response } from "express";
import { InMemoryPhotoIndex, InMemoryPhotoStorage } from "./photo-storage.js";
import { PhotoService } from "./photo-service.js";
import { CreatePhotoInput } from "./types.js";

const apiPrefix = "/api/photos";
const port = 3001;
const service = new PhotoService({
  createId: (): string => crypto.randomUUID(),
  index: new InMemoryPhotoIndex(),
  storage: new InMemoryPhotoStorage(),
});
const app = express();
app.use(express.json({ limit: "8mb" }));

/** Lists the photos currently held in the in-memory gallery. */
app.get(apiPrefix, (_request: Request, response: Response): void => {
  response.json(service.findAll());
});
/** Returns a photo and its stored image data by id. */
app.get(
  `${apiPrefix}/:id`,
  (request: Request<{ id: string }>, response: Response): void => {
    const photo = service.find(request.params.id);
    if (photo === undefined) {
      response.sendStatus(404);
      return;
    }
    response.json(photo);
  },
);
/** Creates a photo record using its title and image URL. */
app.post(
  apiPrefix,
  (
    request: Request<unknown, unknown, CreatePhotoInput>,
    response: Response,
  ): void => {
    try {
      response.status(201).json(service.create(request.body));
    } catch (error: unknown) {
      response
        .status(400)
        .json({
          message: error instanceof Error ? error.message : "Invalid photo.",
        });
    }
  },
);
/** Deletes a stored photo when it is present. */
app.delete(
  `${apiPrefix}/:id`,
  (request: Request<{ id: string }>, response: Response): void => {
    response.sendStatus(service.delete(request.params.id) ? 204 : 404);
  },
);

/** Starts the local HTTP server. */
function startServer(): void {
  app.listen(port, (): void => {
    console.log(`Gallery API listening on port ${port}`);
  });
}
startServer();
