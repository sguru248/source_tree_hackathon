import {
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error("HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set in .env");
  }

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(accountId),
    PrivateKey.fromStringECDSA(privateKey)
  );

  console.log("Creating STR (SourceTrace Rewards) fungible token on Hedera Testnet...");

  const pk = PrivateKey.fromStringECDSA(privateKey);

  const tx = await new TokenCreateTransaction()
    .setTokenName("SourceTrace Rewards")
    .setTokenSymbol("STR")
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(0)
    .setInitialSupply(10_000_000) // 10M STR
    .setTreasuryAccountId(AccountId.fromString(accountId))
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(10_000_000)
    .setSupplyKey(pk)
    .setAdminKey(pk)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const tokenId = receipt.tokenId!.toString();

  console.log(`\nSTR Token created successfully!`);
  console.log(`Token ID: ${tokenId}`);
  console.log(`\nAdd to .env:`);
  console.log(`HEDERA_REWARD_TOKEN_ID=${tokenId}`);
  console.log(`NEXT_PUBLIC_REWARD_TOKEN_ID=${tokenId}`);

  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
