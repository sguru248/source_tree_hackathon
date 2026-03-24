import {
  Client,
  AccountId,
  PrivateKey,
  TransferTransaction,
  TokenAssociateTransaction,
} from "@hashgraph/sdk";

function getClient(): Client {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error("HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set");
  }

  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(accountId), PrivateKey.fromStringECDSA(privateKey));
  return client;
}

/**
 * Transfer STR fungible tokens from treasury to a participant.
 * Note: Recipient must have associated with the token first.
 */
export async function transferSTR(recipientAccountId: string, amount: number): Promise<string> {
  const tokenId = process.env.HEDERA_REWARD_TOKEN_ID;
  if (!tokenId) throw new Error("HEDERA_REWARD_TOKEN_ID not set");

  const client = getClient();
  const treasuryId = process.env.HEDERA_ACCOUNT_ID!;

  const tx = await new TransferTransaction()
    .addTokenTransfer(tokenId, treasuryId, -amount)
    .addTokenTransfer(tokenId, recipientAccountId, amount)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  client.close();
  return receipt.status.toString();
}

/**
 * Associate a participant's account with the STR token.
 * Must be called before they can receive tokens.
 */
export async function associateToken(accountId: string): Promise<string> {
  const tokenId = process.env.HEDERA_REWARD_TOKEN_ID;
  if (!tokenId) throw new Error("HEDERA_REWARD_TOKEN_ID not set");

  const client = getClient();

  const tx = await new TokenAssociateTransaction()
    .setAccountId(accountId)
    .setTokenIds([tokenId])
    .execute(client);

  const receipt = await tx.getReceipt(client);
  client.close();
  return receipt.status.toString();
}
