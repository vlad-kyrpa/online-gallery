import express from "express";
import { S3Client } from "@aws-sdk/client-s3";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { DATABASE_SECRET_ID_FALLBACK, DEFAULT_PORT, DEFAULT_S3_KEY_PREFIX, DEFAULT_S3_REGION, DEVELOPMENT_ENVIRONMENT, } from "./constants.js";
import { getProductionDatabaseCredentials } from "./services/database-credentials.js";
import * as databaseSchema from "./services/photo-index/db-types.js";
import { DrizzlePhotoIndex } from "./services/photo-index/drizzle-photo-index.js";
import { InMemoryPhotoIndex } from "./services/photo-index/in-memory-photo-index.js";
import { InMemoryPhotoStorage } from "./services/photo-storage/in-memory-photo-storage.js";
import { PhotoService } from "./services/photo-service.js";
import { registerClientStaticRoutes } from "./routes/client-routes.js";
import { registerErrorRoutes } from "./routes/error-routes.js";
import { createPhotoImageUrl } from "./routes/photo-route-paths.js";
import { registerPhotoRoutes } from "./routes/photo-routes.js";
import { S3PhotoStorage } from "./services/photo-storage/s3-photo-storage.js";
/** Converts the optional environment port into a safe listen port. */
function readPort(value) {
    const parsedPort = Number(value);
    return Number.isInteger(parsedPort) && parsedPort > 0
        ? parsedPort
        : DEFAULT_PORT;
}
/** Selects the configured S3 adapter or the local development fallback. */
function createPhotoStorage(environment) {
    const bucketName = environment.AWS_S3_BUCKET_NAME?.trim();
    if (bucketName === undefined || bucketName === "") {
        console.warn("[Storage] Using in-memory photo storage because AWS_S3_BUCKET_NAME is not configured.");
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
async function createPhotoIndex({ environment, migrationsDirectory, }) {
    if (environment.NODE_ENV === DEVELOPMENT_ENVIRONMENT) {
        return {
            close: async () => undefined,
            index: new InMemoryPhotoIndex(),
        };
    }
    return createProductionPhotoIndex({ environment, migrationsDirectory });
}
/** Connects to RDS, applies pending SQL migrations, and exposes its metadata adapter. */
async function createProductionPhotoIndex({ environment, migrationsDirectory, }) {
    const secretId = environment.AWS_DATABASE_SECRET_ID?.trim() || DATABASE_SECRET_ID_FALLBACK;
    const credentialsResult = await getProductionDatabaseCredentials(secretId);
    if (credentialsResult.type === "database-credentials-failure") {
        throw new Error(credentialsResult.message);
    }
    const certificatePath = environment.AWS_RDS_CA_CERTIFICATE_PATH?.trim();
    if (certificatePath === undefined || certificatePath === "") {
        throw new Error("AWS_RDS_CA_CERTIFICATE_PATH must be set outside development");
    }
    const certificateAuthority = await readFile(certificatePath, "utf8");
    const pool = new Pool({
        database: credentialsResult.credentials.database,
        host: credentialsResult.credentials.host,
        password: credentialsResult.credentials.password,
        port: credentialsResult.credentials.port,
        ssl: {
            ca: certificateAuthority,
            rejectUnauthorized: true,
        },
        user: credentialsResult.credentials.username,
    });
    try {
        const database = drizzle({ client: pool, schema: databaseSchema });
        await migrate(database, { migrationsFolder: migrationsDirectory });
        return {
            close: () => pool.end(),
            index: new DrizzlePhotoIndex({ database }),
        };
    }
    catch (error) {
        await pool.end();
        throw error;
    }
}
/** Starts and explicitly retains the local HTTP server process. */
function startServer({ app, port }) {
    const server = app.listen(port, () => {
        console.log(`Gallery API listening on port ${port}`);
    });
    server.on("error", (error) => {
        console.error("Gallery API could not start:", error.message);
    });
    server.ref();
    return server;
}
/** Starts the HTTP server only after its persistence layer is ready. */
async function startApplication() {
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
        createId: () => crypto.randomUUID(),
        index: photoIndex.index,
        storage: createPhotoStorage(process.env),
    });
    const app = express();
    app.use(express.json({ limit: "8mb" }));
    registerPhotoRoutes({ app, service });
    registerClientStaticRoutes({ app, clientBuildDirectory });
    registerErrorRoutes({ app });
    const server = startServer({ app, port });
    const shutdown = () => {
        server.close(() => {
            void photoIndex.close();
        });
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
}
void startApplication().catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown startup error";
    console.error("Gallery API could not start:", message);
    process.exitCode = 1;
});
