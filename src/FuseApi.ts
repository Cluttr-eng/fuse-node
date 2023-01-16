import { Configuration } from "./Configuration";
import axios, { AxiosResponse } from "axios";
import { getHeaderValue } from "./helpers";
import { getPlaidClient } from "./clients/plaid-client";
import jwt_decode from "jwt-decode";
const JWT = require("jose");
const sha256 = require("js-sha256");
const compare = require("secure-compare");
const crypto = require("crypto");

export enum Aggregator {
  PLAID = "plaid",
  TELLER = "teller",
  MX = "mx",
}

export interface UnifiedWebhook {
  webhook_type: "TRANSACTIONS";
  webhook_code: "UPDATES_AVAILABLE";
  connection_id: string;
  environment: "SANDBOX" | "PRODUCTION";
  aggregator: Aggregator;
  remote_data: any;
}

export interface CreateSessionRequest {
  phone_number?: string;
  template_id: "BankLinking" | "KycAndBankLinking";
  supported_financial_institution_aggregators: ("PLAID" | "TELLER" | "MX")[];
  plaid?: {
    products: string[];
  };
  teller?: {
    capabilities: string[];
  };
  mx?: {
    supports_account_identification: boolean;
    supports_account_statement: boolean;
    supports_account_verification: boolean;
    supports_transaction_history: boolean;
  };
}

export interface CreateSessionResponse {
  client_secret: string;
  expiration: string;
  request_id: string;
}

export interface CreateSessionLinkTokenRequest {
  institution_id: string;
  session_client_secret: string;
  user_id: string;
  webhook_url?: string;
  plaid?: {
    config: any;
  };
  mx?: {
    config: any;
  };
}

export interface CreateSessionLinkTokenResponse {
  link_token: string;
  request_id: string;
}

export interface ExchangeSessionPublicTokenRequest {
  public_token: string;
}

export interface ExchangeSessionPublicTokenResponse {
  access_token: string;
  connection_id: string;
  request_id: string;
}

export interface GetFinancialConnectionsBalanceRequest {
  access_token: string;
}

export interface FinancialConnectionsAccountBalance {
  remote_account_id: string;
  available: number; // Factoring in pending balance
  current: number; // Without factoring in pending balance
  iso_currency_code: string;
}

export interface GetFinancialConnectionsAccountBalanceResponse {
  balances: FinancialConnectionsAccountBalance[];
  remote_data: {
    path: string;
    data: any;
  }[];
}


export interface GetFinancialConnectionsAccountsDetailsRequest {
  access_token: string;
}


export interface FinancialConnectionsAccountDetails {
  remote_id: string;
  ach: {
    account: string;
    routing?: string;
    wire_routing?: string;
    bacs_routing?: string;
  };
}

export interface GetFinancialConnectionsAccountDetailsResponse {
  account_details: FinancialConnectionsAccountDetails[];
  remote_data: {
    path?: string;
    data: any;
  }[];
}


export interface GetFinancialConnectionsAccountsRequest {
  access_token: string;
}

export interface FinancialConnectionsAccount {
  remote_id: string;
  institution: {
    name: string;
  };
  last_four: string;
  name: string;
  subtype: string;
  type: string;
}

export interface GetFinancialConnectionsAccountsResponse {
  accounts: FinancialConnectionsAccount[];
  remote_data: {
    path?: string;
    data: any;
  }[];
}


export interface GetFinancialConnectionsTransactionsRequest {
  access_token: string;
  cursor?: string;
  count?: number;
}

export interface FinancialConnectionsTransaction {
  remote_id: string;
  remote_account_id: string;
  amount: number;
  date: string;
  description: string;
  category: string[];
  merchant: {
    name: string;
  };
  status: string;
  type: string;
}

export interface GetFinancialConnectionsTransactionsResponse {
  transactions: FinancialConnectionsTransaction[];
  pagination: {
    next_cursor: string;
    has_more: boolean;
  };
  remote_data: {
    path?: string;
    data: any;
  }[];
}



export class FuseApi {
  private configuration: Configuration;
  private headers: any;
  constructor(configuration: Configuration) {
    this.configuration = configuration;
    this.headers = {
      "x-api-key": this.configuration.apiKey,
      "x-client-id": this.configuration.clientId,
      "plaid-client-id": this.configuration.plaidClientId,
      "plaid-secret": this.configuration.plaidSecret,
      "teller-application-id": this.configuration.tellerApplicationId,
      "teller-certificate": this.configuration.tellerCertificate,
      "mx-client-id": this.configuration.mxClientId,
      "mx-api-key": this.configuration.mxApiKey,
    };
  }

  public createSession = async (
    createSessionRequest: CreateSessionRequest
  ): Promise<AxiosResponse<CreateSessionResponse>> => {
    return await axios.post(
      this.configuration.basePath + "/session/create",
      createSessionRequest,
      {
        headers: this.headers,
      }
    );
  };

  public createSessionLinkToken = async (
    createSessionLinkTokenRequest: CreateSessionLinkTokenRequest
  ): Promise<AxiosResponse<CreateSessionLinkTokenResponse>> => {
    return await axios.post(
      this.configuration.basePath + "/session/link/token/create",
      createSessionLinkTokenRequest,
      {
        headers: this.headers,
      }
    );
  };

