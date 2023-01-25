import { Configuration } from "./Configuration";
import axios, { AxiosResponse } from "axios";
import { getHeaderValue } from "./helpers";
import { getPlaidClient } from "./clients/plaid-client";
import jwt_decode from "jwt-decode";
import { Environment } from "./BasePath";
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
export interface SyncRequiredWebhook {
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

export interface CreateLinkTokenRequest {
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

export interface CreateLinkTokenResponse {
  /**
   * The link token required by the Fuse SDK callback
   */
  link_token: string;
  /**
   * Used for debugging
   */
  request_id: string;
}

export interface ExchangeFinancialConnectionsPublicTokenRequest {
  /**
   * The public token received from the "onSuccess()" callback in the Fuse SDK.
   */
  public_token: string;
}

export interface ExchangeFinancialConnectionsPublicTokenResponse {
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

export interface GetFinancialConnectionsBalancesRequest {
  /**
   * Access token for authentication
   */
  access_token: string;
}

export interface FinancialConnectionsBalance {
  /**
   * Remote Account Id of the transaction, ie Plaid Account Id
   */
  remote_account_id: string;
  /**
   * Amount after factoring in pending balances
   */
  available: number;
  /**
   * Amount without factoring in pending balances
   */
  current: number;
  /**
   * The ISO-4217 currency code of the balance.
   */
  iso_currency_code: string;
  /**
   * The exact data from the aggregator (ie plaid) that we retrieved the information from
   */
  remote_data: any;
}

export interface GetFinancialConnectionsBalancesResponse {
  /**
   * List of the users balances
   */
  balances: FinancialConnectionsBalance[];
}


export interface GetFinancialConnectionsAccountsDetailsRequest {
  /**
   * Access token for authentication
   */
  access_token: string;
}


export interface FinancialConnectionsAccountDetails {
  /**
   * Remote Id of the account, ie Plaid or Teller account id
   */
  remote_id: string;
  /**
   * ACH details
   */
  ach: {
    account: string;
    routing?: string;
    wire_routing?: string;
    bacs_routing?: string;
  };
  /**
   * The exact data from the aggregator (ie plaid) that we retrieved the information from
   */
  remote_data: any;
}

export interface GetFinancialConnectionsAccountDetailsResponse {
  /**
   * List of account details
   */
  account_details: FinancialConnectionsAccountDetails[];
}


export interface GetFinancialConnectionsAccountsRequest {
  /**
   * Access token for authentication
   */
  access_token: string;
}

export interface FinancialConnectionsAccount {
  /**
   * Remote Id of the account, ie Plaid or Teller account id
   */
  remote_id: string;
  /**
   * Institution details
   */
  institution: {
    name: string;
  };
  /**
   * The last four digits of the account number.
   */
  last_four: string;
  /**
   * The account's name, ie 'My Checking'
   */
  name: string;
  /**
   * The account's type e.g depository.
   */
  type: string;
  /**
   * The account's subtype e.g checking
   */
  subtype: string;
  /**
   * The exact data from the aggregator (ie plaid) that we retrieved the information from
   */
  remote_data: any;
}

export interface GetFinancialConnectionsAccountsResponse {
  /**
   * List of accounts
   */
  accounts: FinancialConnectionsAccount[];
}

export interface GetFinancialConnectionsOwnersRequest {
  /**
   * Access token for authentication
   */
  access_token: string;
}

interface AccountOwners {
  /**
   * Array of Address objects
   */
  addresses: Address[];
  /**
   * Array of Email objects
   */
  emails: Email[];
  /**
   * Array of names
   */
  names: string[]; // array of names
  /**
   * Array of PhoneNumber objects
   */
  phone_numbers: PhoneNumber[];
}
interface Address {
  data: {
    city: string;
    country: string;
    postal_code: string;
    region: string;
    street: string;
  };
  /**
   * Indicating if it is the primary address
   */
  primary: boolean;
}
interface Email {
  /**
   * Email address
   */
  data: string; // email address
  /**
   * Indicating if it is the primary email
   */
  primary: boolean;
  /**
   * Type of the email
   */
  type: "primary" | "secondary" | "other";
}
interface PhoneNumber {
  /**
   * The phone number
   */
  data: string;
  /**
   * Indicating if it is the primary phone number
   */
  primary: boolean;
  /**
   * Type of the phone number
   */
  type: "home" | "work" | "mobile";
}

export interface GetFinancialConnectionsOwnersResponse {
  /**
   * Access token for authentication
   */
  owners: AccountOwners[];
}



export interface GetFinancialConnectionsAccountsResponse {
  /**
   * List of accounts
   */
  accounts: FinancialConnectionsAccount[];
}

export interface GetFinancialConnectionsTransactionsRequest {
  /**
   * Access token for authentication
   */
  access_token: string;
  /**
   * Cursor for pagination
   */
  cursor?: string;
  /**
   * Number of items per page
   */
  count?: number;
}

export interface TransactionCommonModel {
  /**
   * Fuse Id of the transaction
   */
  id: string;
  /**
   * Remote Id of the transaction, ie Plaid or Teller Id
   */
  remote_id: string;
  /**
   * Remote Account Id of the transaction, ie Plaid Account Id
   */
  remote_account_id: string;
  /**
   * Amount in cents associated with the transaction
   */
  amount: number;
  /**
   * Date of the transaction
   */
  date: string;
  /**
   * Description of the transaction
   */
  description: string;
  /**
   * Categories of the transaction, ie Computers and Electronics
   */
  category: string[];
  /**
   * Merchant description
   */
  merchant: {
    name: string;
  };
  /**
   * The status of the transaction. This will be either POSTED or PENDING.
   */
  status: string;
  /**
   * Type of the transaction, ie adjustment
   */
  type: string;
  /**
   * The exact data from the aggregator (ie plaid) that we retrieved the information from
   */
  remote_data: any;
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
   * Indicates if there are more pages to navigate through
   */
  has_next: boolean;
}

export interface SyncTransactionsRequest {
  /**
   * The access token of the financial institution connection
   */
  access_token: string;
  /**
   * The cursor value represents the last update requested. Providing it will cause the response to only return changes after this update.
   * If omitted, the entire history of updates will be returned, starting with the first-added transactions on the item.
   */
  cursor?: string;
  /**
   * The number of transaction updates to fetch.
   */
  count?: number;
}

export interface SyncTransactionsResponse {
  /**
   * Transactions that have been added to the item since `cursor` ordered by ascending last modified time.
   */
  added: Array<TransactionCommonModel>;
  /**
   * Transactions that have been modified on the item since `cursor` ordered by ascending last modified time.
   */
  modified: Array<TransactionCommonModel>;
  /**
   * Transactions that have been removed from the item since `cursor` ordered by ascending last modified time.
   */
  removed: Array<{
    transaction_id: string
  }>;
  /**
   * Cursor used for fetching any future updates after the latest update provided in this response. The cursor obtained after all pages have been pulled (indicated by `has_more` being `false`) will be valid for at least 1 year. This cursor should be persisted for later calls.
   */
  next_cursor: string;
  /**
   * Represents if more than requested count of transaction updates exist. If true, the additional updates can be fetched by making an additional request with `cursor` set to `next_cursor`. If `has_more` is true, it's important to pull all available pages, to make it less likely for underlying data changes to conflict with pagination.
   */
  has_next: boolean;
}

export interface SyncFinancialConnectionsDataResponse {
}


export class FuseApi {
  private configuration: Configuration;
  private headers: any;
  constructor(configuration: Configuration) {
    this.configuration = configuration;
    this.headers = {
      "fuse-api-key": this.configuration.fuse.apiKey,
      "fuse-client-id": this.configuration.fuse.clientId,
      "plaid-client-id": this.configuration.plaid?.clientId,
      "plaid-secret": this.configuration.plaid?.secret,
      "teller-application-id": this.configuration.teller?.applicationId,
      "teller-certificate": this.configuration.teller?.certificate,
      "teller-private-key": this.configuration.teller?.privateKey,
      "teller-token-signing-key": this.configuration.teller?.tokenSigningKey,
      "teller-signing-secret": this.configuration.teller?.signingSecret,
      "mx-client-id": this.configuration.mx?.clientId,
      "mx-api-key": this.configuration.mx?.apiKey,
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
      this.configuration.basePath + "/session",
      createSessionRequest,
      {
        headers: this.headers,
      }
    );
  };

