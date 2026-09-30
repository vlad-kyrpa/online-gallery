import express, { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { InMemoryPhotoIndex, InMemoryPhotoStorage } from "./photo-storage.js";
import { PhotoService } from "./photo-service.js";
import { CreatePhotoInput } from "./types.js";

const apiPrefix = "/api/photos";
const defaultPort = 3001;
/** Converts the optional environment port into a safe listen port. */
function readPort(value: string | undefined): number {
  const parsedPort = Number(value);
  return Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : defaultPort;
}
const port = readPort(process.env.PORT);
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientBuildDirectory = path.resolve(
  currentDirectory,
  "../../client/build",
);
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
      response.status(400).json({
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
/** Serves the compiled client after API routes have been considered. */
app.use(express.static(clientBuildDirectory));
/** Returns the client shell for browser routes handled by React. */
app.get("/{*path}", (_request: Request, response: Response): void => {
  response.sendFile(path.join(clientBuildDirectory, "index.html"));
});

/** Starts the local HTTP server. */
function startServer(): void {
  app.listen(port, (): void => {
    console.log(`Gallery API listening on port ${port}`);
  });
}
startServer();
