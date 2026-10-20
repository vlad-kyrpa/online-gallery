import {
  GetSecretValueCommand,
  ResourceNotFoundException,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { DEFAULT_S3_REGION } from "../../constants.js";

/** Gets a string secret through the EC2 instance role, or undefined when absent. */
export const getSecret = async (
  secretId: string,
): Promise<string | undefined> => {
  try {
    const response = await getSecretsManagerClient().send(
      new GetSecretValueCommand({ SecretId: secretId }),
    );

    if (typeof response.SecretString !== "string") {
      throw new Error("Secret does not contain a string SecretString value");
    }

    return response.SecretString;
  } catch (error: unknown) {
    if (error instanceof ResourceNotFoundException) {
      return undefined;
    }

    throw error;
  }
};

/** Creates an SDK client whose default credential chain includes the EC2 instance role. */
const getSecretsManagerClient = (): SecretsManagerClient =>
  new SecretsManagerClient({
    region:
      process.env.AWS_REGION?.trim() ||
      process.env.AWS_S3_REGION?.trim() ||
      DEFAULT_S3_REGION,
  });
