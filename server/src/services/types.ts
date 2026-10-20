import { PhotoEntity } from "./photo-index/photo-index.js";

/** Names the JSON fields stored in the RDS credentials secret. */
export interface DatabaseCredentials {
  readonly database: string;
  readonly host: string;
  readonly password: string;
  readonly port: number;
  readonly username: string;
}

/** Holds RDS credentials when their backing secret exists. */
export type DatabaseCredentialsResult = DatabaseCredentials | undefined;

/** Represents the complete photo returned to API consumers. */
export interface Photo extends PhotoEntity {
  imageUrl: string;
}

/** Captures the data accepted when a new photo is created. */
export interface CreatePhotoInput {
  title: string;
  imageUrl: string;
}
