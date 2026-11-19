// Pascabowo Pass — ALL chain / contract values live here.
// The coordinator wires real addresses by editing ONLY this file.
// No other file needs to change when the contract is deployed.
window.PASS_CONFIG = {
  // Mainnet (BNB Smart Chain). Set TESTNET_MODE to true to use testnet (97).
  CHAIN_ID: 56,
  TESTNET_MODE: false,
  TESTNET_CHAIN_ID: 97,

  // Pascabowo Pass mint contract — DEPLOYED on BSC mainnet 2026-11-19.
  // Tx: 0xc9b41fb01140621c3b3d717b4e059f5569b4661197627a9f831a3eaa0950b281
  PASS_CONTRACT_ADDRESS: "0x366810D042fB69303282223667647d96809ab1ca",

  // Agent ID contract (BNB Chain, ERC-721, SPACE ID). Verified mainnet address.
  AGENT_ID_ADDRESS: "0x60b9262456de011f7d15a54cdd8c48baaa8b022f",

  // Public read-only RPC endpoints (reads only — no wallet needed for these).
  BSC_RPC: "https://bsc-dataseed.binance.org/",
  BSC_TESTNET_RPC: "https://data-seed-prebsc-1-s1.binance.org:8545/",

  // Fallback display value if the contract does not expose MAX_SUPPLY/maxSupply.
  MAX_SUPPLY_FALLBACK: 1000,

  // Explorers
  BSCSCAN_BASE: "https://bscscan.com",
  BSCSCAN_TESTNET_BASE: "https://testnet.bscscan.com",

  // Hackathon announcement (official)
  HACKATHON_ANNOUNCEMENT:
    "https://www.binance.com/en/support/announcement/detail/95f5dbe0ea674a48a739b59e046648bf",
};
