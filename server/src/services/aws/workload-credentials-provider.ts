import { readFile } from "node:fs/promises";
import {
  AWS_SECRETS_TOKEN_HEADER,
  CURRENT_SECRET_VERSION_STAGE,
  DEFAULT_PROVIDER_ENDPOINT,
  DEFAULT_PROVIDER_TOKEN_FILE_PATH,
} from "../../constants.js";

const SECRET_NOT_FOUND_STATUS = 404;
const SECRET_NOT_FOUND_ERROR = "ResourceNotFoundException";

/** Gets a string secret, or undefined when AWS has no secret with that name. */
export const getSecret = async (
  secretId: string,
): Promise<string | undefined> => {
  const token = (await readFile(DEFAULT_PROVIDER_TOKEN_FILE_PATH, "utf8")).trim();

  if (token === "") {
    throw new Error("AWS Workload Credentials Provider token is empty");
  }

  const url = new URL("/secretsmanager/get", DEFAULT_PROVIDER_ENDPOINT);
  url.searchParams.set("secretId", secretId);
  url.searchParams.set("versionStage", CURRENT_SECRET_VERSION_STAGE);

  const response = await fetch(url, {
    headers: { [AWS_SECRETS_TOKEN_HEADER]: token },
  });
  const responseBody = await response.text();

  if (
    response.status === SECRET_NOT_FOUND_STATUS ||
    responseBody.includes(SECRET_NOT_FOUND_ERROR)
  ) {
    return undefined;
  }

  if (!response.ok) {
    throw new Error(
      `AWS Workload Credentials Provider returned HTTP ${response.status}`,
    );
  }

  const secretResponse = JSON.parse(responseBody) as unknown;
  const secretString =
    typeof secretResponse === "object" &&
    secretResponse !== null &&
    !Array.isArray(secretResponse)
      ? (secretResponse as { readonly SecretString?: unknown }).SecretString
      : undefined;

  if (typeof secretString !== "string") {
    throw new Error("Secret does not contain a string SecretString value");
  }

  return secretString;
};
