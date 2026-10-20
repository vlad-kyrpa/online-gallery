/** Configures the local AWS Workload Credentials Provider request. */
export interface WorkloadCredentialsProviderConfig {
  readonly secretId: string;
  readonly endpoint: string;
  readonly tokenFilePath: string;
  readonly versionStage: string;
}

/** Defines the system I/O needed to request a secret without coupling the parser to Node. */
export interface WorkloadCredentialsProviderDependencies {
  readonly fetch: typeof fetch;
  readonly readFile: (path: string, encoding: "utf8") => Promise<string>;
}

/** Describes why loading a string secret was not possible without exposing its value. */
export interface SecretStringFailure {
  readonly type: "secret-string-failure";
  readonly message: string;
}

/** Holds a string secret returned by the local AWS provider. */
export interface SecretStringSuccess {
  readonly type: "secret-string-success";
  readonly secretString: string;
}

/** Represents the safe outcome of loading a string secret from AWS Secrets Manager. */
export type SecretStringResult = SecretStringFailure | SecretStringSuccess;

/** Bundles inputs for a generic string-secret lookup. */
export interface GetSecretStringParameters {
  readonly config: WorkloadCredentialsProviderConfig;
  readonly dependencies: WorkloadCredentialsProviderDependencies;
}
