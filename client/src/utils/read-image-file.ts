/** Reads an image file into a backend-storable data URL. */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", (): void => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The image could not be read.")));
    reader.addEventListener("error", (): void => reject(new Error("The image could not be read.")));
    reader.readAsDataURL(file);
  });
}
