import sharp from "sharp";
const maximumImageDimension = 512;
const webpQuality = 82;
const webpContentType = "image/webp";
/** Resizes an upload for efficient storage while preserving its aspect ratio. */
export async function compressImage(image) {
    const body = await sharp(image.body)
        .rotate()
        .resize({
        fit: "inside",
        height: maximumImageDimension,
        withoutEnlargement: true,
        width: maximumImageDimension,
    })
        .webp({ quality: webpQuality })
        .toBuffer();
    return { body, contentType: webpContentType };
}
