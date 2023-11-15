# fuse-node

The Fuse library provides convenient access to the Fuse REST API. It includes TypeScript definitions for all request params and response fields. It is intended to be used on the server.

## Installation
```
npm install fuse-node
```

## Quick start
Documentation for each method, request param, and response field are available in docstrings and will appear on hover in most modern editors.

BREAKING: the syncFinancialConnectionsData has changed from v2 onwards, see below for more information.

### Initialising the Fuse Api
```typescript

import {FuseApi, Configuration} from "fuse-node";

const configuration = new Configuration({
    basePath: config.FUSE_BASE_PATH,
    baseOptions: {
        headers: {
            'Fuse-Client-Id': 'my-fuse-client-id',
            'Fuse-Api-Key': 'my-fuse-api-key',
            'Content-Type': 'application/json',
            'Plaid-Client-Id': 'my-plaid-client-id',
            'Plaid-Secret': 'my-plaid-secret-id',
            'Teller-Application-Id': 'my-teller-application-id',
            'Teller-Certificate': 'my-teller-certificate',
            'Teller-Private-Key': 'my-teller-private-key',
            'Teller-Signing-Secret': 'my-teller-signing-secret',
            'Mx-Client-Id': 'my-mx-client-id',
            'Mx-Api-Key': 'my-mx-api-key',
        },
    },
});

const fuseApi = new FuseApi(configuration);
```
<br/>

### Creating a session
```typescript
//If you are using web SDKs, pass in the "is_web_view" property and set it to false, otherwise the Fuse frontend will not work. 
const response = await fuseApi.createSession({
    supported_financial_institution_aggregators: ["plaid", "teller", "mx"],
    entity: {
        id: "12345"
    },
    products: ["account_details", "transactions"]
} as CreateSessionRequest);

const session = response.data as CreateSessionResponse;

console.log(session.client_secret)
```
<br/>

### Creating a link token
```typescript
const response = await fuseApi.createLinkToken({
    institution_id: "fuse-institution-id-from-frontend",
    session_client_secret: "session-client-secret",
    entity: {
        id: "12345"
    },
    client_name: "my-company-name"
} as CreateLinkTokenRequest);

const linkTokenData = response.data as CreateLinkTokenResponse;

console.log(linkTokenData.link_token);
```

<br/>

### Exchanging a public token
```typescript
const response = await fuseApi.exchangeFinancialConnectionsPublicToken({
    public_token: "public-token-from-frontend"
} as ExchangeFinancialConnectionsPublicTokenRequest);

const responseData = response.data as ExchangeFinancialConnectionsPublicTokenResponse;

console.log(responseData.access_token);
console.log(responseData.financial_connection_id);
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

### Sync financial connections data
V2 onwards:
```typescript
const fuseVerificationHeader = headers[
    'fuse-verification'
] as string;
const response = await fuseApi.syncFinancialConnectionsData(fuseVerificationHeader, webhookEvent);
```

V1:
```typescript
const fuseVerificationHeader = headers[
    'fuse-verification'
] as string;
const response = await fuseApi.syncFinancialConnectionsData(webhookEvent, {
    headers: {
        'fuse-verification': fuseVerificationHeader
    }
});
```
<br/>
