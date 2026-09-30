import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { InMemoryPhotoIndex, InMemoryPhotoStorage } from "./photo-storage.js";
import { PhotoService } from "./photo-service.js";
const apiPrefix = "/api/photos";
const defaultPort = 3001;
/** Converts the optional environment port into a safe listen port. */
function readPort(value) {
    const parsedPort = Number(value);
    return Number.isInteger(parsedPort) && parsedPort > 0
        ? parsedPort
        : defaultPort;
}
const port = readPort(process.env.PORT);
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientBuildDirectory = path.resolve(currentDirectory, "../../client/build");
const service = new PhotoService({
    createId: () => crypto.randomUUID(),
    index: new InMemoryPhotoIndex(),
    storage: new InMemoryPhotoStorage(),
});
const app = express();
app.use(express.json({ limit: "8mb" }));
/** Lists the photos currently held in the in-memory gallery. */
app.get(apiPrefix, (_request, response) => {
    response.json(service.findAll());
});
/** Returns a photo and its stored image data by id. */
app.get(`${apiPrefix}/:id`, (request, response) => {
    const photo = service.find(request.params.id);
    if (photo === undefined) {
        response.sendStatus(404);
        return;
    }
    response.json(photo);
});
/** Creates a photo record using its title and image URL. */
app.post(apiPrefix, (request, response) => {
    try {
        response.status(201).json(service.create(request.body));
    }
    catch (error) {
        response.status(400).json({
            message: error instanceof Error ? error.message : "Invalid photo.",
        });
    }
});
/** Deletes a stored photo when it is present. */
app.delete(`${apiPrefix}/:id`, (request, response) => {
    response.sendStatus(service.delete(request.params.id) ? 204 : 404);
});
/** Serves the compiled client after API routes have been considered. */
app.use(express.static(clientBuildDirectory));
/** Returns the client shell for browser routes handled by React. */
app.get("/{*path}", (_request, response) => {
    response.sendFile(path.join(clientBuildDirectory, "index.html"));
});
/** Starts and explicitly retains the local HTTP server process. */
function startServer() {
    const server = app.listen(port, () => {
        console.log(`Gallery API listening on port ${port}`);
    });
    server.on("error", (error) => {
        console.error("Gallery API could not start:", error.message);
    });
    server.ref();
    return server;
}
const server = startServer();
void server;
