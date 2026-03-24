export enum Role {
  Farmer = 0,
  Processor = 1,
  Distributor = 2,
  Retailer = 3,
  Certifier = 4,
}

export enum ProductStatus {
  Created = 0,
  InTransit = 1,
  Processing = 2,
  Delivered = 3,
  Verified = 4,
  Flagged = 5,
}

export interface Participant {
  name: string;
  role: Role;
  location: string;
  isRegistered: boolean;
  address?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner: string;
  createdAt: number;
  isActive: boolean;
  memberCount: number;
  productCount: number;
}

export interface Product {
  id: number;
  projectId: number;
  name: string;
  origin: string;
  batchId: string;
  creator: string;
  createdAt: number;
  status: ProductStatus;
  checkpointCount: number;
  hcsTopicId: string;
  nftTokenId: string;
  nftSerialNumber: number;
}

export interface Checkpoint {
  id: number;
  productId: number;
  handler: string;
  locationName: string;
  latitude: number;
  longitude: number;
  status: ProductStatus;
  notes: string;
  timestamp: number;
  temperature: number;
  hcsSequenceNumber?: number;
}

export interface HCSMessage {
  type: string;
  productId: number;
  handler: string;
  location: string;
  lat: number;
  lng: number;
  status: string;
  temperature: number;
  notes: string;
  timestamp?: string;
  sequenceNumber?: number;
}

export const RoleLabels: Record<Role, string> = {
  [Role.Farmer]: "Farmer",
  [Role.Processor]: "Processor",
  [Role.Distributor]: "Distributor",
  [Role.Retailer]: "Retailer",
  [Role.Certifier]: "Certifier",
};

export const StatusLabels: Record<ProductStatus, string> = {
  [ProductStatus.Created]: "Created",
  [ProductStatus.InTransit]: "In Transit",
  [ProductStatus.Processing]: "Processing",
  [ProductStatus.Delivered]: "Delivered",
  [ProductStatus.Verified]: "Verified",
  [ProductStatus.Flagged]: "Flagged",
};

export const StatusColors: Record<ProductStatus, string> = {
  [ProductStatus.Created]: "#3b82f6",
  [ProductStatus.InTransit]: "#f59e0b",
  [ProductStatus.Processing]: "#8b5cf6",
  [ProductStatus.Delivered]: "#10b981",
  [ProductStatus.Verified]: "#059669",
  [ProductStatus.Flagged]: "#ef4444",
};

export const RoleIcons: Record<Role, string> = {
  [Role.Farmer]: "sprout",
  [Role.Processor]: "factory",
  [Role.Distributor]: "truck",
  [Role.Retailer]: "store",
  [Role.Certifier]: "shield-check",
};

// ─── Incentive System Types ───

export interface ParticipantStats {
  address: string;
  totalSTR: number;
  reputationScore: number;
  streakDays: number;
  streakMultiplier: number;
  lastActiveTimestamp: number;
  checkpointCount: number;
  verificationCount: number;
  qualityRate: number;
  badgeCount: number;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: number;
  unlocked: boolean;
}

export enum BadgeId {
  FirstCheckpoint = 0,
  TenCheckpoints = 1,
  FiftyCheckpoints = 2,
  FirstVerification = 3,
  TenVerifications = 4,
  WeekStreak = 5,
  MonthStreak = 6,
  TopReputation = 7,
  QualityChampion = 8,
}

export const BADGE_DEFINITIONS: Badge[] = [
  { id: BadgeId.FirstCheckpoint, name: "First Step", description: "Log your first checkpoint", icon: "footprints", unlocked: false },
  { id: BadgeId.TenCheckpoints, name: "Pathfinder", description: "Log 10 checkpoints", icon: "map", unlocked: false },
  { id: BadgeId.FiftyCheckpoints, name: "Supply Chain Pro", description: "Log 50 checkpoints", icon: "trophy", unlocked: false },
  { id: BadgeId.FirstVerification, name: "Quality Gate", description: "Verify your first product", icon: "shield-check", unlocked: false },
  { id: BadgeId.TenVerifications, name: "Trust Builder", description: "Verify 10 products", icon: "badge-check", unlocked: false },
  { id: BadgeId.WeekStreak, name: "Consistent", description: "7-day activity streak", icon: "flame", unlocked: false },
  { id: BadgeId.MonthStreak, name: "Unstoppable", description: "30-day activity streak", icon: "zap", unlocked: false },
  { id: BadgeId.TopReputation, name: "Top Rated", description: "Reach 80+ reputation score", icon: "star", unlocked: false },
  { id: BadgeId.QualityChampion, name: "Quality Champion", description: "95%+ temperature compliance rate", icon: "thermometer", unlocked: false },
];

export interface RewardEvent {
  id: string;
  action: string;
  strEarned: number;
  multiplier: number;
  timestamp: number;
  txHash?: string;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  name: string;
  role: Role;
  location: string;
  reputationScore: number;
  totalSTR: number;
  streakDays: number;
  checkpointCount: number;
  verificationCount: number;
}

// STR reward amounts per action
export const STR_REWARDS = {
  register: 50,
  createProduct: 20,
  addCheckpoint: 10,
  qualityBonus: 5,
  verifyProduct: 30,
  flagProduct: 20,
} as const;

// Streak multiplier thresholds
export const STREAK_MULTIPLIERS = [
  { days: 30, multiplier: 2.0 },
  { days: 7, multiplier: 1.5 },
  { days: 3, multiplier: 1.2 },
] as const;

export function getStreakMultiplier(streakDays: number): number {
  for (const { days, multiplier } of STREAK_MULTIPLIERS) {
    if (streakDays >= days) return multiplier;
  }
  return 1.0;
}

// Reputation tier thresholds
export const REPUTATION_TIERS = [
  { min: 80, label: "Excellent", color: "#10b981" },
  { min: 60, label: "Good", color: "#3b82f6" },
  { min: 40, label: "Average", color: "#f59e0b" },
  { min: 20, label: "Building", color: "#f97316" },
  { min: 0, label: "New", color: "#6b7280" },
] as const;

export function getReputationTier(score: number) {
  for (const tier of REPUTATION_TIERS) {
    if (score >= tier.min) return tier;
  }
  return REPUTATION_TIERS[REPUTATION_TIERS.length - 1];
}
