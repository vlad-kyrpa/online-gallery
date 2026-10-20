import express from "express";
import { S3Client } from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { readFile } from "node:fs/promises";
import { Server } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import {
  DATABASE_SECRET_ID_FALLBACK,
  DEFAULT_PORT,
  DEFAULT_S3_KEY_PREFIX,
  DEFAULT_S3_REGION,
  DEVELOPMENT_ENVIRONMENT,
} from "./constants.js";
import { getProductionDatabaseCredentials } from "./services/database-credentials.js";
import * as databaseSchema from "./services/photo-index/db-types.js";
import { DrizzlePhotoIndex } from "./services/photo-index/drizzle-photo-index.js";
import { InMemoryPhotoIndex } from "./services/photo-index/in-memory-photo-index.js";
import { PhotoIndex } from "./services/photo-index/photo-index.js";
import { InMemoryPhotoStorage } from "./services/photo-storage/in-memory-photo-storage.js";
import { PhotoStorage } from "./services/photo-storage/photo-storage.js";
import { PhotoService } from "./services/photo-service.js";
import { registerClientStaticRoutes } from "./routes/client-routes.js";
import { registerErrorRoutes } from "./routes/error-routes.js";
import { createPhotoImageUrl } from "./routes/photo-route-paths.js";
import { registerPhotoRoutes } from "./routes/photo-routes.js";
import { S3PhotoStorage } from "./services/photo-storage/s3-photo-storage.js";


/** Owns a photo index and releases its database resources during shutdown. */
interface PhotoIndexResources {
  readonly close: () => Promise<void>;
  readonly index: PhotoIndex;
}

/** Bundles the inputs required to create the RDS-backed photo metadata index. */
interface CreateProductionPhotoIndexParameters {
  readonly environment: NodeJS.ProcessEnv;
  readonly migrationsDirectory: string;
}
/** Converts the optional environment port into a safe listen port. */
function readPort(value: string | undefined): number {
  const parsedPort = Number(value);
  return Number.isInteger(parsedPort) && parsedPort > 0
    ? parsedPort
    : DEFAULT_PORT;
}

/** Selects the configured S3 adapter or the local development fallback. */
function createPhotoStorage(environment: NodeJS.ProcessEnv): PhotoStorage {
  const bucketName = environment.AWS_S3_BUCKET_NAME?.trim();

  if (bucketName === undefined || bucketName === "") {
    console.warn(
      "[Storage] Using in-memory photo storage because AWS_S3_BUCKET_NAME is not configured.",
    );
    return new InMemoryPhotoStorage();
  }

  const endpoint = environment.AWS_S3_ENDPOINT?.trim();
  const forcePathStyle = environment.AWS_S3_FORCE_PATH_STYLE === "true";
  const region = environment.AWS_S3_REGION?.trim() || DEFAULT_S3_REGION;
  const keyPrefix = environment.AWS_S3_KEY_PREFIX?.trim() || DEFAULT_S3_KEY_PREFIX;

  console.info("[Storage] Configuring S3 photo storage", {
    bucketName,
    credentialSource: "AWS SDK default credential provider chain",
    endpoint: endpoint === "" ? "AWS default endpoint" : endpoint,
    forcePathStyle,
    keyPrefix,
    region,
  });

  const client = new S3Client({
    endpoint: endpoint === "" ? undefined : endpoint,
    forcePathStyle,
    region,
  });

  return new S3PhotoStorage({
    bucketName,
    client,
    keyPrefix,
  });
}

/** Selects the in-memory development index or a migrated RDS-backed index. */
async function createPhotoIndex({
  environment,
  migrationsDirectory,
}: CreateProductionPhotoIndexParameters): Promise<PhotoIndexResources> {
  if (environment.NODE_ENV === DEVELOPMENT_ENVIRONMENT) {
    return {
      close: async (): Promise<void> => undefined,
      index: new InMemoryPhotoIndex(),
    };
  }

  return createProductionPhotoIndex({ environment, migrationsDirectory });
}

/** Connects to RDS, applies pending SQL migrations, and exposes its metadata adapter. */
async function createProductionPhotoIndex({
  environment,
  migrationsDirectory,
}: CreateProductionPhotoIndexParameters): Promise<PhotoIndexResources> {
  const secretId =
    environment.AWS_DATABASE_SECRET_ID?.trim() || DATABASE_SECRET_ID_FALLBACK;
  const credentials = await getProductionDatabaseCredentials(secretId);

  if (credentials === undefined) {
    throw new Error(`Database secret was not found: ${secretId}`);
  }

  // The RDS CA bundle lets PostgreSQL verify the database server during TLS.
  const certificatePath = environment.AWS_RDS_CA_CERTIFICATE_PATH?.trim();

  if (certificatePath === undefined || certificatePath === "") {
    throw new Error("AWS_RDS_CA_CERTIFICATE_PATH must be set outside development");
  }

  const certificateAuthority = await readFile(certificatePath, "utf8");
  const pool = new Pool({
    database: credentials.database,
    host: credentials.host,
    password: credentials.password,
    port: credentials.port,
    ssl: {
      ca: certificateAuthority,
      rejectUnauthorized: true,
    },
    user: credentials.username,
  });

  try {
    const database = drizzle({ client: pool, schema: databaseSchema });
    await migrate(database, { migrationsFolder: migrationsDirectory });

    return {
      close: (): Promise<void> => pool.end(),
      index: new DrizzlePhotoIndex({ database }),
    };
  } catch (error: unknown) {
    await pool.end();
    throw error;
  }
}

/** Starts and explicitly retains the local HTTP server process. */
function startServer({ app, port }: { app: express.Express; port: number }): Server {
  const server = app.listen(port, (): void => {
    console.log(`Gallery API listening on port ${port}`);
  });
  server.on("error", (error: Error): void => {
    console.error("Gallery API could not start:", error.message);
  });
  server.ref();
  return server;
}

/** Starts the HTTP server only after its persistence layer is ready. */
async function startApplication(): Promise<void> {
  const port = readPort(process.env.PORT);
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const clientBuildDirectory = path.resolve(currentDirectory, "../../client/build");
  const migrationsDirectory = path.resolve(currentDirectory, "../drizzle");
  const photoIndex = await createPhotoIndex({
    environment: process.env,
    migrationsDirectory,
  });
  const service = new PhotoService({
    createImageUrl: createPhotoImageUrl,
    createId: (): string => crypto.randomUUID(),
    index: photoIndex.index,
    storage: createPhotoStorage(process.env),
  });
  const app = express();

  app.use(express.json({ limit: "8mb" }));
  registerPhotoRoutes({ app, service });
  registerClientStaticRoutes({ app, clientBuildDirectory });
  registerErrorRoutes({ app });

  const server = startServer({ app, port });
  const shutdown = (): void => {
    server.close((): void => {
      void photoIndex.close();
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void startApplication().catch((error: unknown): void => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error("Gallery API could not start:", message);
  process.exitCode = 1;
});
