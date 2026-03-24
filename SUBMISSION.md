# SourceTrace — Hackathon Submission Guide

## Track Selection
**Sustainability**

---

## Project Description (98 words)

SourceTrace is a farm-to-fork food verification platform built on Hedera Hashgraph. It tracks food products from origin to shelf using Smart Contracts for supply chain checkpoints, HCS for tamper-proof audit trails, and HTS for NFT verification certificates. Supply chain participants — farmers, processors, distributors, retailers, and certifiers — log GPS-tagged, temperature-monitored checkpoints on-chain. Consumers simply scan a QR code to view an interactive map of their food's complete journey with blockchain-verified proof. A gamified incentive layer with STR token rewards, reputation scores, streaks, and badges drives consistent participation and data quality across the supply chain.

---

## Tech Stack

Next.js 16, React 19, Tailwind CSS 4, Solidity 0.8.19, Hardhat 2, ethers.js v5, @hashgraph/sdk, Hedera Smart Contracts (EVM), Hedera Consensus Service (HCS), Hedera Token Service (HTS), Leaflet, react-leaflet, html5-qrcode, qrcode.react, Lucide React, TypeScript

---

## Links

- **GitHub:** https://github.com/sguru248/source_tree_hackathon
- **Live Demo:** [YOUR NETLIFY URL HERE]
- **Demo Video:** [YOUR YOUTUBE URL HERE]
- **Pitch Deck:** [UPLOAD PDF TO SUBMISSION FORM]

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
| Chain ID | 296 (Hedera Testnet) |

---

## Pitch Deck — Slide-by-Slide Content

### Slide 1: Title
**SourceTrace: Scan Your Food, Know Its Story**
Farm-to-fork food verification on Hedera Hashgraph
- Team: Sivaguru
- Track: Sustainability
- Hedera Hello Future Apex Hackathon 2026

---

### Slide 2: The Problem
**$40 Billion — Annual Global Food Fraud**

- Consumers have zero visibility into where their food actually comes from
- Existing traceability systems are centralized, opaque, and easily manipulated
- No incentive for supply chain participants to maintain data quality
- Food safety incidents damage trust and endanger lives
- Paper-based tracking is slow, error-prone, and easily forged

---

### Slide 3: Our Solution
**SourceTrace — Blockchain-Verified Food Transparency**

Three pillars:
1. **On-Chain Tracking** — Every checkpoint recorded with GPS + temperature on Hedera EVM
2. **Immutable Audit Trail** — HCS provides tamper-proof, consensus-timestamped logs
3. **NFT Certification** — Verified products receive an HTS NFT as proof of authenticity

For consumers: Scan a QR code, see the full journey on an interactive map.
For businesses: Earn rewards, build reputation, find trusted partners.

---

### Slide 4: Hedera Integration (Addresses "Integration" criteria — 15%)
**All Three Core Hedera Services Used**

| Service | Usage | Why Hedera |
|---------|-------|------------|
| **Smart Contracts (EVM)** | SupplyChain.sol — participants, projects, products, checkpoints with role-based state machine | Low gas, fast finality, EVM compatible |
| **HCS (Consensus Service)** | Per-product audit topics, JSON checkpoint messages with consensus timestamps | Immutable ordering, tamper-proof logs |
| **HTS (Token Service)** | STRACE NFT certificates per verified product + STR fungible reward tokens | Native tokens, no custom ERC-20 needed |

Deployed contracts:
- SupplyChain: `0xd8726a4d6a5Aa58B9A3F104F62A8734CF03D3f4e`
- Incentives: `0xe48AAf622A14e1d113B3cA7889354e77D5685f91`

---

### Slide 5: How It Works
**Data Flow Architecture**

```
Consumer Flow:
  Scan QR Code -> /track/{id} -> Interactive Map + Timeline + NFT Certificate
  (No wallet needed — reads via JsonRPC + Mirror Node)

Participant Flow:
  Connect MetaMask -> Register (Farmer/Processor/Distributor/Retailer/Certifier)
  -> Create Project -> Add Products -> Log Checkpoints (GPS + Temp)
  -> Verify Product -> Mint NFT Certificate

Reward Flow:
  Business Action -> SupplyChain.sol -> POST /api/rewards -> SourceTraceIncentives.sol
  -> STR Tokens + Reputation + Streaks + Badges
```

---

### Slide 6: Demo & Features
**(Embed YouTube video link here)**

**Key Features Demonstrated:**
- Landing page with live Ethiopian Sidama Coffee journey preview
- Dashboard with wallet connection, project & product management
- Checkpoint logging with GPS coordinates and temperature
- Product verification and NFT minting
- Consumer tracking page with interactive Leaflet map
- QR code scanning for instant product lookup
- Leaderboard filtered by supply chain role
- Rewards page with reputation, streaks, and 9 achievement badges

---

### Slide 7: Innovation (Addresses "Innovation" criteria — 10%)
**What Makes SourceTrace Unique**

