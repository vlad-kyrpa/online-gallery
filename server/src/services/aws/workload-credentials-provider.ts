import { readFile } from "node:fs/promises";
import {
  AWS_SECRETS_TOKEN_HEADER,
  CURRENT_SECRET_VERSION_STAGE,
  DEFAULT_PROVIDER_ENDPOINT,
  DEFAULT_PROVIDER_TOKEN_FILE_PATH,
} from "../../constants.js";
import {
  GetSecretStringParameters,
  SecretStringFailure,
  SecretStringResult,
  WorkloadCredentialsProviderConfig,
} from "./types.js";

type JsonObject = Record<string, unknown>;

/** Creates the production configuration for the local AWS secrets provider. */
export const createWorkloadCredentialsProviderConfig = (
  secretId: string,
): WorkloadCredentialsProviderConfig => ({
  endpoint: DEFAULT_PROVIDER_ENDPOINT,
  secretId,
  tokenFilePath: DEFAULT_PROVIDER_TOKEN_FILE_PATH,
  versionStage: CURRENT_SECRET_VERSION_STAGE,
});

/** Retrieves any text secret through the local AWS Workload Credentials Provider. */
export const getSecretString = async ({
  config,
  dependencies,
}: GetSecretStringParameters): Promise<SecretStringResult> => {
  const tokenResult = await readProviderToken({ config, dependencies });

  if (tokenResult.type === "secret-string-failure") {
    return tokenResult;
  }

  return requestSecret({
    config,
    fetch: dependencies.fetch,
    token: tokenResult.token,
  });
};

/** Provides Node's filesystem and fetch implementations for a production secret lookup. */
export const getProductionSecretString = (
  secretId: string,
): Promise<SecretStringResult> =>
  getSecretString({
    config: createWorkloadCredentialsProviderConfig(secretId),
    dependencies: {
      fetch,
      readFile,
    },
  });

/** Reads the SSRF token required by the localhost provider. */
const readProviderToken = async ({
  config,
  dependencies,
}: GetSecretStringParameters): Promise<
  | SecretStringFailure
  | { readonly type: "provider-token-success"; readonly token: string }
> => {
  try {
    const token = (
      await dependencies.readFile(config.tokenFilePath, "utf8")
    ).trim();

    return token === ""
      ? createFailure("AWS Workload Credentials Provider token is empty")
      : { type: "provider-token-success", token };
  } catch {
    return createFailure(
      "AWS Workload Credentials Provider token is unavailable",
    );
  }
};

/** Requests one configured secret from the localhost provider. */
const requestSecret = async ({
  config,
  fetch: request,
  token,
}: {
  readonly config: WorkloadCredentialsProviderConfig;
  readonly fetch: typeof fetch;
  readonly token: string;
}): Promise<SecretStringResult> => {
  try {
    const url = new URL("/secretsmanager/get", config.endpoint);
    url.searchParams.set("secretId", config.secretId);
    url.searchParams.set("versionStage", config.versionStage);

    const response = await request(url, {
      headers: { [AWS_SECRETS_TOKEN_HEADER]: token },
    });

    if (!response.ok) {
      return createFailure(
        `AWS Workload Credentials Provider returned HTTP ${response.status}`,
      );
    }

    return parseSecretResponse(await response.text());
  } catch {
    return createFailure("AWS Workload Credentials Provider is unavailable");
  }
};

/** Extracts a string secret from the Secrets Manager response envelope. */
const parseSecretResponse = (responseBody: string): SecretStringResult => {
  const parsedResponse = parseJson(responseBody);

  if (
    !isJsonObject(parsedResponse) ||
    typeof parsedResponse.SecretString !== "string"
  ) {
    return createFailure(
      "Secret does not contain a string SecretString value",
    );
  }

  return {
    type: "secret-string-success",
    secretString: parsedResponse.SecretString,
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

/** Produces failures that are useful to operators without revealing secret contents. */
const createFailure = (message: string): SecretStringFailure => ({
  type: "secret-string-failure",
  message,
});
