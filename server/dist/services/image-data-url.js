import { IMAGE_DATA_URL_EXPRESSION } from "../constants.js";
/** Converts the client's data URL payload into an image asset for object storage. */
export function decodeImageDataUrl(imageUrl) {
    const match = IMAGE_DATA_URL_EXPRESSION.exec(imageUrl);
    if (match === null)
        throw new Error("The image must be a base64 data URL.");
    const [, contentType, encodedImage] = match;
    return { body: Buffer.from(encodedImage, "base64"), contentType };
}
