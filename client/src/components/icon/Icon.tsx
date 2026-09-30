import { ReactElement } from "react";

interface IconProps { name: "arrow" | "image" | "plus" | "search" | "trash" | "upload"; }

/** Renders the small set of interface icons without adding a dependency. */
export function Icon({ name }: IconProps): ReactElement {
  const paths: Record<IconProps["name"], ReactElement> = {
    arrow: <path d="m9 18 6-6-6-6" />, image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.4" /><path d="m4 17 5-5 3.5 3.5 2.5-2.5 5 5" /></>, plus: <path d="M12 5v14M5 12h14" />, search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>, trash: <path d="M4 7h16M10 11v5M14 11v5M9 7l1-3h4l1 3M6 7l1 13h10l1-13" />, upload: <><path d="M12 16V4M8 8l4-4 4 4M5 15v4h14v-4" /></>,
  };
  return <svg aria-hidden="true" className="icon" fill="none" viewBox="0 0 24 24">{paths[name]}</svg>;
}
