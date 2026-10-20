import { getSecret } from "./aws/secrets-manager.js";
import { DatabaseCredentials, DatabaseCredentialsResult } from "./types.js";

type JsonObject = Record<string, unknown>;

/** Loads and validates the JSON credentials used to connect to the RDS database. */
export const getProductionDatabaseCredentials = async (
  secretId: string,
): Promise<DatabaseCredentialsResult> => {
  const secretString = await getSecret(secretId);

  return secretString === undefined
    ? undefined
    : parseDatabaseCredentials(secretString);
};

/** Validates the expected RDS JSON payload before it reaches database infrastructure. */
const parseDatabaseCredentials = (secretString: string): DatabaseCredentials => {
  const secret = JSON.parse(secretString) as unknown;

  if (!isJsonObject(secret)) {
    throw new Error("Database secret must be a JSON object");
  }

  const database = typeof secret.dbname === "string" ? secret.dbname : secret.database;

  if (
    typeof secret.host !== "string" ||
    !isValidPort(secret.port) ||
    typeof database !== "string" ||
    typeof secret.username !== "string" ||
    typeof secret.password !== "string"
  ) {
    throw new Error("Database secret has an invalid credentials shape");
  }

  return {
    database,
    host: secret.host,
    password: secret.password,
    port: secret.port,
    username: secret.username,
  };
};

/** Narrows an unknown parsed value to an object with string keys. */
const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Confirms the secret's port is a usable PostgreSQL TCP port. */
const isValidPort = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 65_535;
