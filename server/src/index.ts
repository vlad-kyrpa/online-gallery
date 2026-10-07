import express from "express";
import { S3Client } from "@aws-sdk/client-s3";
import { Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { InMemoryPhotoIndex } from "./in-memory-photo-index.js";
import { InMemoryPhotoStorage } from "./in-memory-photo-storage.js";
import { PhotoStorage } from "./photo-storage.js";
import { PhotoService } from "./photo-service.js";
import { registerClientStaticRoutes } from "./routes/client-routes.js";
import { createPhotoImageUrl } from "./routes/photo-route-paths.js";
import { registerPhotoRoutes } from "./routes/photo-routes.js";
import { S3PhotoStorage } from "./s3-photo-storage.js";

const defaultPort = 3001;
const defaultS3Region = "us-east-1";
const defaultS3KeyPrefix = "photos";
/** Converts the optional environment port into a safe listen port. */
function readPort(value: string | undefined): number {
  const parsedPort = Number(value);
  return Number.isInteger(parsedPort) && parsedPort > 0
    ? parsedPort
    : defaultPort;
}

/** Selects the configured S3 adapter or the local development fallback. */
function createPhotoStorage(environment: NodeJS.ProcessEnv): PhotoStorage {
  const bucketName = environment.AWS_S3_BUCKET_NAME?.trim();

  if (bucketName === undefined || bucketName === "") {
    return new InMemoryPhotoStorage();
  }

  const endpoint = environment.AWS_S3_ENDPOINT?.trim();
  const forcePathStyle = environment.AWS_S3_FORCE_PATH_STYLE === "true";

  const client = new S3Client({
    endpoint: endpoint === "" ? undefined : endpoint,
    forcePathStyle,
    region: environment.AWS_S3_REGION?.trim() || defaultS3Region,
  });

  return new S3PhotoStorage({
    bucketName,
    client,
    keyPrefix: environment.AWS_S3_KEY_PREFIX?.trim() || defaultS3KeyPrefix,
  });
}

const port = readPort(process.env.PORT);

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const clientBuildDirectory = path.resolve(
  currentDirectory,
  "../../client/build",
);

const service = new PhotoService({
  createImageUrl: createPhotoImageUrl,
  createId: (): string => crypto.randomUUID(),
  index: new InMemoryPhotoIndex(),
  storage: createPhotoStorage(process.env),
});

const app = express();

app.use(express.json({ limit: "8mb" }));

registerPhotoRoutes({ app, service });

registerClientStaticRoutes({ app, clientBuildDirectory });

/** Starts and explicitly retains the local HTTP server process. */
function startServer(): Server {
  const server = app.listen(port, (): void => {
    console.log(`Gallery API listening on port ${port}`);
  });
  server.on("error", (error: Error): void => {
    console.error("Gallery API could not start:", error.message);
  });
  server.ref();
  return server;
}

const server = startServer();

void server;
