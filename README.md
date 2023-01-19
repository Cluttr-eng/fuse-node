# fuse-node

<h2>Create session client secret</h2>
```curl
curl --location --request POST 'https://yz9sph5c42.execute-api.us-east-1.amazonaws.com/v1//session/create' \
--header 'x-api-key: 1234' \
--header 'x-client-id: fuse_client_1234' \
--header 'Content-Type: application/json' \
--data-raw '{
      "supported_financial_institution_aggregators": ["PLAID", "TELLER", "MX"],
      "plaid": {
        "products": ["transactions"]
      },
      "mx": {
          "supports_transaction_history": true
      }
}'
```
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
```curl
curl --location --request POST 'https://yz9sph5c42.execute-api.us-east-1.amazonaws.com/v1//session/link/token/create' \
--header 'x-api-key: 1234' \
--header 'plaid-client-id: 5cb0b915f9c7ee0012d5ab50' \
--header 'plaid-secret: f26308df652218baacfce747ac04a9' \
--header 'teller-application-id: app_oadgehoph93lcmo18c000' \
--header 'teller-certificate: 12345' \
--header 'mx-api-key: 3c3d7243-c6f6-4f68-880a-158552da3e37' \
--header 'mx-client-id: 8ee5ad78-ec05-418f-9698-1b2a2ab33e6f' \
--header 'x-client-id: fuse_client_1234' \
--header 'Content-Type: application/json' \
--data-raw '{
	"institution_id": "institution-id-returned-from-frontend-sdk",
	"user_id": "138239374",
	"session_client_secret": "fuse_sess_dev_6c41a005-becc-467a-9546-7142747c2aac",
	"webhook_url": "www.plaid.com",
	"plaid": {
		"config": {
			"client_name": "my-client-name"
		}
	},
    "mx": {
          "config": {}
      }
}'
```
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
```curl
curl --location --request POST 'https://yz9sph5c42.execute-api.us-east-1.amazonaws.com/v1//session/public_token/exchange' \
--header 'x-api-key: 1234' \
--header 'Content-Type: application/json' \
--data-raw '{
      "public_token": "public-token-returned-from-frontend-sdk"
}'
```
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

