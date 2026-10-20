export const DEVELOPMENT_ENVIRONMENT = "development";
export const DEFAULT_PORT = 3001;
export const DEFAULT_IMAGE_CONTENT_TYPE = "application/octet-stream";
export const DEFAULT_PROVIDER_ENDPOINT = "http://localhost:2773";
export const DEFAULT_PROVIDER_TOKEN_FILE_PATH = "/var/run/awssmatoken";
export const DEFAULT_S3_REGION = "us-east-1";
export const DEFAULT_S3_KEY_PREFIX = "photos";
export const DATABASE_SECRET_ID_FALLBACK = "online-gallery-db-creds";
export const CURRENT_SECRET_VERSION_STAGE = "AWSCURRENT";
export const AWS_SECRETS_TOKEN_HEADER = "X-Aws-Parameters-Secrets-Token";
export const IMAGE_ENDPOINT_SUFFIX = "/image";
export const PHOTO_API_PREFIX = "/api/photos";
export const MAXIMUM_IMAGE_DIMENSION = 512;
export const WEBP_QUALITY = 82;
export const WEBP_CONTENT_TYPE = "image/webp";
export const IMAGE_DATA_URL_EXPRESSION = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/;
export const S3_MISSING_OBJECT_NAMES = [
    "NoSuchKey",
    "NotFound",
];
