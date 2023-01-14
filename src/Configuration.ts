export class Configuration {
  public basePath: string;
  public apiKey: string;
  public clientId: string;
  public plaidClientId?: string;
  public plaidSecret?: string;
  public tellerApplicationId?: string;
  public tellerCertificate?: string;
  public tellerTokenSigningKey?: string;
  public mxClientId?: string;
  public mxApiKey?: string;

  constructor(
    basePath: string,
    apiKey: string,
    clientId: string,
    plaidClientId?: string,
    plaidSecret?: string,
    tellerApplicationId?: string,
    tellerCertificate?: string,
    tellerTokenSigningKey?: string,
    mxClientId?: string,
    mxApiKey?: string
  ) {
    this.basePath = basePath;
    this.apiKey = apiKey;
    this.clientId = clientId;
    this.plaidClientId = plaidClientId;
    this.plaidSecret = plaidSecret;
    this.tellerApplicationId = tellerApplicationId;
    this.tellerCertificate = tellerCertificate;
    this.tellerTokenSigningKey = tellerTokenSigningKey;
    this.mxClientId = mxClientId;
    this.mxApiKey = mxApiKey;
  }
}
