import { ChangeEvent, FormEvent, ReactElement } from "react";
import { Icon } from "../../components/icon/Icon";

interface UploadViewProps {
  message: string;
  onBack: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (title: string) => void;
  previewUrl: string;
  selectedFile: File | null;
  title: string;
}

/** Renders the image selection form and its temporary preview. */
export function UploadView({ message, onBack, onFileChange, onSubmit, onTitleChange, previewUrl, selectedFile, title }: UploadViewProps): ReactElement {
  return <section className="upload-view" aria-labelledby="upload-heading"><button className="back-button" onClick={onBack} type="button"><span><Icon name="arrow" /></span> Back to gallery</button><div className="upload-layout"><div className="upload-copy"><p className="eyebrow">Add to the archive</p><h1 id="upload-heading">Keep what<br /><em>inspires you.</em></h1><p>Give your image a name, then it will be waiting here whenever you want to return to it.</p></div><form className="upload-form" onSubmit={onSubmit}><label className={previewUrl === "" ? "dropzone" : "dropzone has-preview"}><input accept="image/*" onChange={onFileChange} type="file" />{previewUrl === "" ? <><span className="upload-icon"><Icon name="upload" /></span><strong>Choose an image</strong><span>PNG, JPG or WEBP</span></> : <><img alt="Selected upload preview" src={previewUrl} /><span className="replace-image">Replace image</span></>}</label><label className="title-field"><span>Title</span><input onChange={(event) => onTitleChange(event.target.value)} placeholder="e.g. Sunlit afternoon" value={title} /></label>{message !== "" && <p className="status-message" role="status">{message}</p>}<button className="save-button" disabled={selectedFile === null || title.trim() === ""} type="submit">Add to gallery <Icon name="arrow" /></button></form></div></section>;
}