  public exchangeSessionPublicToken = async (
    exchangeSessionPublicTokenRequest: ExchangeSessionPublicTokenRequest
  ): Promise<AxiosResponse<ExchangeSessionPublicTokenResponse>> => {
    return await axios.post(
      this.configuration.basePath + "/session/public_token/exchange",
      {
        public_token: exchangeSessionPublicTokenRequest.public_token,
      },
      {
        headers: this.headers,
      }
    );
  };

  public verify = async (
    unifiedWebhook: UnifiedWebhook,
    headers: any
  ): Promise<boolean> => {
    const fuseVerificationHeader = getHeaderValue(
      headers,
      "X-Fuse-Verification"
    );
    if (unifiedWebhook.aggregator === Aggregator.PLAID) {
      const plaidVerificationHeader = fuseVerificationHeader;
      const plaidClient = getPlaidClient(
        this.configuration.plaidClientId,
        this.configuration.plaidSecret
      );
      const decoded = jwt_decode(plaidVerificationHeader, {
        header: true,
      }) as any;
      const alg = decoded["alg"];
      const kid = decoded["kid"];

      if (alg !== "ES256") {
        return false;
      }

      const verificationKeyResponse =
        await plaidClient.webhookVerificationKeyGet({
          key_id: kid,
        });

      const key = verificationKeyResponse.data.key;
      try {
        const keyLike = await JWT.importJWK(key);
        // This will throw an error if verification fails
        const { payload } = await JWT.jwtVerify(
          plaidVerificationHeader,
          keyLike,
          {
            maxTokenAge: "5 min",
          }
        );
      } catch (error) {
        return false;
      }

      const bodyHash = sha256(unifiedWebhook.remote_data);
      const claimedBodyHash = decoded.request_body_sha256;
      return compare(bodyHash, claimedBodyHash);
    } else if (unifiedWebhook.aggregator === Aggregator.TELLER) {
      let match = fuseVerificationHeader.match(/t=(\w+),v1=(\w+)/);

      const tellerBody = unifiedWebhook.remote_data;

      let tValue = match[1];
      let v1Value = match[2];

      const signedMessage = `${tValue}.${tellerBody}`;
      const hmac = this.hmacSignature(
        this.configuration.tellerTokenSigningKey,
        signedMessage
      );
      return crypto.timingSafeEqual(Buffer.from(v1Value), Buffer.from(hmac));
    } else if (unifiedWebhook.aggregator === Aggregator.MX) {
      try {
        return this.requestIsFromFuse(
          this.configuration.apiKey,
          unifiedWebhook,
          fuseVerificationHeader
        );
      } catch (e) {
        console.log(e);
        return false;
      }
    }
  };

  hmacSignature = (key: any, msg: any) => {
    return crypto.createHmac("sha256", key).update(msg).digest("base64");
  };

  requestIsFromFuse = (
    apiKey: any,
    unifiedWebhook: any,
    requestHmac: string
  ) => {
    const replacer = (key: any, value: any) =>
      value instanceof Object && !(value instanceof Array)
        ? Object.keys(value)
            .sort()
            .reduce((sorted, key) => {
              // @ts-ignore
              sorted[key] = value[key];
              return sorted;
            }, {})
        : value;

    const requestJson = JSON.stringify(unifiedWebhook, replacer);
    const dataHmac = this.hmacSignature(apiKey, requestJson);

    return crypto.timingSafeEqual(
      Buffer.from(requestHmac),
      Buffer.from(dataHmac)
    );
  };

  public getFinancialConnectionsBalance = async (
      getFinancialConnectionsBalanceRequest: GetFinancialConnectionsBalanceRequest
  ): Promise<AxiosResponse<GetFinancialConnectionsAccountBalanceResponse>> => {
    return await axios.post(
        this.configuration.basePath + "/financial_connections/balance",
        getFinancialConnectionsBalanceRequest,
        {
          headers: this.headers,
        },
    );
  };

  public getFinancialConnectionsAccountDetails = async (
      getFinancialConnectionsAccountDetailsRequest: GetFinancialConnectionsAccountsDetailsRequest
  ): Promise<AxiosResponse<GetFinancialConnectionsAccountDetailsResponse>> => {
    return await axios.post(
        this.configuration.basePath + "/financial_connections/accounts/details",
        getFinancialConnectionsAccountDetailsRequest,
        {
          headers: this.headers,
        },
    );
  };

  public getFinancialConnectionsAccounts = async (
      getFinancialConnectionsAccountsRequest: GetFinancialConnectionsAccountsRequest
  ): Promise<AxiosResponse<GetFinancialConnectionsAccountsResponse>> => {
    return await axios.post(
        this.configuration.basePath + "/financial_connections/accounts",
        getFinancialConnectionsAccountsRequest,
        {
          headers: this.headers,
        },
    );
  };

  public getFinancialConnectionsTransactions = async (
      getFinancialConnectionsTransactions: GetFinancialConnectionsTransactionsRequest
  ): Promise<AxiosResponse<GetFinancialConnectionsTransactionsResponse>> => {
    return await axios.post(
        this.configuration.basePath + "/financial_connections/transactions",
        getFinancialConnectionsTransactions,
        {
          headers: this.headers,
        },
    );
  };


}
