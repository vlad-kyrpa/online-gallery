/** Keeps actual image data separately from the metadata index. */
export class InMemoryPhotoStorage {
    images = new Map();
    /** Removes the image associated with a photo id. */
    async delete(id) {
        return this.images.delete(id);
    }
    /** Lists identifiers whose image payloads are currently stored. */
    async list() {
        return Array.from(this.images.keys());
    }
    /** Looks up image data without exposing the backing map. */
    async read(id) {
        return this.images.get(id);
    }
    /** Stores the submitted image payload under its photo id. */
    async save({ id, image }) {
        this.images.set(id, image);
    }
}
