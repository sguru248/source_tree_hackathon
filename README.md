# SourceTrace — Farm-to-Fork Food Verification on Hedera

> Scan your food. Know its story. Trust the journey.

SourceTrace is a blockchain-powered supply chain transparency platform built on **Hedera Hashgraph**. It tracks food products from origin to shelf using Smart Contracts, Hedera Consensus Service (HCS), and Hedera Token Service (HTS) — giving consumers verifiable proof of their food's journey through a simple QR code scan.

![Hedera](https://img.shields.io/badge/Hedera-Testnet-blue) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Solidity](https://img.shields.io/badge/Solidity-0.8.19-purple) ![License](https://img.shields.io/badge/License-MIT-green)

---

## Problem

- **$40B+** in annual food fraud globally
- Consumers have zero visibility into where their food comes from
- Existing traceability systems are centralized, opaque, and easily manipulated
- Supply chain participants lack incentives to maintain data quality

## Solution

SourceTrace creates an **immutable, transparent, and incentivized** food supply chain on Hedera:

1. **On-chain tracking** — Every checkpoint (farm, processor, distributor, retailer) is recorded on-chain with GPS coordinates, temperature data, and timestamps
2. **Consensus audit trail** — HCS provides tamper-proof, timestamped logs for every supply chain event
3. **NFT certification** — Verified products receive an HTS NFT certificate as proof of authenticity
4. **Gamified incentives** — STR token rewards, reputation scores, streaks, and badges drive consistent participation
5. **Consumer trust** — A simple QR scan reveals the complete journey with an interactive map

---

## Demo

### Live Demo
> **[Live URL]** *(to be deployed on Netlify)*

### Demo Video
> **[YouTube URL]** *(to be recorded)*

---

## Features

### For Consumers
- **QR Code Scanner** — Scan product QR codes to view the full supply chain journey
- **Interactive Map** — Leaflet-powered map with animated route visualization and color-coded checkpoints
- **Journey Timeline** — Step-by-step timeline with handler info, location, temperature, and status
- **NFT Certificate** — View the on-chain verification certificate with NFT details
- **Blockchain Verification** — Direct links to HCS topics, NFT tokens, and contract on HashScan

### For Supply Chain Participants
- **Role-Based Dashboard** — Register as Farmer, Processor, Distributor, Retailer, or Certifier
- **Project Management** — Create projects, invite members, manage join requests
- **Product Tracking** — Create products, log checkpoints with GPS + temperature data
- **Product Verification** — Verify products and mint NFT certificates
- **Quality Flagging** — Flag products with issues; terminal state prevents further changes

### Incentive System (B2B Retention Layer)
- **STR Token Rewards** — Earn tokens for every supply chain action (register, checkpoint, verify)
- **Reputation Score** — On-chain 0-100 score based on activity, quality, and consistency
- **Streak System** — Consecutive daily activity multiplies rewards (up to 2x at 30 days)
- **9 Achievement Badges** — First Checkpoint, Pathfinder, Supply Chain Pro, Quality Gate, Trust Builder, Consistent, Unstoppable, Top Rated, Quality Champion
- **Role-Based Leaderboard** — Find top-ranked partners filtered by role
- **Certifier Staking** — Stake 500 STR to certify; -100 STR slash on flagged products

---

## Hedera Integration

SourceTrace leverages **all three core Hedera services**:

### 1. Smart Contracts (EVM on Hedera)
- **SupplyChain.sol** — Core contract managing participants, projects, products, and checkpoints
- **SourceTraceIncentives.sol** — Rewards, reputation, streaks, badges, and leaderboard
- Deployed via Hardhat through HashIO JSON-RPC relay
- Role-based access control with pausable state machine

### 2. Hedera Consensus Service (HCS)
- Each product gets a dedicated HCS topic
- Every checkpoint is submitted as a JSON message with consensus timestamp
- Provides an immutable, ordered audit trail queryable via Mirror Node
- Cross-referenced with on-chain checkpoint data via `hcsSequenceNumber`

### 3. Hedera Token Service (HTS)
- **STRACE NFT** — Non-fungible token minted for each verified product with full metadata
- **STR Token** — Fungible reward token for incentive system
- Treasury and supply key managed server-side via `@hashgraph/sdk`

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Consumer                          │
│              Scan QR → /track/{id}                   │
│         Map + Timeline + Certificate + QR            │
└──────────────┬───────────────────────┬───────────────┘
               │ (read)               │ (read)
    ┌──────────▼──────────┐  ┌────────▼────────────┐
    │  Smart Contract     │  │  Mirror Node API     │
    │  (via JsonRPC)      │  │  (HCS messages)      │
    │  No wallet needed   │  │  No wallet needed    │
    └─────────────────────┘  └──────────────────────┘

┌─────────────────────────────────────────────────────┐
│              Supply Chain Participant                 │
│            Dashboard → MetaMask → Write              │
└──────────┬──────────────┬──────────────┬─────────────┘
           │              │              │
    ┌──────▼──────┐ ┌─────▼─────┐ ┌─────▼──────┐
    │  SupplyChain│ │ HCS Topic │ │ HTS NFT/   │
    │  .sol (EVM) │ │ Messages  │ │ STR Token  │
    │  Checkpoints│ │ Audit Log │ │ Certificates│
    └─────────────┘ └───────────┘ └────────────┘
```

**Data Flow:**
- **Writes:** Dashboard UI → MetaMask → Smart Contract (ethers v5) + API Routes → HCS/HTS (@hashgraph/sdk)
- **Reads:** Track page → JsonRpcProvider → Smart Contract + Mirror Node REST API (no wallet needed)
- **Rewards:** Business action → SupplyChain.sol → POST /api/rewards → SourceTraceIncentives.sol

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Maps | Leaflet + react-leaflet |
| QR Codes | html5-qrcode (scanner), qrcode.react (generator) |
| Icons | Lucide React |
| Blockchain | ethers.js v5, @hashgraph/sdk |
| Smart Contracts | Solidity 0.8.19, Hardhat 2 |
| Network | Hedera Testnet (Chain ID 296) |
| RPC | HashIO JSON-RPC Relay |
| API | Mirror Node REST API |

---

## Project Structure

```
sourcetrace/
├── contracts/
│   ├── SupplyChain.sol          # Core supply chain contract
│   └── SourceTraceIncentives.sol # Incentive/rewards contract
├── scripts/
│   ├── deploy.ts                # Deploy SupplyChain
│   ├── deploy-incentives.ts     # Deploy Incentives
│   ├── seed.ts                  # Seed demo data
│   ├── setup-hedera.ts          # Create HCS topic + NFT token
│   └── setup-rewards-token.ts   # Create STR fungible token
├── src/
│   ├── app/
│   │   ├── api/                 # API routes (hcs, hts, rewards, leaderboard, topic)
│   │   ├── dashboard/           # Participant dashboard
│   │   ├── leaderboard/         # Role-based leaderboard
│   │   ├── rewards/             # Rewards, badges, streaks
│   │   ├── scan/                # QR code scanner
│   │   ├── track/[productId]/   # Product tracking (map, timeline, certificate)
│   │   ├── verify/[productId]/  # Product verification
│   │   ├── layout.tsx           # Root layout with Navbar
│   │   └── page.tsx             # Landing page
│   ├── components/              # 14 reusable components
│   ├── lib/                     # Contract interfaces, Hedera SDK, demo data
│   └── types/                   # TypeScript type definitions
├── test/                        # Contract tests
├── hardhat.config.ts
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MetaMask wallet
- Hedera Testnet account ([portal.hedera.com](https://portal.hedera.com))

### Installation

```bash
git clone https://github.com/sguru248/source_tree_hackathon.git
cd source_tree_hackathon
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# Server-side (Hedera SDK)
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=0x...
HEDERA_NETWORK=testnet
HEDERA_NFT_TOKEN_ID=0.0.xxxxx
HEDERA_REWARD_TOKEN_ID=0.0.xxxxx

# Client-side (public)
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=296
NEXT_PUBLIC_RPC_URL=https://testnet.hashio.io/api
NEXT_PUBLIC_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com/api/v1
NEXT_PUBLIC_HASHSCAN_URL=https://hashscan.io/testnet
NEXT_PUBLIC_NFT_TOKEN_ID=0.0.xxxxx
NEXT_PUBLIC_REWARD_TOKEN_ID=0.0.xxxxx
NEXT_PUBLIC_INCENTIVES_CONTRACT_ADDRESS=0x...
```

### Deploy Smart Contracts

```bash
# Compile contracts
npm run compile

# Deploy SupplyChain contract
npm run deploy

# Setup HCS topic and NFT token
npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/setup-hedera.ts

# Deploy Incentives contract
npm run deploy:incentives

# Setup STR reward token
npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/setup-rewards-token.ts

# Seed demo data (Ethiopian Sidama Coffee with 6 checkpoints)
npm run seed
```

### Run the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
# Smart contract tests
npm run test

# API integration tests
npm run test:api
```

---

## Deployed Resources (Hedera Testnet)

| Resource | ID |
|----------|-----|
| SupplyChain Contract | `0xd8726a4d6a5Aa58B9A3F104F62A8734CF03D3f4e` |
| Incentives Contract | `0xe48AAf622A14e1d113B3cA7889354e77D5685f91` |
| HCS Topic (demo) | `0.0.8112267` |
| NFT Token (STRACE) | `0.0.8112269` |
| STR Reward Token | `0.0.8203627` |
| Operator Account | `0.0.8107608` |

---

## Smart Contract Security

- **Pausable** — Owner can pause/unpause all write operations
- **Role-based state machine** — Status transitions enforced on-chain
  - Created → InTransit, Processing, Flagged
  - InTransit → InTransit, Processing, Delivered, Flagged
  - Processing → InTransit, Delivered, Flagged
  - Delivered → Verified, Flagged
  - Terminal states (Verified, Flagged) cannot be changed
- **Role-restricted actions** — Each role can only set specific statuses
- **On-chain validation** — GPS coordinates (±90°/±180°) and temperature (±100°C) validated in Solidity
- **NFT link protection** — Only project owner can link NFT to verified products
- **Certifier staking** — 500 STR stake with -100 STR slash on bad certifications

---

## Hackathon Track

**Sustainability** — SourceTrace addresses food fraud, supply chain transparency, and sustainable sourcing by creating verifiable, on-chain proof of a food product's journey from farm to fork.

---

## Future Roadmap

- [ ] IoT sensor integration for automated temperature/GPS logging
- [ ] Multi-chain support for cross-border supply chains
- [ ] AI-powered anomaly detection for checkpoint data
- [ ] Mobile app for field workers (React Native)
- [ ] DAO governance for protocol parameters
- [ ] Carbon footprint tracking per product journey
- [ ] Integration with existing ERP/SCM systems
- [ ] Mainnet deployment with production-grade infrastructure

---

## Team

| Name | Role |
|------|------|
| Sivaguru | Full-Stack Developer |

---

## License

MIT