  /**
   * This creates a link token which is needed to start the process of a user connecting to a specific financial institution.
   * @param createLinkTokenRequest
   * @returns A {@link CreateLinkTokenResponse}
   */
  public createLinkToken = async (
    createLinkTokenRequest: CreateLinkTokenRequest
  ): Promise<AxiosResponse<CreateLinkTokenResponse>> => {
    return await axios.post(
      this.configuration.basePath + "/link/token",
      createLinkTokenRequest,
      {
        headers: this.headers,
      }
    );
  };

  /**
   * Exchange a public token for an access token and financial connection id.
   * You can then use this access token to retrieve information for that user.
   * You need the financial connection id for listening for webhooks. Every webhook contains the financial connection id. This is how you identify the corresponding financial connection given a webhook event.
   * @param exchangeFinancialConnectionsPublicTokenRequest
   * @returns An {@link ExchangeFinancialConnectionsPublicTokenResponse}
   */
  public exchangeFinancialConnectionsPublicToken = async (
    exchangeFinancialConnectionsPublicTokenRequest: ExchangeFinancialConnectionsPublicTokenRequest
  ): Promise<AxiosResponse<ExchangeFinancialConnectionsPublicTokenResponse>> => {
    return await axios.post(
      this.configuration.basePath + "/financial_connections/public_token/exchange",
      {
        public_token: exchangeFinancialConnectionsPublicTokenRequest.public_token,
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
        this.configuration.plaid.clientId,
        this.configuration.plaid.secret,
        this.configuration.basePath === Environment.SANDBOX ? "sandbox" : "production"
      );

      const decodedToken = jwt_decode(plaidVerificationHeader) as any;
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
      const claimedBodyHash = decodedToken.request_body_sha256;
      return compare(bodyHash, claimedBodyHash);
    } else if (unifiedWebhook.aggregator === Aggregator.TELLER) {
      let match = fuseVerificationHeader.match(/t=(\w+),v1=(\w+)/);

      const tellerBody = unifiedWebhook.remote_data;

      let tValue = match[1];
      let v1Value = match[2];

      const signedMessage = `${tValue}.${tellerBody}`;
      const hmac = this.hmacSignature(
        this.configuration.teller.signingSecret,
        signedMessage,
        "hex"
      );

      return crypto.timingSafeEqual(Buffer.from(v1Value), Buffer.from(hmac));
    } else if (unifiedWebhook.aggregator === Aggregator.MX || unifiedWebhook.aggregator === Aggregator.FUSE) {
      try {
        return this.requestIsFromFuse(
          this.configuration.fuse.apiKey,
          unifiedWebhook,
          fuseVerificationHeader
        );
      } catch (e) {
        console.log(e);
        return false;
      }
    }
  };

