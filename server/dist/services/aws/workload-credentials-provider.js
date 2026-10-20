import { readFile } from "node:fs/promises";
import { AWS_SECRETS_TOKEN_HEADER, CURRENT_SECRET_VERSION_STAGE, DEFAULT_PROVIDER_ENDPOINT, DEFAULT_PROVIDER_TOKEN_FILE_PATH, } from "../../constants.js";
/** Creates the production configuration for the local AWS secrets provider. */
export const createCredentialsProviderConfig = (secretId) => ({
    endpoint: DEFAULT_PROVIDER_ENDPOINT,
    secretId,
    tokenFilePath: DEFAULT_PROVIDER_TOKEN_FILE_PATH,
    versionStage: CURRENT_SECRET_VERSION_STAGE,
});
/** Retrieves any text secret through the local AWS Workload Credentials Provider. */
export const getSecretString = async ({ config, dependencies, }) => {
    const token = await readToken({ config, dependencies });
    if (typeof token !== "string") {
        return token;
    }
    try {
        const url = new URL("/secretsmanager/get", config.endpoint);
        url.searchParams.set("secretId", config.secretId);
        url.searchParams.set("versionStage", config.versionStage);
        const response = await dependencies.fetch(url, {
            headers: { [AWS_SECRETS_TOKEN_HEADER]: token },
        });
        if (!response.ok) {
            return createFailure(`AWS Workload Credentials Provider returned HTTP ${response.status}`);
        }
        return parseSecretString(await response.text());
    }
    catch {
        return createFailure("AWS Workload Credentials Provider is unavailable");
    }
};
/** Provides Node's filesystem and fetch implementations for a production secret lookup. */
export const getProductionSecretString = (secretId) => getSecretString({
    config: createCredentialsProviderConfig(secretId),
    dependencies: {
        fetch,
        readFile,
    },
});
/** Reads the authorization token required by the local provider. */
const readToken = async ({ config, dependencies, }) => {
    try {
        const token = (await dependencies.readFile(config.tokenFilePath, "utf8")).trim();
        return token === ""
            ? createFailure("AWS Workload Credentials Provider token is empty")
            : token;
    }
    catch {
        return createFailure("AWS Workload Credentials Provider token is unavailable");
    }
};
/** Extracts a string secret from the Secrets Manager response envelope. */
const parseSecretString = (responseBody) => {
    try {
        const response = JSON.parse(responseBody);
        if (typeof response !== "object" ||
            response === null ||
            Array.isArray(response)) {
            return createFailure("Secret does not contain a string SecretString value");
        }
        const secretString = response
            .SecretString;
        if (typeof secretString !== "string") {
            return createFailure("Secret does not contain a string SecretString value");
        }
        return {
            type: "secret-string-success",
            secretString,
        };
    }
    catch {
        return createFailure("Secret does not contain a string SecretString value");
    }
};
/** Produces failures that are useful to operators without revealing secret contents. */
const createFailure = (message) => ({
    type: "secret-string-failure",
    message,
});
