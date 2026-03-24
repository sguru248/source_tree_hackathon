/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Returns the preferred EVM wallet provider, resolving conflicts
 * when multiple wallet extensions are installed (MetaMask, Phantom, etc.).
 */
export function getEthereumProvider(): any | null {
  if (typeof window === "undefined" || !(window as any).ethereum) return null;
  const ethereum = (window as any).ethereum;
  // When multiple providers are injected, pick MetaMask explicitly
  if (ethereum.providers?.length) {
    const metamask = ethereum.providers.find((p: any) => p.isMetaMask);
    if (metamask) return metamask;
  }
  if (ethereum.isMetaMask) return ethereum;
  return ethereum;
}