  hmacSignature = (key: any, msg: any, algorithm: string) => {
    return crypto.createHmac("sha256", key).update(msg).digest(algorithm);
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
    const dataHmac = this.hmacSignature(apiKey, requestJson, "base64");

    return crypto.timingSafeEqual(
      Buffer.from(requestHmac),
      Buffer.from(dataHmac)
    );
  };

  /**
   * Get a list of balances associated with the access token
   * @param getFinancialConnectionsBalanceRequest
   * @returns GetFinancialConnectionsBalanceResponse
   */
  public getFinancialConnectionsBalances = async (
      getFinancialConnectionsBalanceRequest: GetFinancialConnectionsBalancesRequest
  ): Promise<AxiosResponse<GetFinancialConnectionsBalancesResponse>> => {
    return await axios.post(
        this.configuration.basePath + "/financial_connections/balances",
        getFinancialConnectionsBalanceRequest,
        {
          headers: this.headers,
        },
    );
  };

  /**
   * Get a list of account details associated with the access token
   * @param getFinancialConnectionsAccountDetailsRequest
   * @returns GetFinancialConnectionsAccountDetailsResponse
   */
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

  /**
   * Get a list of accounts associated with the access token
   * @param getFinancialConnectionsAccountsRequest
   * @returns GetFinancialConnectionsAccountsResponse
   */
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

  /**
   * Get a list of owners for the financial connection
   * @param getFinancialConnectionsOwnersRequest
   * @returns GetFinancialConnectionsOwnersResponse
   */
  public getFinancialConnectionsOwners = async (
      getFinancialConnectionsOwnersRequest: GetFinancialConnectionsOwnersRequest
  ): Promise<AxiosResponse<GetFinancialConnectionsOwnersResponse>> => {
    return await axios.post(
        this.configuration.basePath + "/financial_connections/owners",
        getFinancialConnectionsOwnersRequest,
        {
          headers: this.headers,
        },
    );
  };

  /**
   * Get a list of transactions associated with the access token
   * @param getFinancialConnectionsTransactions
   * @returns TransactionCommonModel
   */
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

  /**
   * Sync the transactions associated with the access token
   * @param syncTransactionsRequest
   * @returns SyncTransactionsResponse
   */
  public syncFinancialConnectionsTransactions = async (
      syncTransactionsRequest: SyncTransactionsRequest
  ): Promise<AxiosResponse<SyncTransactionsResponse>> => {
    return await axios.post(
        this.configuration.basePath + "/financial_connections/transactions/sync",
        syncTransactionsRequest,
        {
          headers: this.headers,
        },
    );
  };

  /**
   * Syncs the financial connection data for a financial connection. Required to keep data up to date.
   * @param syncRequiredWebhook
   * @returns SyncFinancialConnectionsDataResponse
   */
  public syncFinancialConnectionsData = async (
      syncRequiredWebhook: SyncRequiredWebhook
  ): Promise<AxiosResponse<SyncFinancialConnectionsDataResponse>> => {
    return await axios.post(
        this.configuration.basePath + "/financial_connections/sync",
        syncRequiredWebhook,
        {
          headers: this.headers,
        },
    );
  };


}
