export interface Configuration {
  basePath: string;

  fuseApiKey: string;

  fuseClientId: string;

  plaidClientId?: string;

  plaidSecret?: string;

  tellerApplicationId?: string;

  tellerCertificate?: string;

  tellerTokenSigningKey?: string;

  tellerPrivateKey?: string

  mxClientId?: string;

  mxApiKey?: string;
}
