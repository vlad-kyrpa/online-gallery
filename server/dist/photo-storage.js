/** Keeps photo metadata in a V1 in-memory map index. */
export class InMemoryPhotoIndex {
    photos = new Map();
    /** Adds metadata to the lookup index. */
    create(photo) {
        this.photos.set(photo.id, photo);
        return photo;
    }
    /** Removes metadata from the lookup index. */
    delete(id) {
        return this.photos.delete(id);
    }
    /** Looks up indexed metadata by its photo id. */
    find(id) {
        return this.photos.get(id);
    }
    /** Returns a snapshot of all indexed metadata. */
    findAll() {
        return Array.from(this.photos.values());
    }
}
/** Keeps actual image data separately from the metadata index. */
export class InMemoryPhotoStorage {
    images = new Map();
    /** Removes the image associated with a photo id. */
    delete(id) {
        return this.images.delete(id);
    }
    /** Looks up image data without exposing the backing map. */
    find(id) {
        return this.images.get(id);
    }
    /** Stores the submitted image payload under its photo id. */
    save({ id, imageUrl }) {
        this.images.set(id, imageUrl);
    }
}
