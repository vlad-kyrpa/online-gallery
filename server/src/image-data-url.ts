import { StoredImage } from "./photo-storage.js";

const dataUrlExpression = /^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/;

/** Converts the client's data URL payload into an image asset for object storage. */
export function decodeImageDataUrl(imageUrl: string): StoredImage {
  const match = dataUrlExpression.exec(imageUrl);
  if (match === null) throw new Error("The image must be a base64 data URL.");
  const [, contentType, encodedImage] = match;
  return { body: Buffer.from(encodedImage, "base64"), contentType };
}
