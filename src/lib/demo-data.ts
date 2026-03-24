import { Product, Checkpoint, ProductStatus, Role, Project, Participant } from "@/types";

// ─── Demo Project ───

export const DEMO_PROJECT: Project = {
  id: 1,
  name: "Siva Trader's Coffee Supply Chain",
  description: "Direct trade Ethiopian coffee from Sidama farms to Portland roasters",
  owner: "0x0000000000000000000000000000000000000006",
  createdAt: Math.floor(Date.now() / 1000) - 86400 * 30,
  isActive: true,
  memberCount: 5,
  productCount: 1,
};

// ─── Demo Members (within project) ───

export const DEMO_MEMBERS: Participant[] = [
  { name: "Siva Trader", role: Role.Retailer, location: "Portland, OR", isRegistered: true, address: "0x0000000000000000000000000000000000000006" },
  { name: "Abebe Tadesse", role: Role.Farmer, location: "Sidama, Ethiopia", isRegistered: true, address: "0x0000000000000000000000000000000000000001" },
  { name: "Hawassa Washing Co.", role: Role.Processor, location: "Hawassa, Ethiopia", isRegistered: true, address: "0x0000000000000000000000000000000000000002" },
  { name: "EthioExport Ltd", role: Role.Distributor, location: "Addis Ababa, Ethiopia", isRegistered: true, address: "0x0000000000000000000000000000000000000003" },
  { name: "Pacific Shipping", role: Role.Distributor, location: "Djibouti / Portland", isRegistered: true, address: "0x0000000000000000000000000000000000000004" },
];

export const DEMO_PENDING_REQUESTS: Participant[] = [
  { name: "New Farm Co.", role: Role.Farmer, location: "Yirgacheffe, Ethiopia", isRegistered: true, address: "0x0000000000000000000000000000000000000099" },
];

// ─── Demo Product ───

export const DEMO_PRODUCT: Product = {
  id: 1,
  projectId: 1,
  name: "Ethiopian Sidama Coffee",
  origin: "Sidama, Ethiopia",
  batchId: "ETH-SID-2026-0312",
  creator: "0x0000000000000000000000000000000000000001",
  createdAt: Math.floor(Date.now() / 1000) - 86400 * 14,
  status: ProductStatus.Verified,
  checkpointCount: 6,
  hcsTopicId: "0.0.8112267",
  nftTokenId: "0.0.8112269",
  nftSerialNumber: 1,
};

// ─── Demo Checkpoints ───

export const DEMO_CHECKPOINTS: Checkpoint[] = [
  {
    id: 1,
    productId: 1,
    handler: "0x0000000000000000000000000000000000000001",
    locationName: "Sidama, Ethiopia",
    latitude: 6.7,
    longitude: 38.5,
    status: ProductStatus.InTransit,
    notes: "Organic Arabica, hand-picked at 1900m elevation. Shade-grown under native trees. Shipped to washing station.",
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 14,
    temperature: 22.5,
  },
  {
    id: 2,
    productId: 1,
    handler: "0x0000000000000000000000000000000000000002",
    locationName: "Hawassa Washing Station",
    latitude: 7.06,
    longitude: 38.48,
    status: ProductStatus.Processing,
    notes: "Washed process, 72hr fermentation. Dried on raised beds for 12 days.",
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 12,
    temperature: 18,
  },
  {
    id: 3,
    productId: 1,
    handler: "0x0000000000000000000000000000000000000003",
    locationName: "Addis Ababa Export Hub",
    latitude: 9.02,
    longitude: 38.75,
    status: ProductStatus.InTransit,
    notes: "Graded Q84+, packed in GrainPro bags. Export certificate issued.",
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 10,
    temperature: 20,
  },
  {
    id: 4,
    productId: 1,
    handler: "0x0000000000000000000000000000000000000004",
    locationName: "Port of Djibouti",
    latitude: 11.59,
    longitude: 43.15,
    status: ProductStatus.InTransit,
    notes: "Container MSCU-2847561 loaded. Temperature-controlled shipping.",
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 8,
    temperature: 28,
  },
  {
    id: 5,
    productId: 1,
    handler: "0x0000000000000000000000000000000000000005",
    locationName: "Port of Portland, OR",
    latitude: 45.6,
    longitude: -122.68,
    status: ProductStatus.InTransit,
    notes: "USDA organic verified at customs. Phytosanitary certificate cleared.",
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 3,
    temperature: 15,
  },
  {
    id: 6,
    productId: 1,
    handler: "0x0000000000000000000000000000000000000006",
    locationName: "Rose City Roasters, Portland",
    latitude: 45.52,
    longitude: -122.68,
    status: ProductStatus.Delivered,
    notes: "Small-batch roasted, medium profile. Cupping score 87. Ready for retail.",
    timestamp: Math.floor(Date.now() / 1000) - 86400 * 1,
    temperature: 21,
  },
];

// ─── Demo Participants (legacy, for /track page fallback) ───

export const DEMO_PARTICIPANTS = [
  { name: "Sidama Farmers Cooperative", role: Role.Farmer, location: "Sidama, Ethiopia" },
  { name: "Hawassa Processing Co.", role: Role.Processor, location: "Hawassa, Ethiopia" },
  { name: "Ethiopian Coffee Export", role: Role.Distributor, location: "Addis Ababa, Ethiopia" },
  { name: "Global Shipping Lines", role: Role.Distributor, location: "Djibouti" },
  { name: "Pacific Northwest Import", role: Role.Distributor, location: "Portland, OR" },
  { name: "Rose City Roasters", role: Role.Retailer, location: "Portland, OR" },
];

export const DEMO_HCS_MESSAGES = DEMO_CHECKPOINTS.map((cp, i) => ({
  type: "checkpoint",
  productId: cp.productId,
  handler: DEMO_PARTICIPANTS[i].name,
  location: cp.locationName,
  lat: cp.latitude,
  lng: cp.longitude,
  status: cp.status === ProductStatus.Created ? "harvested" :
          cp.status === ProductStatus.Processing ? "processing" :
          cp.status === ProductStatus.InTransit ? "in_transit" :
          cp.status === ProductStatus.Delivered ? "delivered" : "verified",
  temperature: cp.temperature,
  notes: cp.notes,
  timestamp: new Date(cp.timestamp * 1000).toISOString(),
  sequenceNumber: i + 1,
}));
