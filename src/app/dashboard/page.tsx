"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  LayoutDashboard, UserPlus, FolderPlus, LogIn, Users, Package, MapPin,
  ShieldCheck, Loader2, CheckCircle, AlertCircle, ArrowLeft, Eye,
  Clock, ChevronRight, Sprout, Factory, Truck, Store, ShieldCheck as Shield,
  Gamepad2, X, Copy, Check, LogOut, RefreshCw, Coins, Trophy, Flame
} from "lucide-react";
import {
  Role, RoleLabels, ProductStatus, StatusLabels, StatusColors,
  Product, Checkpoint, Participant, Project, ParticipantStats, RewardEvent,
} from "@/types";
import {
  registerParticipant, checkParticipant,
  createProject, requestJoinProject, approveJoinRequest, rejectJoinRequest,
  fetchProject, fetchProjectMembers, fetchPendingRequests, fetchProjectProductIds, fetchProjectCount,
  checkProjectMembership, checkPendingRequest,
  createProduct, addCheckpoint, verifyProduct, linkNFT,
  fetchProduct, fetchCheckpoints,
  validateCheckpointInputs, getAvailableStatuses,
} from "@/lib/contracts";
import { fetchParticipantStats, fetchRecentRewards } from "@/lib/incentives";
import {
  DEMO_PROJECT, DEMO_MEMBERS, DEMO_PENDING_REQUESTS,
  DEMO_PRODUCT, DEMO_CHECKPOINTS,
} from "@/lib/demo-data";
import StatsCards from "@/components/StatsCards";
import ActivityFeed from "@/components/ActivityFeed";
import StreakCounter from "@/components/StreakCounter";
import ReputationBadge from "@/components/ReputationBadge";
import Link from "next/link";

// ─── Types ───

type TxState = { status: "idle" | "pending" | "success" | "error"; hash?: string; errorMessage?: string; warning?: string };
type DashboardView =
  | { page: "projects" }
  | { page: "project-detail"; projectId: number }
  | { page: "add-checkpoint"; projectId: number; productId: number };

// ─── Helpers ───

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function roleIcon(role: Role) {
  const icons = { [Role.Farmer]: Sprout, [Role.Processor]: Factory, [Role.Distributor]: Truck, [Role.Retailer]: Store, [Role.Certifier]: Shield };
  return icons[role] || Package;
}

function timeAgo(ts: number) {
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function parseContractError(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as any;
    // ethers v5 revert reason
    if (e.reason) return e.reason;
    if (e.error?.reason) return e.error.reason;
    if (e.error?.message) return e.error.message;
    // Nested data revert
    if (e.data?.message) return e.data.message;
    if (e.message) {
      // Extract revert reason from error message
      const match = e.message.match(/reason="([^"]+)"/);
      if (match) return match[1];
      const execMatch = e.message.match(/execution reverted: (.+?)"/);
      if (execMatch) return execMatch[1];
      if (e.message.length < 200) return e.message;
    }
  }
  return "Transaction failed. Check console for details.";
}

// ─── Sub-components ───

function TxStatus({ state }: { state: TxState }) {
  if (state.status === "idle") return null;
  if (state.status === "pending") return (
    <div className="flex items-center gap-2 text-amber-400 text-sm mt-3">
      <Loader2 size={16} className="animate-spin" /> Transaction pending...
    </div>
  );
  if (state.status === "success") return (
    <div className="space-y-1 mt-3">
      <div className="flex items-center gap-2 text-emerald-400 text-sm">
        <CheckCircle size={16} /> Transaction confirmed!
        {state.hash && (
          <a href={`https://hashscan.io/testnet/transaction/${state.hash}`} target="_blank" rel="noopener noreferrer" className="underline ml-1">View</a>
        )}
      </div>
      {state.warning && (
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <AlertCircle size={16} /> {state.warning}
        </div>
      )}
    </div>
  );
  return (
    <div className="flex items-center gap-2 text-red-400 text-sm mt-3">
      <AlertCircle size={16} /> {state.errorMessage || "Transaction failed. Check console."}
    </div>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: StatusColors[status] + "20", color: StatusColors[status] }}>
      {StatusLabels[status]}
    </span>
  );
}

// ─── Main Dashboard ───

