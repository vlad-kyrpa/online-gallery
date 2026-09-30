import {
  ChangeEvent,
  FormEvent,
  ReactElement,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPhoto, fetchPhotos, removePhoto } from "./api/photos-api";
import { Icon } from "./components/icon/Icon";
import { GalleryView } from "./features/gallery/GalleryView";
import { UploadView } from "./features/upload/UploadView";
import { Page, Photo } from "./types";
import { readImageFile } from "./utils/read-image-file";
import "./App.css";

/** Filters titles without changing the original collection. */
function filterPhotos({
  photos,
  query,
}: {
  photos: ReadonlyArray<Photo>;
  query: string;
}): ReadonlyArray<Photo> {
  const normalizedQuery = query.trim().toLowerCase();
  return normalizedQuery === ""
    ? photos
    : photos.filter((photo) =>
        photo.title.toLowerCase().includes(normalizedQuery),
      );
}

/** Provides top-level state and composes the gallery's feature views. */
function App(): ReactElement {
  const [page, setPage] = useState<Page>("gallery");
  const [photos, setPhotos] = useState<ReadonlyArray<Photo>>([]);
  const [query, setQuery] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const visiblePhotos = useMemo(
    () => filterPhotos({ photos, query }),
    [photos, query],
  );

  /** Loads backend photos once when the application mounts. */
  useEffect(() => {
    void fetchPhotos()
      .then(setPhotos)
      .catch((error: unknown) =>
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not load the gallery.",
        ),
      );
  }, []);
  /** Changes the current view and resets temporary upload state. */
  const navigate = (nextPage: Page): void => {
    setPage(nextPage);
    setSelectedFile(null);
    setPreviewUrl("");
    setTitle("");
    setMessage("");
  };
  /** Creates the selected photo through the API and adds it to local state. */
  const savePhoto = async (
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    if (selectedFile === null || title.trim() === "" || previewUrl === "")
      return;
    try {
      const photo = await createPhoto({ title, imageUrl: previewUrl });
      setPhotos((currentPhotos) => [photo, ...currentPhotos]);
      navigate("gallery");
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Could not save the photo.",
      );
    }
  };
  /** Generates a data URL that can be previewed and persisted by the backend. */
  const selectFile = async (
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setMessage("");
    if (file === null) {
      setPreviewUrl("");
      return;
    }
    try {
      setPreviewUrl(await readImageFile(file));
    } catch (error: unknown) {
      setPreviewUrl("");
      setMessage(
        error instanceof Error ? error.message : "The image could not be read.",
      );
    }
  };
  /** Deletes a photo through the API and then removes it from local state. */
  const deletePhoto = async (id: string): Promise<void> => {
    try {
      await removePhoto(id);
      setPhotos((currentPhotos) =>
        currentPhotos.filter((photo) => photo.id !== id),
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Could not delete the photo.",
      );
    }
  };

  return (
    <main className="app-shell">
      <nav className="navbar" aria-label="Main navigation">
        <button
          className="brand"
          onClick={() => navigate("gallery")}
          type="button"
        >
          <span className="brand-mark">
            <Icon name="image" />
          </span>
          <span>
            frame<span className="brand-dot">.</span>archive
          </span>
        </button>
        <div className="nav-actions">
          <button
            className={page === "gallery" ? "nav-button active" : "nav-button"}
            onClick={() => navigate("gallery")}
            type="button"
          >
            Gallery
          </button>
          <button
            className="add-button"
            onClick={() => navigate("upload")}
            type="button"
          >
            <Icon name="plus" /> Add photo
          </button>
        </div>
      </nav>
      {page === "gallery" ? (
        <GalleryView
          message={message}
          onAddPhoto={() => navigate("upload")}
          onDeletePhoto={(id) => void deletePhoto(id)}
          onQueryChange={setQuery}
          photos={visiblePhotos}
          query={query}
        />
      ) : (
        <UploadView
          message={message}
          onBack={() => navigate("gallery")}
          onFileChange={(event) => void selectFile(event)}
          onSubmit={(event) => void savePhoto(event)}
          onTitleChange={setTitle}
          previewUrl={previewUrl}
          selectedFile={selectedFile}
          title={title}
        />
      )}
    </main>
  );
}

export default App;
