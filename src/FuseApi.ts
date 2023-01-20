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
  FUSE = "fuse"
}

export interface UnifiedWebhook {
  webhook_type: string;
  webhook_code: string;
  financial_connection_id: string;
  environment: "SANDBOX" | "PRODUCTION";
  aggregator: Aggregator;
  remote_data: any;
}
export interface UnifiedSyncRequiredWebhook {
  webhook_type: "SYNC_REQUIRED";
  webhook_code: 'TRANSACTIONS';
  financial_connection_id: string;
  environment: "SANDBOX" | "PRODUCTION";
  aggregator: Aggregator;
  remote_data: any;
}

export interface UnifiedTransactionWebhook {
  webhook_type: "TRANSACTIONS";
  webhook_code: 'UPDATES_AVAILABLE';
  financial_connection_id: string;
  environment: "SANDBOX" | "PRODUCTION";
  aggregator: Aggregator.FUSE;
}

export interface CreateSessionRequest {
  /**
   * A string array of aggregators you would like to include
   */
  supported_financial_institution_aggregators: ("PLAID" | "TELLER" | "MX")[];
  /**
   * If PLAID is in the supported list above, this is required.
   * For a comprehensive list of supported plaid products, see https://plaid.com/docs/api/tokens/#link-token-create-request-products
   */
  plaid?: {
    products: string[];
  };
  /**
   * See https://docs.mx.com/api#core_resources_institutions_list_institutions for more details
   */
  mx?: {
    supports_account_identification: boolean;
    supports_account_statement: boolean;
    supports_account_verification: boolean;
    supports_transaction_history: boolean;
  };
}

export interface CreateSessionResponse {
  /**
   * The secret associated with the newly created session. This value is need to initialise the Fuse SDK.
   */
  client_secret: string;
  /**
   * 4 hours from the point of creation.
   */
  expiration: string;
  /**
   * Used for debugging
   */
  request_id: string;
}

export interface CreateSessionLinkTokenRequest {
  /**
   * The institutionId received from the "onSelectedInstitution()" callback from the Fuse SDK.
   */
  institution_id: string;
  /**
   * The session client secret retrieved when creating the session
   */
  session_client_secret: string;
  /**
   * An id unique for a user in your application
   */
  user_id: string;
  /**
   * The url where we should send webhooks to.
   * Pass in if you would like to receive real time updates.
   */
  webhook_url?: string;
  /**
   * 'config' follows the same schema as https://plaid.com/docs/api/tokens/#linktokencreate
   */
  plaid?: {
    config: any;
  };
  /**
   * 'config' follows the same schema as https://docs.mx.com/api#connect_request_a_url
   */
  mx?: {
    config: any;
  };
}

export interface CreateSessionLinkTokenResponse {
  /**
   * The link token required by the Fuse SDK callback
   */
  link_token: string;
  /**
   * Used for debugging
   */
  request_id: string;
}

export interface ExchangeSessionPublicTokenRequest {
  /**
   * The public token received from the "onSuccess()" callback in the Fuse SDK.
   */
  public_token: string;
}

export interface ExchangeSessionPublicTokenResponse {
  /**
   * The access token is needed to query the users resources for the new connection.
   */
  access_token: string;
  /**
   * The id of the new connection.
   * The financial connection id is used to identify a financial connection in a webhook.
   */
  financial_connection_id: string;
  /**
   * Used for debugging
   */
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

export interface TransactionCommonModel {
  id: string;
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
  remote_data: any;
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


export interface PaginationResponse<T> {
  /**
   * An array of the data returned for the current page.
   */
  data: T[];
  /**
   * The cursor of the last item returned.
   */
  cursor?: string | undefined | null;
  /**
   * Indicates if there's more pages to navigate through
   */
  has_next: boolean;
}



export class FuseApi {
  private configuration: Configuration;
  private headers: any;
  constructor(configuration: Configuration) {
    this.configuration = configuration;
    this.headers = {
      "fuse-api-key": this.configuration.fuseApiKey,
      "fuse-client-id": this.configuration.fuseClientId,
      "plaid-client-id": this.configuration.plaidClientId,
      "plaid-secret": this.configuration.plaidSecret,
      "teller-application-id": this.configuration.tellerApplicationId,
      "teller-certificate": this.configuration.tellerCertificate,
      "teller-private-key": this.configuration.tellerPrivateKey,
      "mx-client-id": this.configuration.mxClientId,
      "mx-api-key": this.configuration.mxApiKey,
    };
  }

  /**
   * This creates a session. A session stores information about the process of a user connecting a new financial institution.
   * @param createSessionRequest
   * @returns A {@link CreateSessionResponse}
   */
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

  /**
   * This creates a session link token which is needed to start the process of a user connecting to a specific financial institution.
   * @param createSessionLinkTokenRequest
   * @returns A {@link CreateSessionLinkTokenResponse}
   */
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

  /**
   * Exchange a public token for an access token and financial connection id.
   * You can then use this access token to retrieve information for that user.
   * You need the financial connection id for listening for webhooks. Every webhook contains the financial connection id. This is how you identify the corresponding financial connection given a webhook event.
   * @param exchangeSessionPublicTokenRequest
   * @returns An {@link ExchangeSessionPublicTokenResponse}
   */
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

  /**
   * Verify the authenticity of a webhook.
   * @param unifiedWebhook
   * @param requestHeaders The request headers of the received webhook
   * @returns A {@link boolean} that is true/false depending on whether the webhook was verified.
   */
  public verify = async (
    unifiedWebhook: UnifiedWebhook,
    requestHeaders: any
  ): Promise<boolean> => {
    const fuseVerificationHeader = getHeaderValue(
        requestHeaders,
      "fuse-verification"
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
    } else if (unifiedWebhook.aggregator === Aggregator.MX || unifiedWebhook.aggregator === Aggregator.FUSE) {
      try {
        return this.requestIsFromFuse(
          this.configuration.fuseApiKey,
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
  ): Promise<AxiosResponse<PaginationResponse<TransactionCommonModel>>> => {
    return await axios.post(
        this.configuration.basePath + "/financial_connections/transactions",
        getFinancialConnectionsTransactions,
        {
          headers: this.headers,
        },
    );
  };


}