export default function DashboardPage() {
  // Auth state
  const [account, setAccount] = useState<string | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  // Demo mode
  const [demoMode, setDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<Role>(Role.Retailer);

  // Navigation
  const [view, setView] = useState<DashboardView>({ page: "projects" });
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  // Registration form
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState<Role>(Role.Farmer);
  const [regLocation, setRegLocation] = useState("");

  // Project data (for detail view)
  const [projectData, setProjectData] = useState<Project | null>(null);
  const [projectMembers, setProjectMembers] = useState<Participant[]>([]);
  const [pendingReqs, setPendingReqs] = useState<Participant[]>([]);
  const [projectProducts, setProjectProducts] = useState<Product[]>([]);
  const [productCheckpoints, setProductCheckpoints] = useState<Record<number, Checkpoint[]>>({});

  // My projects list
  const [myProjects, setMyProjects] = useState<{ project: Project; isMember: boolean; isPending: boolean }[]>([]);

  // Forms
  const [createProjName, setCreateProjName] = useState("");
  const [createProjDesc, setCreateProjDesc] = useState("");
  const [joinProjId, setJoinProjId] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showJoinProject, setShowJoinProject] = useState(false);

  // Create product form
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodOrigin, setProdOrigin] = useState("");
  const [prodBatch, setProdBatch] = useState("");

  // Checkpoint form
  const [cpLocation, setCpLocation] = useState("");
  const [cpLat, setCpLat] = useState("");
  const [cpLng, setCpLng] = useState("");
  const [cpStatus, setCpStatus] = useState<ProductStatus>(ProductStatus.Created);
  const [cpNotes, setCpNotes] = useState("");
  const [cpTemp, setCpTemp] = useState("");

  // Form validation
  const [formError, setFormError] = useState<string | null>(null);

  // Project detail tab
  const [projectTab, setProjectTab] = useState<"products" | "members" | "verify">("products");

  // Incentive system state
  const [incentiveStats, setIncentiveStats] = useState<ParticipantStats | null>(null);
  const [recentRewards, setRecentRewards] = useState<RewardEvent[]>([]);

  // Copied state for project ID
  const [copied, setCopied] = useState(false);

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors";
  const labelClass = "block text-sm text-gray-400 mb-1";
  const btnPrimary = "bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-5 rounded-lg font-medium transition-colors disabled:bg-gray-700 disabled:text-gray-500";
  const btnSecondary = "bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 px-5 rounded-lg font-medium transition-colors border border-gray-700";

  // Get current role (demo or real)
  const currentRole = demoMode ? demoRole : participant?.role;
  const isOwnerRole = currentRole === Role.Retailer || currentRole === Role.Certifier;

  // ─── Incentive Helpers ───

  async function recordReward(action: string, isQualityCheckpoint = false) {
    if (demoMode || !account || currentRole === undefined) return;
    try {
      await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant: account, action, role: currentRole, isQualityCheckpoint }),
      });
    } catch (err) {
      console.warn("Reward recording failed:", err);
    }
  }

  async function refreshIncentiveStats() {
    if (demoMode || !account) return;
    try {
      const [s, r] = await Promise.all([
        fetchParticipantStats(account),
        fetchRecentRewards(account, 10),
      ]);
      if (s) setIncentiveStats(s);
      setRecentRewards(r);
    } catch {}
  }

  // Load incentive stats when participant is loaded
  useEffect(() => {
    if (participant && account) refreshIncentiveStats();
  }, [participant, account]);

  // ─── Reset all state (on disconnect / account switch) ───

  function resetState() {
    setAccount(null);
    setParticipant(null);
    setView({ page: "projects" });
    setTx({ status: "idle" });
    setMyProjects([]);
    setProjectData(null);
    setProjectMembers([]);
    setPendingReqs([]);
    setProjectProducts([]);
    setProductCheckpoints({});
    setShowCreateProject(false);
    setShowJoinProject(false);
    setShowCreateProduct(false);
  }

  // ─── Connect & Check Registration ───

  async function loadAccount(addr: string) {
    setAccount(addr);
    try {
      const p = await checkParticipant(addr);
      if (p.isRegistered) setParticipant({ ...p, address: addr });
      else setParticipant(null);
    } catch { setParticipant(null); }
  }

  async function connectWallet() {
    if (!window.ethereum) return;
    try {
      // Request permissions — this forces MetaMask to show the account picker
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts[0]) {
        await loadAccount(accounts[0]);
      }
    } catch {}
    setLoading(false);
  }

  // Auto-connect on page load if already permitted (no popup)
  async function autoConnect() {
    if (!window.ethereum) return;
    try {
      const accounts: string[] = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts[0]) {
        await loadAccount(accounts[0]);
      }
    } catch {}
    setLoading(false);
  }

  function disconnectWallet() {
    resetState();
  }

  // Listen for MetaMask account/chain changes
  useEffect(() => {
    if (demoMode || !window.ethereum) return;

    function handleAccountsChanged(accounts: string[]) {
      resetState();
      if (accounts.length > 0) {
        loadAccount(accounts[0]);
      }
    }

    function handleChainChanged() {
      resetState();
      autoConnect();
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) { setLoading(false); return; }
    autoConnect().then(() => setLoading(false));
  }, [demoMode]);

  // ─── Load My Projects ───

  const loadMyProjects = useCallback(async () => {
    if (demoMode) {
      setMyProjects([{ project: DEMO_PROJECT, isMember: true, isPending: false }]);
      return;
    }
    if (!account) return;
    try {
      const count = await fetchProjectCount();
      const projectPromises = Array.from({ length: count }, (_, i) => {
        const id = i + 1;
        return Promise.all([
          fetchProject(id),
          checkProjectMembership(id, account),
          checkPendingRequest(id, account),
        ]).then(([proj, isMember, isPending]) => {
          if (isMember || isPending || proj.owner.toLowerCase() === account.toLowerCase()) {
            return { project: proj, isMember, isPending };
          }
          return null;
        }).catch(() => null);
      });
      const results = (await Promise.all(projectPromises)).filter((r): r is NonNullable<typeof r> => r !== null);
      setMyProjects(results);
    } catch {}
  }, [account, demoMode]);

  useEffect(() => {
    if (participant || demoMode) loadMyProjects();
  }, [participant, demoMode, loadMyProjects]);

  // ─── Load Project Detail ───

  const loadProjectDetail = useCallback(async (projectId: number) => {
    if (demoMode) {
      setProjectData(DEMO_PROJECT);
      setProjectMembers(DEMO_MEMBERS);
      setPendingReqs(DEMO_PENDING_REQUESTS);
      setProjectProducts([DEMO_PRODUCT]);
      setProductCheckpoints({ 1: DEMO_CHECKPOINTS });
      return;
    }
    try {
      // Fetch project info and lists in parallel
      const [proj, memberAddrs, pendingAddrs, productIds] = await Promise.all([
        fetchProject(projectId),
        fetchProjectMembers(projectId),
        fetchPendingRequests(projectId),
        fetchProjectProductIds(projectId),
      ]);
      setProjectData(proj);

      // Fetch all member/pending/product details in parallel
      const [members, pending, productResults] = await Promise.all([
        Promise.all(memberAddrs.map((addr: string) =>
          checkParticipant(addr).then(p => ({ ...p, address: addr })).catch(() => null)
        )),
        Promise.all(pendingAddrs.map((addr: string) =>
          checkParticipant(addr).then(p => ({ ...p, address: addr })).catch(() => null)
        )),
        Promise.all(productIds.map((pid: number) =>
          Promise.all([fetchProduct(pid), fetchCheckpoints(pid)])
            .then(([product, checkpts]) => ({ product, checkpts }))
            .catch(() => null)
        )),
      ]);

      setProjectMembers(members.filter(Boolean) as Participant[]);
      setPendingReqs(pending.filter(Boolean) as Participant[]);

      const prods: Product[] = [];
      const cps: Record<number, Checkpoint[]> = {};
      for (const r of productResults) {
        if (r) {
          prods.push(r.product);
          cps[r.product.id] = r.checkpts;
        }
      }
      setProjectProducts(prods);
      setProductCheckpoints(cps);
    } catch (err) {
      console.error("Failed to load project:", err);
    }
  }, [demoMode]);

  // ─── Handlers ───

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setTx({ status: "pending" });
    try {
      const txn = await registerParticipant(regName, regRole, regLocation);
      await txn.wait();
      setTx({ status: "success", hash: txn.hash });
      setParticipant({ name: regName, role: regRole, location: regLocation, isRegistered: true });
      // Record reward for registration
      await recordReward("Register");
      refreshIncentiveStats();
    } catch (err) {
      console.error(err);
      setTx({ status: "error", errorMessage: parseContractError(err) });
    }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (demoMode) { setTx({ status: "success" }); setShowCreateProject(false); return; }
    setTx({ status: "pending" });
    try {
      const txn = await createProject(createProjName, createProjDesc);
      await txn.wait();
      setTx({ status: "success", hash: txn.hash });
      setShowCreateProject(false);
      setCreateProjName(""); setCreateProjDesc("");
      loadMyProjects();
    } catch (err) {
      console.error(err);
      setTx({ status: "error", errorMessage: parseContractError(err) });
    }
  }

  async function handleJoinProject(e: React.FormEvent) {
    e.preventDefault();
    if (demoMode) { setTx({ status: "success" }); setShowJoinProject(false); return; }
    setTx({ status: "pending" });
    try {
      const txn = await requestJoinProject(Number(joinProjId));
      await txn.wait();
      setTx({ status: "success", hash: txn.hash });
      setShowJoinProject(false);
      setJoinProjId("");
      loadMyProjects();
    } catch (err) {
      console.error(err);
      setTx({ status: "error", errorMessage: parseContractError(err) });
    }
  }

  async function handleApprove(addr: string) {
    if (demoMode) { setPendingReqs(prev => prev.filter(p => p.address !== addr)); return; }
    if (!projectData) return;
    setTx({ status: "pending" });
    try {
      const txn = await approveJoinRequest(projectData.id, addr);
      await txn.wait();
      setTx({ status: "success", hash: txn.hash });
      loadProjectDetail(projectData.id);
    } catch (err) {
      console.error(err);
      setTx({ status: "error", errorMessage: parseContractError(err) });
    }
  }

  async function handleReject(addr: string) {
    if (demoMode) { setPendingReqs(prev => prev.filter(p => p.address !== addr)); return; }
    if (!projectData) return;
    setTx({ status: "pending" });
    try {
      const txn = await rejectJoinRequest(projectData.id, addr);
      await txn.wait();
      setTx({ status: "success", hash: txn.hash });
      loadProjectDetail(projectData.id);
    } catch (err) {
      console.error(err);
      setTx({ status: "error", errorMessage: parseContractError(err) });
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!projectData) return;
    if (demoMode) { setTx({ status: "success" }); setShowCreateProduct(false); return; }
    setTx({ status: "pending" });
    try {
      // Auto-create HCS topic for this product
      const topicRes = await fetch("/api/topic", { method: "POST" });
      const topicData = await topicRes.json();
      if (!topicData.topicId) throw new Error("Failed to create HCS topic");

      const txn = await createProduct(projectData.id, prodName, prodOrigin, prodBatch, topicData.topicId);
      await txn.wait();
      setTx({ status: "success", hash: txn.hash });
      setShowCreateProduct(false);
      setProdName(""); setProdOrigin(""); setProdBatch("");
      loadProjectDetail(projectData.id);
      // Record reward for creating product
      await recordReward("CreateProduct");
      refreshIncentiveStats();
    } catch (err) {
      console.error(err);
      setTx({ status: "error", errorMessage: parseContractError(err) });
    }
  }

  async function handleAddCheckpoint(e: React.FormEvent) {
    e.preventDefault();
    if (view.page !== "add-checkpoint") return;
    if (demoMode) { setTx({ status: "success" }); return; }

    // Client-side validation
    setFormError(null);
    const validationError = validateCheckpointInputs(parseFloat(cpLat), parseFloat(cpLng), parseFloat(cpTemp));
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setTx({ status: "pending" });
    try {
      // 1. Write checkpoint to smart contract
      const txn = await addCheckpoint(
        view.productId, cpLocation,
        parseFloat(cpLat), parseFloat(cpLng),
        cpStatus, cpNotes, parseFloat(cpTemp)
      );
      await txn.wait();

      // 2. Submit checkpoint to HCS for immutable audit trail
      const product = projectProducts.find(p => p.id === view.productId);
      let hcsWarning: string | undefined;
      if (product?.hcsTopicId) {
        try {
          const hcsRes = await fetch("/api/hcs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topicId: product.hcsTopicId,
              message: {
                type: "checkpoint",
                productId: view.productId,
                handler: account,
                location: cpLocation,
                lat: parseFloat(cpLat),
                lng: parseFloat(cpLng),
                status: StatusLabels[cpStatus],
                temperature: parseFloat(cpTemp),
                notes: cpNotes,
                timestamp: new Date().toISOString(),
              },
            }),
          });
          // HCS sequence number is stored server-side; no second contract call needed
        } catch (hcsErr) {
          console.warn("HCS submission failed (checkpoint still saved on contract):", hcsErr);
          hcsWarning = "HCS submission failed (checkpoint still saved on contract)";
        }
      }

      setTx({ status: "success", hash: txn.hash, warning: hcsWarning });

      // Record reward for checkpoint (quality bonus if temp between 0-25°C for food safety)
      const temp = parseFloat(cpTemp);
      const isQuality = temp >= 0 && temp <= 25;
      await recordReward("AddCheckpoint", isQuality);
      refreshIncentiveStats();

      setCpLocation(""); setCpLat(""); setCpLng(""); setCpNotes(""); setCpTemp("");
      setCpStatus(ProductStatus.Created);
      loadProjectDetail(view.projectId);
    } catch (err) {
      console.error(err);
      setTx({ status: "error", errorMessage: parseContractError(err) });
    }
  }

  async function handleVerify(productId: number) {
    if (demoMode) { setTx({ status: "success" }); return; }
    setTx({ status: "pending" });
    try {
      // 1. Verify on smart contract
      const txn = await verifyProduct(productId);
      await txn.wait();

      // 2. Mint NFT certificate
      const product = projectProducts.find(p => p.id === productId);
      const nftTokenId = process.env.NEXT_PUBLIC_NFT_TOKEN_ID || "";
      if (nftTokenId && product) {
        try {
          const mintRes = await fetch("/api/hts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "mint",
              tokenId: nftTokenId,
              metadata: {
                productId,
                name: product.name,
                origin: product.origin,
                batchId: product.batchId,
                verifiedAt: new Date().toISOString(),
                verifier: account,
              },
            }),
          });
          const mintData = await mintRes.json();

          // 3. Verify NFT exists via mirror node, then link
          if (mintData.serialNumber) {
            try {
              // Brief delay for mirror node propagation
              await new Promise(resolve => setTimeout(resolve, 3000));
              const mirrorUrl = process.env.NEXT_PUBLIC_MIRROR_NODE_URL || "https://testnet.mirrornode.hedera.com";
              const nftCheckRes = await fetch(`${mirrorUrl}/api/v1/tokens/${nftTokenId}/nfts/${mintData.serialNumber}`);
              if (nftCheckRes.ok) {
                const linkTxn = await linkNFT(productId, nftTokenId, mintData.serialNumber);
                await linkTxn.wait();
              } else {
                console.warn("NFT not found on mirror node, skipping link");
              }
            } catch (linkErr) {
              console.warn("NFT link failed:", linkErr);
            }
          }
        } catch (nftErr) {
          console.warn("NFT mint failed (product still verified on contract):", nftErr);
        }
      }

      // 4. Submit verification event to HCS
      if (product?.hcsTopicId) {
        try {
          await fetch("/api/hcs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topicId: product.hcsTopicId,
              message: {
                type: "verification",
                productId,
                verifier: account,
                status: "verified",
                timestamp: new Date().toISOString(),
              },
            }),
          });
        } catch (hcsErr) {
          console.warn("HCS verification message failed:", hcsErr);
        }
      }

      setTx({ status: "success", hash: txn.hash });
      // Record reward for verification
      await recordReward("VerifyProduct");
      refreshIncentiveStats();
      if (projectData) loadProjectDetail(projectData.id);
    } catch (err) {
      console.error(err);
      setTx({ status: "error", errorMessage: parseContractError(err) });
    }
  }

  function copyProjectId(id: number) {
    navigator.clipboard.writeText(String(id));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─── Render: Loading ───

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={32} />
      </div>
    );
  }

  // ─── Render: Connect Wallet (when not in demo mode) ───

  if (!demoMode && !account) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <LayoutDashboard className="text-gray-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Supply Chain Dashboard</h2>
          <p className="text-gray-400 mb-4">Connect your MetaMask wallet to manage your supply chain, or try demo mode.</p>
          <p className="text-gray-500 text-sm mb-6">MetaMask will ask you to choose which account to connect.</p>
          <div className="flex flex-col gap-3">
            <button onClick={connectWallet} className={btnPrimary}>
              Connect MetaMask
            </button>
            <button onClick={() => setDemoMode(true)} className={btnSecondary + " flex items-center justify-center gap-2"}>
              <Gamepad2 size={16} /> Try Demo Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Registration (not registered yet, not demo) ───

  if (!demoMode && !participant) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="text-emerald-400" size={24} />
            <h2 className="text-xl font-bold text-white">Register as Participant</h2>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6 text-sm text-gray-300 space-y-2">
            <p className="font-medium text-white">Choose your role carefully:</p>
            <div className="flex items-start gap-2">
              <Sprout size={14} className="text-emerald-400 mt-0.5 shrink-0" />
              <span><strong>Farmer / Processor / Distributor</strong> — Join existing projects, create products, add checkpoints along the supply chain.</span>
            </div>
            <div className="flex items-start gap-2">
              <Store size={14} className="text-blue-400 mt-0.5 shrink-0" />
              <span><strong>Retailer / Certifier</strong> — Create projects, invite supply chain partners, verify products, approve members.</span>
            </div>
            <p className="text-amber-400 text-xs mt-2">Your role cannot be changed after registration.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className={labelClass}>Name</label>
              <input className={inputClass} value={regName} onChange={e => setRegName(e.target.value)} placeholder="e.g., Sidama Farmers Cooperative" required />
            </div>
            <div>
              <label className={labelClass}>Role</label>
              <select className={inputClass} value={regRole} onChange={e => setRegRole(Number(e.target.value))}>
                {Object.entries(RoleLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input className={inputClass} value={regLocation} onChange={e => setRegLocation(e.target.value)} placeholder="e.g., Sidama, Ethiopia" required />
            </div>
            <button type="submit" className={btnPrimary + " w-full"}>Register</button>
            <TxStatus state={tx} />
          </form>
        </div>

        <div className="text-center mt-4">
          <button onClick={() => setDemoMode(true)} className="text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 mx-auto">
            <Gamepad2 size={14} /> Try Demo Mode instead
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Welcome Card ───

  const currentParticipant = demoMode
    ? DEMO_MEMBERS.find(m => m.role === demoRole) || DEMO_MEMBERS[0]
    : participant!;

  // ─── Render: Add Checkpoint View ───

  if (view.page === "add-checkpoint") {
    const product = projectProducts.find(p => p.id === view.productId);
    const cps = productCheckpoints[view.productId] || [];
    const lastCp = cps[cps.length - 1];

    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <button onClick={() => { setView({ page: "project-detail", projectId: view.projectId }); setTx({ status: "idle" }); }}
          className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft size={14} /> Back to Project
        </button>

        {/* Product context */}
        {product && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">{product.name}</h2>
              <StatusBadge status={product.status} />
            </div>
            <p className="text-sm text-gray-400 mb-4">Batch: {product.batchId} | Origin: {product.origin}</p>

            {/* Mini timeline of existing checkpoints */}
            {cps.length > 0 && (
              <div className="border-t border-gray-800 pt-3">
                <p className="text-xs text-gray-500 mb-2">Journey so far ({cps.length} checkpoints):</p>
                <div className="flex flex-wrap gap-2">
                  {cps.map((cp, i) => (
                    <div key={cp.id} className="flex items-center gap-1 text-xs text-gray-400">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: StatusColors[cp.status] + "30", color: StatusColors[cp.status] }}>
                        {i + 1}
                      </span>
                      <span>{cp.locationName}</span>
                      {i < cps.length - 1 && <ChevronRight size={10} className="text-gray-600" />}
                    </div>
                  ))}
                </div>
                {lastCp && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last: {lastCp.locationName} ({StatusLabels[lastCp.status]}) — {lastCp.temperature}°C — {timeAgo(lastCp.timestamp)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Checkpoint form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-emerald-400" /> Add Next Checkpoint
          </h3>
          <form onSubmit={handleAddCheckpoint} className="space-y-4">
            <div>
              <label className={labelClass}>Location Name</label>
              <input className={inputClass} value={cpLocation} onChange={e => setCpLocation(e.target.value)} placeholder="e.g., Hawassa Washing Station" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Latitude</label>
                <input className={inputClass} type="number" step="any" value={cpLat} onChange={e => setCpLat(e.target.value)} placeholder="7.06" required />
              </div>
              <div>
                <label className={labelClass}>Longitude</label>
                <input className={inputClass} type="number" step="any" value={cpLng} onChange={e => setCpLng(e.target.value)} placeholder="38.48" required />
              </div>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              {(() => {
                const availableStatuses = currentRole !== undefined && product
                  ? getAvailableStatuses(product.status, currentRole)
                  : Object.keys(StatusLabels).map(Number) as ProductStatus[];
                return (
                  <select className={inputClass} value={cpStatus} onChange={e => setCpStatus(Number(e.target.value))}>
                    {availableStatuses.length > 0 ? availableStatuses.map(s => (
                      <option key={s} value={s}>{StatusLabels[s]}</option>
                    )) : (
                      <option disabled>No valid transitions available</option>
                    )}
                  </select>
                );
              })()}
            </div>
            {formError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                <AlertCircle size={14} /> {formError}
              </div>
            )}
            <div>
              <label className={labelClass}>Temperature (°C)</label>
              <input className={inputClass} type="number" step="0.1" value={cpTemp} onChange={e => setCpTemp(e.target.value)} placeholder="22.5" required />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <textarea className={inputClass} rows={3} value={cpNotes} onChange={e => setCpNotes(e.target.value)} placeholder="e.g., Organic Arabica, hand-picked at 1900m" required />
            </div>
            <div className="flex gap-3">
              <button type="submit" className={btnPrimary + " flex-1"}>Add Checkpoint</button>
              <button type="button" onClick={() => setView({ page: "project-detail", projectId: view.projectId })} className={btnSecondary}>Cancel</button>
            </div>
            <TxStatus state={tx} />
          </form>
        </div>
      </div>
    );
  }

  // ─── Render: Project Detail View ───

  if (view.page === "project-detail") {
    // Load on mount
    if (!projectData || projectData.id !== view.projectId) {
      loadProjectDetail(view.projectId);
    }

    const isOwner = demoMode
      ? demoRole === Role.Retailer || demoRole === Role.Certifier
      : projectData?.owner.toLowerCase() === account?.toLowerCase();

    const tabs = isOwner
      ? [
          { id: "products" as const, label: "Products", icon: Package },
          { id: "members" as const, label: "Members", icon: Users },
          { id: "verify" as const, label: "Verify", icon: ShieldCheck },
        ]
      : [
          { id: "products" as const, label: "Products", icon: Package },
          { id: "members" as const, label: "Members", icon: Users },
        ];

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Demo banner */}
        {demoMode && <DemoBanner demoRole={demoRole} setDemoRole={setDemoRole} setDemoMode={setDemoMode} />}

        {/* Header */}
        <button onClick={() => { setView({ page: "projects" }); setProjectData(null); setTx({ status: "idle" }); }}
          className="flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft size={14} /> Back to Projects
        </button>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{projectData?.name || "Loading..."}</h1>
            <p className="text-gray-400 text-sm mt-1">{projectData?.description}</p>
          </div>
          {projectData && (
            <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-400">Project ID:</span>
              <span className="text-sm font-mono text-white">{projectData.id}</span>
              <button onClick={() => copyProjectId(projectData.id)} className="text-gray-400 hover:text-white">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setProjectTab(id); setTx({ status: "idle" }); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                projectTab === id ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}>
              <Icon size={14} /> {label}
              {id === "members" && pendingReqs.length > 0 && isOwner && (
                <span className="bg-amber-500 text-black text-[10px] font-bold px-1.5 rounded-full">{pendingReqs.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* Products Tab */}
          {projectTab === "products" && (
            <>
              {projectProducts.length === 0 && !showCreateProduct && (
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
                  <Package className="text-gray-600 mx-auto mb-3" size={40} />
                  <p className="text-gray-400 mb-4">No products yet. Create your first product to start tracking.</p>
                </div>
              )}

              {projectProducts.map(product => {
                const cps = productCheckpoints[product.id] || [];
                const lastCp = cps[cps.length - 1];
                return (
                  <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{product.name}</h3>
                          <StatusBadge status={product.status} />
                        </div>
                        <p className="text-sm text-gray-400 mt-1">Batch: {product.batchId} | Origin: {product.origin}</p>
                      </div>
                      <span className="text-xs text-gray-500">#{product.id}</span>
                    </div>

                    {/* Mini journey */}
                    {cps.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap items-center gap-1 text-xs text-gray-400">
                          {cps.map((cp, i) => (
                            <span key={cp.id} className="flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: StatusColors[cp.status] + "30", color: StatusColors[cp.status] }}>
                                {i + 1}
                              </span>
                              {cp.locationName}
                              {i < cps.length - 1 && <ChevronRight size={10} className="text-gray-600" />}
                            </span>
                          ))}
                        </div>
                        {lastCp && (
                          <p className="text-xs text-gray-500 mt-1">{lastCp.temperature}°C — {timeAgo(lastCp.timestamp)}</p>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <a href={`/track/${product.id}`} target="_blank" className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                        <Eye size={12} /> View Journey
                      </a>
                      <button onClick={() => {
                        setView({ page: "add-checkpoint", projectId: view.projectId, productId: product.id });
                        setTx({ status: "idle" });
                        setFormError(null);
                        const avail = currentRole !== undefined ? getAvailableStatuses(product.status, currentRole) : [];
                        if (avail.length > 0) setCpStatus(avail[0]);
                      }}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                        <MapPin size={12} /> Add Checkpoint
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Create product */}
              {showCreateProduct ? (
                <div className="bg-gray-900 border border-emerald-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Package size={18} className="text-emerald-400" /> Create New Product
                  </h3>
                  <form onSubmit={handleCreateProduct} className="space-y-4">
                    <div>
                      <label className={labelClass}>Product Name</label>
                      <input className={inputClass} value={prodName} onChange={e => setProdName(e.target.value)} placeholder="e.g., Ethiopian Sidama Coffee" required />
                    </div>
                    <div>
                      <label className={labelClass}>Origin</label>
                      <input className={inputClass} value={prodOrigin} onChange={e => setProdOrigin(e.target.value)} placeholder="e.g., Sidama, Ethiopia" required />
                    </div>
                    <div>
                      <label className={labelClass}>Batch ID</label>
                      <input className={inputClass} value={prodBatch} onChange={e => setProdBatch(e.target.value)} placeholder="e.g., ETH-SID-2026-0312" required />
                    </div>
                    <p className="text-xs text-gray-500 bg-gray-800/50 rounded-lg p-3">An HCS topic will be created automatically for blockchain audit trail.</p>
                    <div className="flex gap-3">
                      <button type="submit" className={btnPrimary + " flex-1"}>Create Product</button>
                      <button type="button" onClick={() => setShowCreateProduct(false)} className={btnSecondary}>Cancel</button>
                    </div>
                    <TxStatus state={tx} />
                  </form>
                </div>
              ) : (
                <button onClick={() => { setShowCreateProduct(true); setTx({ status: "idle" }); }}
                  className="w-full bg-gray-900 border border-dashed border-gray-700 hover:border-emerald-500/50 rounded-xl p-4 text-gray-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-2">
                  <Package size={16} /> Create New Product
                </button>
              )}
            </>
          )}

          {/* Members Tab */}
          {projectTab === "members" && (
            <>
              {/* Pending requests (owner only) */}
              {isOwner && pendingReqs.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
                  <h3 className="text-amber-400 font-medium mb-3 flex items-center gap-2">
                    <Clock size={16} /> Pending Requests ({pendingReqs.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingReqs.map(req => {
                      const RIcon = roleIcon(req.role);
                      return (
                        <div key={req.address} className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                          <div className="flex items-center gap-3">
                            <RIcon size={16} className="text-gray-400" />
                            <div>
                              <p className="text-white text-sm font-medium">{req.name}</p>
                              <p className="text-xs text-gray-400">{RoleLabels[req.role]} — {req.location}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(req.address!)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-md">Approve</button>
                            <button onClick={() => handleReject(req.address!)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs px-3 py-1.5 rounded-md">Reject</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <TxStatus state={tx} />
                </div>
              )}

              {/* Approved members */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-white font-medium mb-3">Members ({projectMembers.length})</h3>
                <div className="space-y-2">
                  {projectMembers.map(member => {
                    const RIcon = roleIcon(member.role);
                    const isProjectOwner = projectData?.owner.toLowerCase() === member.address?.toLowerCase();
                    return (
                      <div key={member.address} className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3">
                        <RIcon size={16} className="text-gray-400" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm">{member.name}</p>
                            {isProjectOwner && <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Owner</span>}
                          </div>
                          <p className="text-xs text-gray-400">{RoleLabels[member.role]} — {member.location}</p>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{member.address ? shortAddr(member.address) : ""}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Verify Tab (owner only) */}
          {projectTab === "verify" && isOwner && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-400" /> Verify Products
              </h3>
              <p className="text-sm text-gray-400 mb-4">Verify products that have completed their supply chain journey.</p>
              <div className="space-y-3">
                {projectProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                    <div>
                      <p className="text-white text-sm">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.checkpointCount} checkpoints — <StatusBadge status={product.status} /></p>
                    </div>
                    {product.status !== ProductStatus.Verified ? (
                      <button onClick={() => handleVerify(product.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-md">Verify</button>
                    ) : (
                      <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle size={12} /> Verified</span>
                    )}
                  </div>
                ))}
                {projectProducts.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No products to verify yet.</p>
                )}
              </div>
              <TxStatus state={tx} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: Projects List (Main View) ───

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Demo banner */}
      {demoMode && <DemoBanner demoRole={demoRole} setDemoRole={setDemoRole} setDemoMode={setDemoMode} />}

      {/* Welcome card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {(() => { const RIcon = roleIcon(currentParticipant.role); return <RIcon size={20} className="text-emerald-400" />; })()}
            <div>
              <h2 className="text-lg font-semibold text-white">{currentParticipant.name}</h2>
              <p className="text-sm text-gray-400">{RoleLabels[currentParticipant.role]} — {currentParticipant.location}</p>
            </div>
          </div>
          {!demoMode && account && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono bg-gray-800 px-2 py-1 rounded">{shortAddr(account)}</span>
              <button onClick={disconnectWallet} className="text-gray-500 hover:text-red-400 transition-colors" title="Disconnect wallet">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
        {!demoMode && (
          <p className="text-xs text-gray-600 mt-2">To switch accounts, change the active account in MetaMask — the dashboard will update automatically.</p>
        )}
      </div>

      {/* Incentive Stats Section */}
      {(participant || demoMode) && !demoMode && (
        <div className="space-y-4 mb-6">
          {/* Quick stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Coins size={14} className="text-emerald-400" />
                <span className="text-[10px] text-gray-500 uppercase">STR Earned</span>
              </div>
              <span className="text-lg font-bold text-emerald-400">{incentiveStats?.totalSTR.toLocaleString() || "0"}</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Flame size={14} className={incentiveStats && incentiveStats.streakDays >= 3 ? "text-orange-400" : "text-gray-600"} />
                <span className="text-[10px] text-gray-500 uppercase">Streak</span>
              </div>
              <span className={`text-lg font-bold ${incentiveStats && incentiveStats.streakDays >= 3 ? "text-orange-400" : "text-gray-400"}`}>
                {incentiveStats?.streakDays || 0}d
              </span>
              {incentiveStats && incentiveStats.streakMultiplier > 1 && (
                <span className="text-[10px] text-orange-400 ml-1">{incentiveStats.streakMultiplier}x</span>
              )}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-purple-400" />
                <span className="text-[10px] text-gray-500 uppercase">Checkpoints</span>
              </div>
              <span className="text-lg font-bold text-purple-400">{incentiveStats?.checkpointCount || 0}</span>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center justify-center">
              <ReputationBadge score={incentiveStats?.reputationScore || 0} size="sm" />
            </div>
          </div>

          {/* Activity feed (collapsed) */}
          {recentRewards.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">Recent Rewards</h3>
                <Link href="/rewards" className="text-xs text-emerald-400 hover:text-emerald-300">View all</Link>
              </div>
              <ActivityFeed events={recentRewards.slice(0, 5)} />
            </div>
          )}
        </div>
      )}

      {/* Projects header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">My Projects</h2>
        <div className="flex gap-2">
          {isOwnerRole ? (
            <button onClick={() => { setShowCreateProject(true); setShowJoinProject(false); setTx({ status: "idle" }); }}
              className={btnPrimary + " flex items-center gap-1.5 text-sm"}>
              <FolderPlus size={14} /> Create Project
            </button>
          ) : (
            <button onClick={() => { setShowJoinProject(true); setShowCreateProject(false); setTx({ status: "idle" }); }}
              className={btnPrimary + " flex items-center gap-1.5 text-sm"}>
              <LogIn size={14} /> Join Project
            </button>
          )}
        </div>
      </div>

      {/* Create project form */}
      {showCreateProject && (
        <div className="bg-gray-900 border border-emerald-500/30 rounded-xl p-6 mb-4">
          <h3 className="text-lg font-semibold text-white mb-4">Create New Project</h3>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className={labelClass}>Project Name</label>
              <input className={inputClass} value={createProjName} onChange={e => setCreateProjName(e.target.value)} placeholder="e.g., Siva's Coffee Supply Chain" required />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea className={inputClass} rows={2} value={createProjDesc} onChange={e => setCreateProjDesc(e.target.value)} placeholder="e.g., Direct trade Ethiopian coffee from Sidama farms to Portland roasters" required />
            </div>
            <div className="flex gap-3">
              <button type="submit" className={btnPrimary + " flex-1"}>Create Project</button>
              <button type="button" onClick={() => setShowCreateProject(false)} className={btnSecondary}>Cancel</button>
            </div>
            <TxStatus state={tx} />
          </form>
        </div>
      )}

      {/* Join project form */}
      {showJoinProject && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-6 mb-4">
          <h3 className="text-lg font-semibold text-white mb-4">Join a Project</h3>
          <p className="text-sm text-gray-400 mb-4">Ask the project owner (Retailer/Certifier) for their Project ID.</p>
          <form onSubmit={handleJoinProject} className="space-y-4">
            <div>
              <label className={labelClass}>Project ID</label>
              <input className={inputClass} type="number" value={joinProjId} onChange={e => setJoinProjId(e.target.value)} placeholder="e.g., 1" required />
            </div>
            <div className="flex gap-3">
              <button type="submit" className={btnPrimary + " flex-1"}>Request to Join</button>
              <button type="button" onClick={() => setShowJoinProject(false)} className={btnSecondary}>Cancel</button>
            </div>
            <TxStatus state={tx} />
          </form>
        </div>
      )}

      {/* Project list */}
      <div className="space-y-3">
        {myProjects.map(({ project, isMember, isPending }) => (
          <div key={project.id}
            className={`bg-gray-900 border rounded-xl p-5 transition-colors ${
              isPending ? "border-amber-500/20" : "border-gray-800 hover:border-gray-700 cursor-pointer"
            }`}
            onClick={() => {
              if (isMember) {
                setView({ page: "project-detail", projectId: project.id });
                setProjectTab("products");
                setTx({ status: "idle" });
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-semibold">{project.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{project.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Users size={12} /> {project.memberCount} members</span>
                  <span className="flex items-center gap-1"><Package size={12} /> {project.productCount} products</span>
                </div>
              </div>
              {isPending ? (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-md flex items-center gap-1">
                  <Clock size={12} /> Pending approval
                </span>
              ) : (
                <ChevronRight size={18} className="text-gray-600" />
              )}
            </div>
          </div>
        ))}

        {myProjects.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <LayoutDashboard className="text-gray-600 mx-auto mb-3" size={40} />
            <p className="text-gray-400 mb-2">No projects yet.</p>
            <p className="text-sm text-gray-500">
              {isOwnerRole
                ? "Create a project to start managing your supply chain."
                : "Ask a Retailer or Certifier for their Project ID to join."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Demo Mode Banner ───

function DemoBanner({ demoRole, setDemoRole, setDemoMode }: {
  demoRole: Role;
  setDemoRole: (r: Role) => void;
  setDemoMode: (v: boolean) => void;
}) {
  const roles = [
    { role: Role.Retailer, name: "Siva Trader", icon: Store },
    { role: Role.Farmer, name: "Abebe", icon: Sprout },
    { role: Role.Processor, name: "Hawassa Co.", icon: Factory },
    { role: Role.Distributor, name: "EthioExport", icon: Truck },
  ];

  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Gamepad2 size={16} className="text-purple-400" />
          <span className="text-purple-300 font-medium text-sm">Demo Mode</span>
          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">No wallet needed</span>
        </div>
        <button onClick={() => setDemoMode(false)} className="text-gray-400 hover:text-white">
          <X size={16} />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {roles.map(({ role, name, icon: Icon }) => (
          <button key={role} onClick={() => setDemoRole(role)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              demoRole === role
                ? "bg-purple-600 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
            }`}>
            <Icon size={12} /> {name} ({RoleLabels[role]})
          </button>
        ))}
      </div>
    </div>
  );
}
