/** Coordinates photo metadata indexing with actual image storage. */
export class PhotoService {
    createImageUrl;
    createId;
    index;
    storage;
    /** Receives independent index, storage, and identifier dependencies. */
    constructor({ createId, createImageUrl, index, storage }) {
        this.createId = createId;
        this.createImageUrl = createImageUrl;
        this.index = index;
        this.storage = storage;
    }
    /** Saves image data and metadata together under one generated id. */
    async create(input) {
        const title = input.title.trim();
        if (title === "")
            throw new Error("A title is required.");
        const id = this.createId();
        const photo = { id, title };
        await this.storage.save({ id, image: input.image });
        this.index.create(photo);
        return this.toPhoto(photo);
    }
    /** Removes metadata and its corresponding image payload. */
    async delete(id) {
        const wasIndexed = this.index.delete(id);
        await this.storage.delete(id);
        return wasIndexed;
    }
    /** Retrieves one photo's metadata and its stable image-asset endpoint. */
    async find(id) {
        const photo = this.index.find(id);
        return photo === undefined ? undefined : this.toPhoto(photo);
    }
    /** Lists metadata with image-asset endpoints without downloading image bytes. */
    async findAll() {
        return this.index.findAll().map((photo) => this.toPhoto(photo));
    }
    /** Retrieves the raw image asset only when its metadata record still exists. */
    async findImage(id) {
        return this.index.find(id) === undefined ? undefined : this.storage.read(id);
    }
    /** Builds the public API representation without coupling storage to routing. */
    toPhoto(photo) {
        return { ...photo, imageUrl: this.createImageUrl(photo.id) };
    }
}
