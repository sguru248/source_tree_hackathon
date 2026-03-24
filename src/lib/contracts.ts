import { ethers } from "ethers";
import { Product, Checkpoint, ProductStatus, Role, Project, Participant } from "@/types";

const CONTRACT_ABI = [
  // Registration
  "function registerParticipant(string memory _name, uint8 _role, string memory _location) external",
  "function participants(address) external view returns (string name, uint8 role, string location, bool isRegistered)",

  // Project management
  "function createProject(string memory _name, string memory _description) external",
  "function requestJoinProject(uint256 _projectId) external",
  "function approveJoinRequest(uint256 _projectId, address _participant) external",
  "function rejectJoinRequest(uint256 _projectId, address _participant) external",

  // Project reads
  "function getProject(uint256 _projectId) external view returns (tuple(uint256 id, string name, string description, address owner, uint256 createdAt, bool isActive, uint256 memberCount, uint256 productCount))",
  "function getProjectMembers(uint256 _projectId) external view returns (address[])",
  "function getPendingRequests(uint256 _projectId) external view returns (address[])",
  "function getProjectProducts(uint256 _projectId) external view returns (uint256[])",
  "function isProjectMember(uint256 _projectId, address _addr) external view returns (bool)",
  "function isPendingRequest(uint256 _projectId, address _addr) external view returns (bool)",
  "function projectCount() external view returns (uint256)",

  // Product management
  "function createProduct(uint256 _projectId, string memory _name, string memory _origin, string memory _batchId, string memory _hcsTopicId) external returns (uint256)",
  "function addCheckpoint(uint256 _productId, string memory _locationName, int256 _latitude, int256 _longitude, uint8 _status, string memory _notes, int256 _temperature) external",
  "function verifyProduct(uint256 _productId) external",
  "function flagProduct(uint256 _productId, string memory _reason) external",
  "function linkNFT(uint256 _productId, string memory _nftTokenId, uint256 _serialNumber) external",

  // Product reads
  "function getProduct(uint256 _productId) external view returns (tuple(uint256 id, uint256 projectId, string name, string origin, string batchId, address creator, uint256 createdAt, uint8 status, uint256 checkpointCount, string hcsTopicId, string nftTokenId, uint256 nftSerialNumber))",
  "function getCheckpoints(uint256 _productId) external view returns (tuple(uint256 id, uint256 productId, address handler, string locationName, int256 latitude, int256 longitude, uint8 status, string notes, uint256 timestamp, int256 temperature, uint256 hcsSequenceNumber)[])",
  "function getStats() external view returns (uint256, uint256, uint256)",
  "function productCount() external view returns (uint256)",
  "function participantCount() external view returns (uint256)",

  // HCS cross-reference
  "function linkHCSSequence(uint256 _productId, uint256 _checkpointIndex, uint256 _sequenceNumber) external",

  // Pausable / Ownership
  "function pause() external",
  "function unpause() external",
  "function paused() external view returns (bool)",
  "function owner() external view returns (address)",
];

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://testnet.hashio.io/api";
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export function getProvider(): ethers.providers.JsonRpcProvider {
  return new ethers.providers.JsonRpcProvider(RPC_URL);
}

export function getReadContract(): ethers.Contract {
  const provider = getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export async function getWriteContract(): Promise<ethers.Contract> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not found");
  }
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

// ─── Registration ───

export async function registerParticipant(name: string, role: Role, location: string): Promise<ethers.ContractTransaction> {
  const contract = await getWriteContract();
  return contract.registerParticipant(name, role, location);
}

export async function checkParticipant(address: string): Promise<Participant> {
  const contract = getReadContract();
  const p = await contract.participants(address);
  return { isRegistered: p.isRegistered, name: p.name, role: p.role as Role, location: p.location };
}

// ─── Project Management ───

export async function createProject(name: string, description: string): Promise<ethers.ContractTransaction> {
  const contract = await getWriteContract();
  return contract.createProject(name, description);
}

export async function requestJoinProject(projectId: number): Promise<ethers.ContractTransaction> {
  const contract = await getWriteContract();
  return contract.requestJoinProject(projectId);
}

export async function approveJoinRequest(projectId: number, participant: string): Promise<ethers.ContractTransaction> {
  const contract = await getWriteContract();
  return contract.approveJoinRequest(projectId, participant);
}

export async function rejectJoinRequest(projectId: number, participant: string): Promise<ethers.ContractTransaction> {
  const contract = await getWriteContract();
  return contract.rejectJoinRequest(projectId, participant);
}

// ─── Project Reads ───

export async function fetchProject(projectId: number): Promise<Project> {
  const contract = getReadContract();
  const p = await contract.getProject(projectId);
  return {
    id: p.id.toNumber(),
    name: p.name,
    description: p.description,
    owner: p.owner,
    createdAt: p.createdAt.toNumber(),
    isActive: p.isActive,
    memberCount: p.memberCount.toNumber(),
    productCount: p.productCount.toNumber(),
  };
}

export async function fetchProjectMembers(projectId: number): Promise<address[]> {
  const contract = getReadContract();
  return contract.getProjectMembers(projectId);
}

export async function fetchPendingRequests(projectId: number): Promise<string[]> {
  const contract = getReadContract();
  return contract.getPendingRequests(projectId);
}

export async function fetchProjectProductIds(projectId: number): Promise<number[]> {
  const contract = getReadContract();
  const ids = await contract.getProjectProducts(projectId);
  return ids.map((id: any) => id.toNumber());
}

export async function checkProjectMembership(projectId: number, address: string): Promise<boolean> {
  const contract = getReadContract();
  return contract.isProjectMember(projectId, address);
}

