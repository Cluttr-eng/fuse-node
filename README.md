# fuse-node

<h2>Create session client secret</h2>
```typescript node
import {
  Configuration,
  FuseApi,
  CreateSessionRequest,
  CreateSessionResponse
} from "fuse-node";


const fuseApi = new FuseApi(
    new Configuration(
        "sandbox",
        "my-x-api-key-value",
        "my-x-client-id-value",
        "my-plaid-client-id-value",
        "my-plaid-secret-value",
        "my-teller-application-id-value",
        "my-teller-certificate-value",
        "my-teller-token-signing-key",
        "my-mx-client-id",
        "my-mx-api-key",
    )
);

fuseApi.createSession({
      "supported_financial_institution_aggregators": ["PLAID", "TELLER", "MX"],
      "plaid": {
        "products": ["transactions"]
      },
      "mx": {
          "supports_transaction_history": true
      }
});
```

<h2>Create session link token</h2>
```typescript node
import {
  Configuration,
  FuseApi,
  LinkTokenCreateRequest,
  LinkTokenCreateResponse
} from "fuse-node";


const fuseApi = new FuseApi(
    new Configuration(
        "sandbox",
        "my-x-api-key-value",
        "my-x-client-id-value",
        "my-plaid-client-id-value",
        "my-plaid-secret-value",
        "my-teller-application-id-value",
        "my-teller-certificate-value",
        "my-teller-token-signing-key",
        "my-mx-client-id",
        "my-mx-api-key",
    )
);

fuseApi.createSessionLinkToken({
      user_id: "my-user-id",
      session_client_secret: "my-session-client-secret",
      webhook_url: "https://my-webhook.com/webhook",
      institution_id: "institution-id-returned-from-frontend-sdk",
      plaid: {
          config: {
            client_name: 'Plaid Test App', //This is needed or else the request won't work. Replace with your client name
          },
      },
      mx: {
          config: {},
      }
});
```

<h2>Exchange public token</h2>
```typescript node
import {
  Configuration,
  FuseApi,
  ExchangeSessionPublicTokenRequest,
  ExchangeSessionPublicTokenResponse
} from "fuse-node";


const fuseApi = new FuseApi(
    new Configuration(
        "sandbox",
        "my-x-api-key-value",
        "my-x-client-id-value",
        "my-plaid-client-id-value",
        "my-plaid-secret-value",
        "my-teller-application-id-value",
        "my-teller-certificate-value",
        "my-teller-token-signing-key",
        "my-mx-client-id",
        "my-mx-api-key",
    )
);

fuseApi.exchangeSessionPublicToken({
	public_token: "public-token-returned-from-frontend-sdk"
});
```

