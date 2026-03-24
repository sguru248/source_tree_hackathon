import {
  Client,
  AccountId,
  PrivateKey,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID!;
  const privateKey = process.env.HEDERA_PRIVATE_KEY!;

  if (!accountId || !privateKey) {
    console.error("Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY in .env");
    process.exit(1);
  }

  const client = Client.forTestnet();
  client.setOperator(
    AccountId.fromString(accountId),
    PrivateKey.fromStringECDSA(privateKey)
  );

  // 1. Create HCS Topic
  console.log("Creating HCS topic...");
  const topicTx = await new TopicCreateTransaction().execute(client);
  const topicReceipt = await topicTx.getReceipt(client);
  const topicId = topicReceipt.topicId!.toString();
  console.log(`HCS Topic created: ${topicId}`);

  // 2. Submit demo checkpoint messages to HCS
  const checkpointMessages = [
    { type: "checkpoint", productId: 1, handler: "Sidama Farmers Cooperative", location: "Sidama, Ethiopia", lat: 6.7, lng: 38.5, status: "harvested", temperature: 22.5, notes: "Organic Arabica, hand-picked at 1900m elevation" },
    { type: "checkpoint", productId: 1, handler: "Hawassa Processing Co.", location: "Hawassa Washing Station", lat: 7.06, lng: 38.48, status: "processing", temperature: 18, notes: "Washed process, 72hr fermentation" },
    { type: "checkpoint", productId: 1, handler: "Ethiopian Coffee Export", location: "Addis Ababa Export Hub", lat: 9.02, lng: 38.75, status: "in_transit", temperature: 20, notes: "Graded Q84+, packed in GrainPro bags" },
    { type: "checkpoint", productId: 1, handler: "Global Shipping Lines", location: "Port of Djibouti", lat: 11.59, lng: 43.15, status: "in_transit", temperature: 28, notes: "Container MSCU-2847561 loaded" },
    { type: "checkpoint", productId: 1, handler: "Pacific Northwest Import", location: "Port of Portland, OR", lat: 45.6, lng: -122.68, status: "in_transit", temperature: 15, notes: "USDA organic verified at customs" },
    { type: "checkpoint", productId: 1, handler: "Rose City Roasters", location: "Rose City Roasters, Portland", lat: 45.52, lng: -122.68, status: "delivered", temperature: 21, notes: "Small-batch roasted, medium profile. Cupping score 87." },
  ];

  for (let i = 0; i < checkpointMessages.length; i++) {
    const msg = { ...checkpointMessages[i], timestamp: new Date().toISOString() };
    console.log(`Submitting HCS message ${i + 1}/6: ${msg.location}`);
    const msgTx = await new TopicMessageSubmitTransaction({
      topicId,
      message: JSON.stringify(msg),
    }).execute(client);
    await msgTx.getReceipt(client);
  }
  console.log("All HCS messages submitted!");

  // 3. Create NFT Token
  console.log("\nCreating NFT token...");
  const pk = PrivateKey.fromStringECDSA(privateKey);
  const nftTx = await new TokenCreateTransaction()
    .setTokenName("SourceTrace Verified")
    .setTokenSymbol("STRACE")
    .setTokenType(TokenType.NonFungibleUnique)
    .setDecimals(0)
    .setInitialSupply(0)
    .setTreasuryAccountId(AccountId.fromString(accountId))
    .setSupplyType(TokenSupplyType.Finite)
    .setMaxSupply(10000)
    .setSupplyKey(pk)
    .setAdminKey(pk)
    .freezeWith(client)
    .sign(pk);

  const nftSubmitted = await nftTx.execute(client);
  const nftReceipt = await nftSubmitted.getReceipt(client);
  const tokenId = nftReceipt.tokenId!.toString();
  console.log(`NFT Token created: ${tokenId}`);

  client.close();

  console.log("\n========================================");
  console.log("Update your .env with these values:");
  console.log(`HEDERA_NFT_TOKEN_ID=${tokenId}`);
  console.log("========================================");
  console.log(`\nHCS Topic ID for seed script: ${topicId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
