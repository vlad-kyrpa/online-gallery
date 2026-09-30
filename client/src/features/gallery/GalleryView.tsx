import { ChangeEvent, ReactElement } from "react";
import { Icon } from "../../components/icon/Icon";
import { Photo } from "../../types";

interface GalleryViewProps {
  message: string;
  onAddPhoto: () => void;
  onDeletePhoto: (id: string) => void;
  onQueryChange: (query: string) => void;
  photos: ReadonlyArray<Photo>;
  query: string;
}

/** Renders the searchable photo library and its empty state. */
export function GalleryView({ message, onAddPhoto, onDeletePhoto, onQueryChange, photos, query }: GalleryViewProps): ReactElement {
  /** Forwards search text without exposing the input event to the parent. */
  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>): void => onQueryChange(event.target.value);
  return <section className="gallery-view" aria-labelledby="gallery-heading"><div className="gallery-intro"><p className="eyebrow">Your visual library</p><h1 id="gallery-heading">A home for every<br /><em>good image.</em></h1><p className="intro-copy">Keep the moments, places and ideas that move you — all in one quietly beautiful space.</p></div><div className="gallery-tools"><label className="search-box"><Icon name="search" /><span className="visually-hidden">Search your gallery</span><input onChange={handleQueryChange} placeholder="Search your gallery" type="search" value={query} /></label><span className="photo-count">{photos.length} {photos.length === 1 ? "photo" : "photos"}</span></div>{message !== "" && <p className="status-message" role="status">{message}</p>}{photos.length > 0 ? <div className="photo-grid">{photos.map((photo) => <article className="photo-card" key={photo.id}><img alt={photo.alt} src={photo.url} /><div className="photo-meta"><h2>{photo.title}</h2><button aria-label={`Delete ${photo.title}`} className="delete-button" onClick={() => onDeletePhoto(photo.id)} type="button"><Icon name="trash" /></button></div></article>)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="image" /></span><h2>No images found</h2><p>Upload the first image to begin your archive.</p><button className="add-button" onClick={onAddPhoto} type="button"><Icon name="plus" /> Add photo</button></div>}</section>;
}
