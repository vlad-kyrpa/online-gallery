/** Coordinates photo metadata indexing with actual image storage. */
export class PhotoService {
    createId;
    index;
    storage;
    /** Receives independent index, storage, and identifier dependencies. */
    constructor({ createId, index, storage }) {
        this.createId = createId;
        this.index = index;
        this.storage = storage;
    }
    /** Saves image data and metadata together under one generated id. */
    create(input) {
        const title = input.title.trim();
        const imageUrl = input.imageUrl.trim();
        if (title === "" || imageUrl === "")
            throw new Error("A title and image URL are required.");
        const id = this.createId();
        const photo = { id, title };
        this.storage.save({ id, imageUrl });
        this.index.create(photo);
        return { ...photo, imageUrl };
    }
    /** Removes metadata and its corresponding image payload. */
    delete(id) {
        const wasIndexed = this.index.delete(id);
        this.storage.delete(id);
        return wasIndexed;
    }
    /** Retrieves one photo by combining its metadata and stored image payload. */
    find(id) {
        const photo = this.index.find(id);
        const imageUrl = this.storage.find(id);
        return photo === undefined || imageUrl === undefined ? undefined : { ...photo, imageUrl };
    }
    /** Combines indexed metadata with separately stored image payloads. */
    findAll() {
        return this.index.findAll().flatMap((photo) => {
            const imageUrl = this.storage.find(photo.id);
            return imageUrl === undefined ? [] : [{ ...photo, imageUrl }];
        });
    }
}
