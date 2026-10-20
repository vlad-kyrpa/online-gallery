import { getProductionSecretString } from "./aws/workload-credentials-provider.js";
import { DatabaseCredentialsFailure, DatabaseCredentialsResult } from "./types.js";

type JsonObject = Record<string, unknown>;

/** Loads and validates the JSON credentials used to connect to the RDS database. */
export const getProductionDatabaseCredentials = async (
  secretId: string,
): Promise<DatabaseCredentialsResult> => {
  const secretResult = await getProductionSecretString(secretId);

  return secretResult.type === "secret-string-failure"
    ? createFailure(secretResult.message)
    : parseDatabaseCredentials(secretResult.secretString);
};

/** Validates the expected RDS JSON payload before it reaches database infrastructure. */
const parseDatabaseCredentials = (secretString: string): DatabaseCredentialsResult => {
  const secret = parseJson(secretString);

  if (!isJsonObject(secret)) {
    return createFailure("Database secret must be a JSON object");
  }

  const database = typeof secret.dbname === "string" ? secret.dbname : secret.database;

  if (
    typeof secret.host !== "string" ||
    !isValidPort(secret.port) ||
    typeof database !== "string" ||
    typeof secret.username !== "string" ||
    typeof secret.password !== "string"
  ) {
    return createFailure("Database secret has an invalid credentials shape");
  }

  return {
    type: "database-credentials-success",
    credentials: {
      database,
      host: secret.host,
      password: secret.password,
      port: secret.port,
      username: secret.username,
    },
  };
};

/** Parses untrusted JSON without allowing parse errors to escape the adapter. */
const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
};

/** Narrows an unknown parsed value to an object with string keys. */
const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Confirms the secret's port is a usable PostgreSQL TCP port. */
const isValidPort = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 65_535;

/** Produces failures that are useful to operators without revealing credentials. */
const createFailure = (message: string): DatabaseCredentialsFailure => ({
  type: "database-credentials-failure",
  message,
});
