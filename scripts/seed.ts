import { ethers } from "hardhat";

// Valid transitions: Created→InTransit→Processing→InTransit→InTransit→InTransit→Delivered
const DEMO_CHECKPOINTS = [
  { locationName: "Sidama, Ethiopia", lat: 6700000, lng: 38500000, status: 1, notes: "Organic Arabica, hand-picked at 1900m elevation. Shipped to washing station.", temp: 2250 },
  { locationName: "Hawassa Washing Station", lat: 7060000, lng: 38480000, status: 2, notes: "Washed process, 72hr fermentation", temp: 1800 },
  { locationName: "Addis Ababa Export Hub", lat: 9020000, lng: 38750000, status: 1, notes: "Graded Q84+, packed in GrainPro bags", temp: 2000 },
  { locationName: "Port of Djibouti", lat: 11590000, lng: 43150000, status: 1, notes: "Container MSCU-2847561 loaded", temp: 2800 },
  { locationName: "Port of Portland, OR", lat: 45600000, lng: -122680000, status: 1, notes: "USDA organic verified at customs", temp: 1500 },
  { locationName: "Rose City Roasters, Portland", lat: 45520000, lng: -122680000, status: 3, notes: "Small-batch roasted, medium profile. Cupping score 87.", temp: 2100 },
];

async function main() {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("Set NEXT_PUBLIC_CONTRACT_ADDRESS in .env first");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Seeding with account:", deployer.address);

  const SupplyChain = await ethers.getContractFactory("SupplyChain");
  const contract = SupplyChain.attach(contractAddress);

  // Register as Certifier (role 4) — can set any status and create projects
  console.log("Registering as Certifier...");
  const regTx = await contract.registerParticipant("SourceTrace Admin", 4, "Portland, OR");
  await regTx.wait();
  console.log("Registered as Certifier");

  // Create a project first (required before creating products)
  console.log("Creating project...");
  const projTx = await contract.createProject(
    "Ethiopian Coffee Supply Chain",
    "Direct trade Ethiopian coffee from Sidama farms to Portland roasters"
  );
  await projTx.wait();
  console.log("Project created (ID: 1)");

  // Create product within the project
  console.log("Creating product...");
  const createTx = await contract.createProduct(
    1, // projectId
    "Ethiopian Sidama Coffee",
    "Sidama, Ethiopia",
    "ETH-SID-2026-0312",
    "0.0.8112267"
  );
  await createTx.wait();
  console.log("Product created!");

  // Add checkpoints — transitions: Created(0)→Processing(2)→InTransit(1)→InTransit(1)→InTransit(1)→Delivered(3)
  for (let i = 0; i < DEMO_CHECKPOINTS.length; i++) {
    const cp = DEMO_CHECKPOINTS[i];
    console.log(`Adding checkpoint ${i + 1}/${DEMO_CHECKPOINTS.length}: ${cp.locationName}`);
    const cpTx = await contract.addCheckpoint(
      1, cp.locationName, cp.lat, cp.lng, cp.status, cp.notes, cp.temp
    );
    await cpTx.wait();
  }

  console.log("\nDemo data seeded successfully!");
  console.log("Visit /track/1 to see the demo.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
