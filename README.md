# fuse-node

The Fuse library provides convenient access to the Fuse REST API. It includes TypeScript definitions for all request params and response fields. It is intended to be used on the server.

<h2>Documentation</h2>
The API documentation can be found [here]("https://letsfuse.readme.io/reference/post_v1-session-create").
<h2>Installation</h2>

```typescript
npm install fuse-node
```

<h2>Quick start</h2>
Documentation for each method, request param, and response field are available in docstrings and will appear on hover in most modern editors.

<h3>Initialising Fuse Api</h3>
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
<br></br>

<h3>Creating a session</h3>
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
<br></br>

<h2>Creating a session link token</h2>
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

<br></br>

<h2>Exchanging a public token</h2>
```typescript
const response = await fuseApi.exchangeSessionPublicToken({
    public_token: "public-token-from-frontend"
} as ExchangeSessionPublicTokenRequest);

const responseData = response.data as ExchangeSessionPublicTokenResponse;

console.log(responseData.access_token);
console.log(responseData.financial_connection_id);
```
<br></br>

<h2>Verifying a webhook</h2>
<h3>Example using express</h3>
```typescript
app.post("/webhook", async (req: any, response: any) => {
    const isVerified = await fuseApi.verify(req.body, req.headers);
    if (isVerified) {
        //do something
    }
});
```
