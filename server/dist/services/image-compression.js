import sharp from "sharp";
import { MAXIMUM_IMAGE_DIMENSION, WEBP_CONTENT_TYPE, WEBP_QUALITY, } from "../constants.js";
/** Resizes an upload for efficient storage while preserving its aspect ratio. */
export async function compressImage(image) {
    const body = await sharp(image.body)
        .rotate()
        .resize({
        fit: "inside",
        height: MAXIMUM_IMAGE_DIMENSION,
        withoutEnlargement: true,
        width: MAXIMUM_IMAGE_DIMENSION,
    })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    return { body, contentType: WEBP_CONTENT_TYPE };
}
