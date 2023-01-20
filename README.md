# fuse-node

The Fuse library provides convenient access to the Fuse REST API. It includes TypeScript definitions for all request params and response fields. It is intended to be used on the server.

## Documentation
The API documentation can be found [here](https://letsfuse.readme.io/reference/post_v1-session-create).

## Installation
```
npm install fuse-node
```

## Quick start
Documentation for each method, request param, and response field are available in docstrings and will appear on hover in most modern editors.

### Initialising the Fuse Api
```typescript
import {Environment, FuseApi} from "fuse-node";

const fuseApi = new FuseApi({
  basePath: Environment.SANDBOX,
  fuseApiKey: "my-fuse-api-key",
  fuseClientId: "my-fuse-client-id",
  plaidClientId: "my-plaid-client-id",
  plaidSecret: "my-plaid-secret",
  tellerApplicationId: "my-teller-application-id",
  tellerCertificate: "my-teller-certificate",
  tellerTokenSigningKey: "my-teller-token-signing-key",
  tellerPrivateKey: "my-teller-private-key",
  mxClientId: "my-mx-client-id",
  mxApiKey: "my-mx-api-key"
});
```
<br/>

### Creating a session
```typescript
const response = await fuseApi.createSession({
    supported_financial_institution_aggregators: ["PLAID", "TELLER", "MX"],
    plaid: {
      products: ["transactions"],
    },
    mx: {
      supports_transaction_history: true,
      supports_account_identification: false,
      supports_account_statement: true,
      supports_account_verification: false
    }
  } as CreateSessionRequest);
  
  const session = response.data as CreateSessionResponse;

  console.log(session.client_secret)
```
<br/>

### Creating a session link token
```typescript
  const response = await fuseApi.createSessionLinkToken({
    institution_id: "fuse-institution-id-from-frontend",
    session_client_secret: "session-client-secret",
    user_id: "my-unique-user-id",
    webhook_url: "https://www.my-domain.com/webhook",
    plaid: {
      config: {
        client_name: "my-company-name"
      }
    },
    mx: {
      config: {
        color_scheme: "light"
      }
    }
  } as CreateSessionLinkTokenRequest);

  const linkTokenData = response.data as CreateSessionLinkTokenResponse;

  console.log(linkTokenData.link_token);
```

<br/>

### Exchanging a public token
```typescript
const response = await fuseApi.exchangeSessionPublicToken({
    public_token: "public-token-from-frontend"
} as ExchangeSessionPublicTokenRequest);

const responseData = response.data as ExchangeSessionPublicTokenResponse;

console.log(responseData.access_token);
console.log(responseData.financial_connection_id);
```
<br/>

### Verifying a webhook
#### Example using express
```typescript
app.post("/webhook", async (req: any, response: any) => {
    const isVerified = await fuseApi.verify(req.body, req.headers);
    if (isVerified) {
        //do something
    }
});
```

### Getting transactions
```typescript
const response = await fuseApi.getFinancialConnectionsTransactions({
    access_token: "my-access-token",
    cursor: "my-cursor",
    count: 200
} as GetFinancialConnectionsTransactionsRequest);

const responseData = response.data as PaginationResponse<TransactionCommonModel>;

console.log(responseData.data[0].id);
```
<br/>

### Getting balances
```typescript
const response = await fuseApi.getFinancialConnectionsBalances({
    access_token: "my-access-token"
} as GetFinancialConnectionsBalancesRequest);

const responseData = response.data as GetFinancialConnectionsBalancesResponse;

console.log(responseData.balances[0].current);
```
<br/>

### Getting accounts
```typescript
const response = await fuseApi.getFinancialConnectionsAccounts({
    access_token: "my-access-token"
} as GetFinancialConnectionsAccountsRequest);

const responseData = response.data as GetFinancialConnectionsAccountsResponse;

console.log(responseData.accounts[0].name);
```
<br/>

### Getting account details
```typescript
const response = await fuseApi.getFinancialConnectionsAccountDetails({
    access_token: "my-access-token"
} as GetFinancialConnectionsAccountsDetailsRequest);

const responseData = response.data as GetFinancialConnectionsAccountDetailsResponse;

console.log(responseData.account_details[0].remote_id);
```
<br/>

### Sync transactions
```typescript
const response = await fuseApi.syncFinancialConnectionsTransactions({
    access_token: "my-access-token",
    cursor: "my-cursor",
    count: 200
} as SyncTransactionsRequest);

const responseData = response.data as SyncTransactionsResponse;

console.log(responseData.added.length);
```
<br/>

### Sync financial connections data
```typescript
const response = await fuseApi.syncFinancialConnectionsData({
    webhook_data: {
        webhook_type: "SYNC_REQUIRED",
        webhook_code: 'TRANSACTIONS',
        financial_connection_id: "the-financial-connection-id",
        environment: "PRODUCTION",
        aggregator: "plaid",
        remote_data: {}
    }
} as SyncFinancialConnectionsDataRequest);

const responseData = response.data as SyncFinancialConnectionsDataResponse;

console.log(responseData.message);
```
<br/>
