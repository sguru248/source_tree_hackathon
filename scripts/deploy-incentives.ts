import { ethers } from "hardhat";

async function main() {
  console.log("Deploying SourceTraceIncentives contract to Hedera Testnet...");

  const Incentives = await ethers.getContractFactory("SourceTraceIncentives");
  const incentives = await Incentives.deploy();
  await incentives.deployed();

  console.log(`SourceTraceIncentives deployed to: ${incentives.address}`);
  console.log(`\nAdd to .env:\nNEXT_PUBLIC_INCENTIVES_CONTRACT_ADDRESS=${incentives.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
