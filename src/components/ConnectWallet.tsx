"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Wallet, LogOut } from "lucide-react";
import { getEthereumProvider } from "@/lib/ethereum";

export default function ConnectWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    checkConnection();
    const ethereum = getEthereumProvider();
    if (ethereum) {
      ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts[0] || null);
      });
      ethereum.on("chainChanged", (id: string) => {
        setChainId(parseInt(id, 16));
      });
    }
  }, []);

  async function checkConnection() {
    const ethereum = getEthereumProvider();
    if (!ethereum) return;
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const network = await provider.getNetwork();
        setChainId(network.chainId);
      }
    } catch {}
  }

  async function connect() {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      const network = await provider.getNetwork();
      setChainId(network.chainId);

      if (network.chainId !== 296) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x128",
              chainName: "Hedera Testnet",
              nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
              rpcUrls: ["https://testnet.hashio.io/api"],
              blockExplorerUrls: ["https://hashscan.io/testnet"],
            }],
          });
        } catch {}
      }
    } catch (err) {
      console.error("Failed to connect:", err);
    }
  }

  function disconnect() {
    setAccount(null);
    setChainId(null);
  }

  const isWrongNetwork = chainId !== null && chainId !== 296;
  const shortAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "";

  if (account) {
    return (
      <div className="flex items-center gap-2">
        {isWrongNetwork && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Wrong Network</span>
        )}
        <span className="text-sm text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg font-mono">
          {shortAddress}
        </span>
        <button onClick={disconnect} className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Disconnect">
          <LogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
    >
      <Wallet size={16} />
      Connect Wallet
    </button>
  );
}
