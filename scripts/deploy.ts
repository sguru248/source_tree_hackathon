import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SupplyChain contract to Hedera Testnet...");

  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.deployed();

  console.log(`SupplyChain deployed to: ${supplyChain.address}`);
  console.log(`\nAdd to .env:\nNEXT_PUBLIC_CONTRACT_ADDRESS=${supplyChain.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
