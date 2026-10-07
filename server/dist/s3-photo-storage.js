import { DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, } from "@aws-sdk/client-s3";
const defaultImageContentType = "application/octet-stream";
const s3MissingObjectNames = new Set(["NoSuchKey", "NotFound"]);
/** Builds a stable, namespaced S3 key from a gallery photo id. */
function createImageKey({ id, keyPrefix, }) {
    return `${keyPrefix}/${id}`;
}
/** Identifies S3 errors that mean an object was already absent. */
function isMissingS3Object(error) {
    return error instanceof Error && s3MissingObjectNames.has(error.name);
}
/** Narrows an SDK response body to its byte-conversion capability. */
function hasByteTransformer(body) {
    return (typeof body === "object" &&
        body !== null &&
        "transformToByteArray" in body &&
        typeof body.transformToByteArray === "function");
}
/** Narrows generic S3 client output to the fields returned by GetObject. */
function isGetObjectResult(value) {
    return typeof value === "object" && value !== null && "Body" in value;
}
/** Narrows generic S3 client output to the object keys returned by ListObjectsV2. */
function isListObjectsResult(value) {
    return typeof value === "object" && value !== null && "Contents" in value;
}
/** Implements image persistence in a private S3-compatible object bucket. */
export class S3PhotoStorage {
    bucketName;
    client;
    keyPrefix;
    /** Receives the object-store connection and gallery-specific bucket settings. */
    constructor(config) {
        this.bucketName = config.bucketName;
        this.client = config.client;
        this.keyPrefix = config.keyPrefix;
    }
    /** Deletes the stored object and treats an absent object as a normal result. */
    async delete(id) {
        try {
            await this.client.send(new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: createImageKey({ id, keyPrefix: this.keyPrefix }),
            }));
            return true;
        }
        catch (error) {
            if (isMissingS3Object(error)) {
                return false;
            }
            throw error;
        }
    }
    /** Lists stored photo identifiers in the configured key namespace. */
    async list() {
        const result = await this.client.send(new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: `${this.keyPrefix}/`,
        }));
        if (!isListObjectsResult(result)) {
            throw new Error("S3 returned an invalid object list.");
        }
        const keyPrefix = `${this.keyPrefix}/`;
        return (result.Contents || []).flatMap((object) => {
            const key = object.Key;
            if (key === undefined) {
                console.warn("S3 object does not have a key");
                return [];
            }
            return key.startsWith(keyPrefix) ? [key.slice(keyPrefix.length)] : [];
        });
    }
    /** Downloads an image as raw bytes and its stored content type. */
    async read(id) {
        try {
            const result = await this.client.send(new GetObjectCommand({
                Bucket: this.bucketName,
                Key: createImageKey({ id, keyPrefix: this.keyPrefix }),
            }));
            if (!isGetObjectResult(result) || !hasByteTransformer(result.Body)) {
                throw new Error("S3 returned an image without a readable body.");
            }
            const imageBytes = await result.Body.transformToByteArray();
            const contentType = result.ContentType || defaultImageContentType;
            return { body: imageBytes, contentType };
        }
        catch (error) {
            if (isMissingS3Object(error)) {
                return undefined;
            }
            throw error;
        }
    }
    /** Uploads an image's raw bytes with its content type preserved for later reads. */
    async save({ id, image }) {
        await this.client.send(new PutObjectCommand({
            Body: image.body,
            Bucket: this.bucketName,
            ContentType: image.contentType,
            Key: createImageKey({ id, keyPrefix: this.keyPrefix }),
        }));
    }
}
