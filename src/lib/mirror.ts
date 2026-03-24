const MIRROR_NODE_URL = process.env.NEXT_PUBLIC_MIRROR_NODE_URL || "https://testnet.mirrornode.hedera.com/api/v1";

export interface MirrorHCSMessage {
  consensus_timestamp: string;
  message: string;
  payer_account_id: string;
  running_hash: string;
  running_hash_version: number;
  sequence_number: number;
  topic_id: string;
}

export interface MirrorNFTInfo {
  account_id: string;
  created_timestamp: string;
  metadata: string;
  serial_number: number;
  token_id: string;
}

export async function fetchHCSMessages(topicId: string): Promise<MirrorHCSMessage[]> {
  const messages: MirrorHCSMessage[] = [];
  let url = `${MIRROR_NODE_URL}/topics/${topicId}/messages?limit=100&order=asc`;

  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mirror Node error: ${res.status}`);
    const data = await res.json();
    messages.push(...(data.messages || []));
    url = data.links?.next ? `${MIRROR_NODE_URL}${data.links.next}` : "";
  }

  return messages;
}

export function decodeHCSMessage(base64Message: string): any {
  try {
    const decoded = atob(base64Message);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function fetchNFTInfo(tokenId: string, serialNumber: number): Promise<MirrorNFTInfo | null> {
  try {
    const res = await fetch(`${MIRROR_NODE_URL}/tokens/${tokenId}/nfts/${serialNumber}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchTokenInfo(tokenId: string): Promise<any> {
  try {
    const res = await fetch(`${MIRROR_NODE_URL}/tokens/${tokenId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchTransaction(transactionId: string): Promise<any> {
  try {
    const res = await fetch(`${MIRROR_NODE_URL}/transactions/${transactionId}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Fungible Token Balance ───

export async function fetchFungibleTokenBalance(
  accountId: string,
  tokenId: string
): Promise<number> {
  try {
    const res = await fetch(`${MIRROR_NODE_URL}/accounts/${accountId}/tokens?token.id=${tokenId}`);
    if (!res.ok) return 0;
    const data = await res.json();
    const token = data.tokens?.find((t: any) => t.token_id === tokenId);
    return token ? Number(token.balance) : 0;
  } catch {
    return 0;
  }
}