export async function checkPendingRequest(projectId: number, address: string): Promise<boolean> {
  const contract = getReadContract();
  return contract.isPendingRequest(projectId, address);
}

export async function fetchProjectCount(): Promise<number> {
  const contract = getReadContract();
  const count = await contract.projectCount();
  return count.toNumber();
}

// ─── Product Management ───

export async function createProduct(projectId: number, name: string, origin: string, batchId: string, hcsTopicId: string): Promise<ethers.ContractTransaction> {
  const contract = await getWriteContract();
  return contract.createProduct(projectId, name, origin, batchId, hcsTopicId);
}

export async function addCheckpoint(
  productId: number,
  locationName: string,
  latitude: number,
  longitude: number,
  status: ProductStatus,
  notes: string,
  temperature: number
): Promise<ethers.ContractTransaction> {
  const contract = await getWriteContract();
  const lat = Math.round(latitude * 1e6);
  const lng = Math.round(longitude * 1e6);
  const temp = Math.round(temperature * 100);
  return contract.addCheckpoint(productId, locationName, lat, lng, status, notes, temp);
}

export async function verifyProduct(productId: number): Promise<ethers.ContractTransaction> {
  const contract = await getWriteContract();
  return contract.verifyProduct(productId);
}

export async function linkNFT(productId: number, nftTokenId: string, serialNumber: number): Promise<ethers.ContractTransaction> {
  const contract = await getWriteContract();
  return contract.linkNFT(productId, nftTokenId, serialNumber);
}

// ─── Product Reads ───

export async function fetchProduct(productId: number): Promise<Product> {
  const contract = getReadContract();
  const p = await contract.getProduct(productId);
  return {
    id: p.id.toNumber(),
    projectId: p.projectId.toNumber(),
    name: p.name,
    origin: p.origin,
    batchId: p.batchId,
    creator: p.creator,
    createdAt: p.createdAt.toNumber(),
    status: p.status as ProductStatus,
    checkpointCount: p.checkpointCount.toNumber(),
    hcsTopicId: p.hcsTopicId,
    nftTokenId: p.nftTokenId,
    nftSerialNumber: p.nftSerialNumber.toNumber(),
  };
}

export async function fetchCheckpoints(productId: number): Promise<Checkpoint[]> {
  const contract = getReadContract();
  const cps = await contract.getCheckpoints(productId);
  return cps.map((cp: any) => ({
    id: cp.id.toNumber(),
    productId: cp.productId.toNumber(),
    handler: cp.handler,
    locationName: cp.locationName,
    latitude: cp.latitude.toNumber() / 1e6,
    longitude: cp.longitude.toNumber() / 1e6,
    status: cp.status as ProductStatus,
    notes: cp.notes,
    timestamp: cp.timestamp.toNumber(),
    temperature: cp.temperature.toNumber() / 100,
    hcsSequenceNumber: cp.hcsSequenceNumber.toNumber(),
  }));
}

// ─── HCS Cross-Reference ───

export async function linkHCSSequence(productId: number, checkpointIndex: number, sequenceNumber: number): Promise<ethers.ContractTransaction> {
  const contract = await getWriteContract();
  return contract.linkHCSSequence(productId, checkpointIndex, sequenceNumber);
}

// ─── Validation Helpers ───

export function validateCheckpointInputs(lat: number, lng: number, temp: number): string | null {
  if (lat < -90 || lat > 90) return "Latitude must be between -90 and 90";
  if (lng < -180 || lng > 180) return "Longitude must be between -180 and 180";
  if (temp < -100 || temp > 100) return "Temperature must be between -100°C and 100°C";
  return null;
}

export function getValidNextStatuses(currentStatus: ProductStatus): ProductStatus[] {
  switch (currentStatus) {
    case ProductStatus.Created:
      return [ProductStatus.InTransit, ProductStatus.Processing, ProductStatus.Flagged];
    case ProductStatus.InTransit:
      return [ProductStatus.InTransit, ProductStatus.Processing, ProductStatus.Delivered, ProductStatus.Flagged];
    case ProductStatus.Processing:
      return [ProductStatus.InTransit, ProductStatus.Delivered, ProductStatus.Flagged];
    case ProductStatus.Delivered:
      return [ProductStatus.Verified, ProductStatus.Flagged];
    case ProductStatus.Verified:
    case ProductStatus.Flagged:
      return [];
    default:
      return [];
  }
}

export function getStatusesForRole(role: Role): ProductStatus[] {
  switch (role) {
    case Role.Farmer:
      return [ProductStatus.Created, ProductStatus.InTransit];
    case Role.Processor:
      return [ProductStatus.Processing, ProductStatus.InTransit];
    case Role.Distributor:
      return [ProductStatus.InTransit, ProductStatus.Delivered];
    case Role.Retailer:
      return [ProductStatus.Delivered];
    case Role.Certifier:
      return [ProductStatus.Created, ProductStatus.InTransit, ProductStatus.Processing, ProductStatus.Delivered, ProductStatus.Verified, ProductStatus.Flagged];
    default:
      return [];
  }
}

export function getAvailableStatuses(currentStatus: ProductStatus, role: Role): ProductStatus[] {
  const validTransitions = getValidNextStatuses(currentStatus);
  const roleStatuses = getStatusesForRole(role);
  return validTransitions.filter(s => roleStatuses.includes(s));
}

export async function fetchStats(): Promise<{ products: number; participants: number; checkpoints: number }> {
  const contract = getReadContract();
  const [products, participants, checkpoints] = await contract.getStats();
  return {
    products: products.toNumber(),
    participants: participants.toNumber(),
    checkpoints: checkpoints.toNumber(),
  };
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

type address = string;
