import sharp from "sharp";
import { StoredImage } from "./photo-storage.js";

const maximumImageDimension = 512;
const webpQuality = 82;
const webpContentType = "image/webp";

/** Resizes an upload for efficient storage while preserving its aspect ratio. */
export async function compressImage(image: StoredImage): Promise<StoredImage> {
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
