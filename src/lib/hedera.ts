import {
  Client,
  AccountId,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TransferTransaction,
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

// HCS Functions
export async function createTopic(): Promise<string> {
  const client = getClient();
  const tx = await new TopicCreateTransaction().execute(client);
  const receipt = await tx.getReceipt(client);
  const topicId = receipt.topicId!.toString();
  client.close();
  return topicId;
}

export async function submitCheckpointMessage(
  topicId: string,
  message: {
    type: string;
    productId: number;
    handler: string;
    location: string;
    lat: number;
    lng: number;
    status: string;
    temperature: number;
    notes: string;
  }
): Promise<{ sequenceNumber: number; timestamp: string }> {
  const client = getClient();
  const tx = await new TopicMessageSubmitTransaction({
    topicId,
    message: JSON.stringify({ ...message, timestamp: new Date().toISOString() }),
  }).execute(client);
  const receipt = await tx.getReceipt(client);
  client.close();
  return {
    sequenceNumber: receipt.topicSequenceNumber!.toNumber(),
    timestamp: new Date().toISOString(),
  };
}

// HTS Functions
export async function createNFTToken(): Promise<string> {
  const client = getClient();
  const accountId = process.env.HEDERA_ACCOUNT_ID!;
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!);

  const tx = await new TokenCreateTransaction()
    .setTokenName("SourceTrace Verified")
    .setTokenSymbol("STRACE")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(AccountId.fromString(accountId))
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(10000)
    .setSupplyKey(privateKey)
    .setAdminKey(privateKey)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const tokenId = receipt.tokenId!.toString();
  client.close();
  return tokenId;
}

export async function mintNFT(
  tokenId: string,
  metadata: {
    productId: number;
    name: string;
    origin: string;
    batchId: string;
    checkpointCount: number;
    verifiedAt: string;
    hcsTopicId: string;
  }
): Promise<number> {
  const client = getClient();
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!);

  const metadataBytes = Buffer.from(JSON.stringify(metadata));

  const tx = await new TokenMintTransaction()
    .setTokenId(tokenId)
    .addMetadata(metadataBytes)
    .freezeWith(client)
    .sign(privateKey);

  const submitted = await tx.execute(client);
  const receipt = await submitted.getReceipt(client);
  const serialNumber = receipt.serials![0].toNumber();
  client.close();
  return serialNumber;
}

// ─── HTS Fungible Token Functions ───

export async function createFungibleToken(
  name: string,
  symbol: string,
  initialSupply: number,
  maxSupply: number
): Promise<string> {
  const client = getClient();
  const accountId = process.env.HEDERA_ACCOUNT_ID!;
  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!);

  const tx = await new TokenCreateTransaction()
    .setTokenName(name)
    .setTokenSymbol(symbol)
    .setTokenType(TokenType.FungibleCommon)
    .setDecimals(0)
    .setInitialSupply(initialSupply)
    .setTreasuryAccountId(AccountId.fromString(accountId))
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(maxSupply)
    .setSupplyKey(privateKey)
    .setAdminKey(privateKey)
    .execute(client);

  const receipt = await tx.getReceipt(client);
  const tokenId = receipt.tokenId!.toString();
  client.close();
  return tokenId;
}

export async function transferFungibleToken(
  tokenId: string,
  recipientAccountId: string,
  amount: number
): Promise<string> {
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