- **Triple-service integration** — Only project using Smart Contracts + HCS + HTS together for supply chain
- **Gamified B2B retention** — STR tokens, reputation decay, streak multipliers, 9 badges, certifier staking with slashing
- **Zero-friction consumer UX** — No wallet needed to verify; just scan and see
- **On-chain GPS + temperature validation** — Coordinates (int256 * 1e6) and temperature (int256 * 100) validated in Solidity, not just frontend
- **Role-based state machine** — Enforced status transitions prevent invalid supply chain flows

---

### Slide 8: Feasibility & Business Model (Addresses "Feasibility" criteria — 10%)
**Why This Works on Hedera**

- **$0.0001/tx** — Affordable for high-frequency checkpoint logging
- **10,000+ TPS** — Handles global supply chain volume
- **Carbon-negative** — Aligns with sustainability mission
- **3-5 second finality** — Real-time checkpoint confirmation
- **EVM compatible** — Familiar tooling (Solidity, Hardhat, ethers.js)

**Business Model:**
- SaaS subscription for supply chain companies
- Per-product verification fees
- Premium analytics and reporting
- API access for ERP/SCM integration

---

### Slide 9: Execution & MVP (Addresses "Execution" criteria — 20%)
**Fully Functional MVP Delivered**

| Component | Status |
|-----------|--------|
| 2 Smart Contracts deployed on Hedera Testnet | Done |
| 7 pages (Landing, Dashboard, Track, Scan, Leaderboard, Rewards, Verify) | Done |
| 5 API routes (HCS, HTS, Rewards, Leaderboard, Topic) | Done |
| 14 React components | Done |
| Role-based access (5 roles) | Done |
| Interactive map with animated routes | Done |
| QR code scan + generate | Done |
| NFT certificate display | Done |
| Gamified incentive system | Done |
| Demo data fallback (Ethiopian coffee) | Done |
| Smart contract tests | Done |
| Live deployment on Netlify | Done |

---

### Slide 10: Success & Impact (Addresses "Success" criteria — 20%)
**Positive Ecosystem Impact**

- **New Hedera accounts** — Every supply chain participant registers on-chain (5 roles)
- **High transaction volume** — Each product generates multiple checkpoints + HCS messages + reward recordings
- **Monthly active users** — Gamification (streaks, leaderboard) drives daily engagement
- **Consumer reach** — QR scanning requires no wallet, lowering barrier to millions of end consumers
- **TPS contribution** — Active supply chains can generate hundreds of daily transactions

**Example:** A single coffee product journey = 1 product creation + 6 checkpoints + 6 HCS messages + 1 verification + 1 NFT mint + 7 reward recordings = **22+ transactions**

---

### Slide 11: Validation (Addresses "Validation" criteria — 15%)
**Market Feedback & Traction**

- **Problem validated** — $40B annual food fraud is a well-documented global issue (FDA, WHO, Interpol reports)
- **Target users identified** — Specialty food producers, organic certifiers, premium retailers
- **Demo product tested** — Ethiopian Sidama Coffee journey with 6 real-world checkpoints across 4 countries
- **Technical validation** — All contracts deployed and functional on Hedera Testnet
- **Early feedback sources** — Hackathon mentors, Hedera developer community
- **Growth strategy** — Start with specialty coffee/chocolate supply chains, expand to general food

---

### Slide 12: Smart Contract Security
**Production-Grade Security Measures**

- **Pausable** — Owner can emergency-pause all writes
- **Role-based state machine** — Terminal states (Verified/Flagged) are immutable
- **On-chain validation** — GPS: lat +/-90 degrees, lng +/-180 degrees; Temp: +/-100 C
- **Access control** — 1 wallet = 1 registration, role-restricted status changes
- **Certifier accountability** — 500 STR stake, -100 STR slash on bad certifications
- **Reputation decay** — 1 point/week for inactive participants (prevents gaming)

---

### Slide 13: Future Roadmap
**What's Next for SourceTrace**

**Short-term (3-6 months):**
- IoT sensor integration for automated temperature/GPS logging
- Mobile app for field workers (React Native)
- Mainnet deployment

**Medium-term (6-12 months):**
- AI-powered anomaly detection for checkpoint data
- Multi-chain support for cross-border supply chains
- Integration with existing ERP/SCM systems (SAP, Oracle)

**Long-term (12+ months):**
- Carbon footprint tracking per product journey
- DAO governance for protocol parameters
- Global food safety data marketplace

---

### Slide 14: Thank You
**SourceTrace — Scan Your Food, Know Its Story**

- GitHub: https://github.com/sguru248/source_tree_hackathon
- Live Demo: [YOUR NETLIFY URL]
- Demo Video: [YOUR YOUTUBE URL]
- Built on Hedera Hashgraph (Smart Contracts + HCS + HTS)
- Track: Sustainability

Thank you for reviewing our submission!
