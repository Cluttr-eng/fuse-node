export interface Configuration {
  basePath: string;

  fuse: {
    apiKey: string
    clientId: string
  }

  plaid?: {
    clientId: string
    secret: string
  }

  teller?: {
    applicationId: string,
    certificate: string,
    privateKey: string,
    tokenSigningKey: string,
    signingSecret: string
  }

  mx?: {
    clientId: string,
    apiKey: string
  }
}
