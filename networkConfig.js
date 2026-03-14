// ============ Anvil Local Blockchain ============

export const EXPECTED_CHAIN = {
  id: 31337,
  name: "Anvil Local",
  network: "anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrl: "http://localhost:8545",
};

export const INJECTIVE_CHAIN = {
  id: 1439,
  name: "Injective testnet",
  network: "injective",
  nativeCurrency: { name: "Injective", symbol: "INJ", decimals: 18 },
  rpcUrl: "https://k8s.testnet.json-rpc.injective.network/",
  blockExplorerUrls: ["testnet.blockscout.injective.network/"],
};
