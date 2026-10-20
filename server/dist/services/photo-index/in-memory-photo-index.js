/** Keeps photo metadata in a V1 in-memory map index. */
export class InMemoryPhotoIndex {
    photos = new Map();
    /** Adds metadata to the lookup index. */
    async create(photo) {
        this.photos.set(photo.id, photo);
        return photo;
    }
    /** Removes metadata from the lookup index. */
    async delete(id) {
        return this.photos.delete(id);
    }
    /** Looks up indexed metadata by its photo id. */
    async find(id) {
        return this.photos.get(id);
    }
    /** Returns a snapshot of all indexed metadata. */
    async findAll() {
        return Array.from(this.photos.values());
    }
}
