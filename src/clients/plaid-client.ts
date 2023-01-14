import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

export const getPlaidClient = (clientId: string, secret: string): PlaidApi => {
  const configuration = new Configuration({
    basePath: getBasePath(),
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
        "Plaid-Version": "2019-05-29",
      },
    },
  });
  return new PlaidApi(configuration);
};

function getBasePath(): string {
  return {
    sandbox: PlaidEnvironments.sandbox,
    development: PlaidEnvironments.development,
    production: PlaidEnvironments.production,
  }[
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    process.env.PLAID_BASE_PATH
  ];
}
