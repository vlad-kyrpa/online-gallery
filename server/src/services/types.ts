import { PhotoEntity } from "./photo-index/photo-index.js";

/** Names the JSON fields stored in the RDS credentials secret. */
export interface DatabaseCredentials {
  readonly database: string;
  readonly host: string;
  readonly password: string;
  readonly port: number;
  readonly username: string;
}

/** Describes why the RDS credentials secret could not be loaded or validated. */
export interface DatabaseCredentialsFailure {
  readonly type: "database-credentials-failure";
  readonly message: string;
}

/** Holds successfully validated RDS credentials. */
export interface DatabaseCredentialsSuccess {
  readonly type: "database-credentials-success";
  readonly credentials: DatabaseCredentials;
}

/** Represents the safe outcome of loading RDS credentials from AWS Secrets Manager. */
export type DatabaseCredentialsResult =
  | DatabaseCredentialsFailure
  | DatabaseCredentialsSuccess;

/** Represents the complete photo returned to API consumers. */
export interface Photo extends PhotoEntity {
  imageUrl: string;
}

/** Captures the data accepted when a new photo is created. */
export interface CreatePhotoInput {
  title: string;
  imageUrl: string;
}
