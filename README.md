# Pascabowo Pass

A **free mint NFT that only Agent ID holders can mint** — 1 per wallet, 0 cost.
Built for the Binance Agent ID Hackathon (Track 2: build a dApp).

> One Agent ID. One free mint. No bots, no farming.

## What it is

Pascabowo Pass is a free collectible badge proving you hold an Agent ID.
The mint contract checks your Agent ID balance **on-chain** before letting
you mint, and enforces **exactly 1 mint per wallet** on-chain — so the badge
can't be farmed by bots or sybils.

- **Mint price:** 0 (free — you only pay the BNB network gas)
- **Supply:** 1,000 passes (see `config.js` — `MAX_SUPPLY_FALLBACK`)
- **Per wallet:** 1
- **Network:** BNB Smart Chain (mainnet, chain 56; testnet mode available, chain 97)

## What Agent ID is used for

- **Access control:** the contract only allows minting if
  `AgentID.balanceOf(msg.sender) > 0`. No Agent ID → the mint reverts.
- **Sybil-resistance:** 1 mint per wallet, enforced on-chain via
  `hasMinted(address)`. A second mint from the same wallet fails.
- **Verification display:** the site shows "Agent ID: VERIFIED ✓" after
  reading your Agent ID balance on-chain — no off-chain allowlist, no
  sign-up, no database.

## Owner permissions: NONE

The contract is **fully immutable**. There are **no admin functions and no
owner permissions** — no owner, no pausing, no extra minting, no changing
the rules after deployment. What is deployed is what runs, forever.

## How to mint

1. **Hold an Agent ID.** Agent ID is a free identity badge on BNB Smart
   Chain — claim yours in the Binance App if you don't have one yet.
2. **Open the site** (see [DEPLOY.md](DEPLOY.md)) and click **Connect Wallet**.
   Use Binance Wallet or MetaMask (injected wallet only — no QR-code login,
   no seed phrase, no private key is ever asked for).
3. The site checks on-chain: your Agent ID, whether you already minted,
   and how many passes are minted.
4. If you hold an Agent ID, haven't minted, and supply remains, click
   **Mint — Free**. Confirm the transaction in your wallet (value 0, only
   BNB gas). Once confirmed, your Pass appears on the page with a BscScan
   link.

## Contract addresses

| Contract | Network | Address |
|---|---|---|
| Agent ID (ERC-721) | BNB Smart Chain mainnet | [`0x60b9262456de011f7d15a54cdd8c48baaa8b022f`](https://bscscan.com/address/0x60b9262456de011f7d15a54cdd8c48baaa8b022f) |
| Pascabowo Pass | BNB Smart Chain testnet | TBD — not deployed yet |
| Pascabowo Pass | BNB Smart Chain mainnet | [`0x366810D042fB69303282223667647d96809ab1ca`](https://bscscan.com/address/0x366810D042fB69303282223667647d96809ab1ca) — deployed 2026-11-19, [tx `0xc9b41fb0…0b281`](https://bscscan.com/tx/0xc9b41fb01140621c3b3d717b4e059f5569b4661197627a9f831a3eaa0950b281), gas 2,642,194 @ 0.05 gwei (≈0.000132 BNB). Source verified on Sourcify (exact_match). |

Deployed 2026-11-19 from `0x47D680352EB6A74313401EBd2BA866233B4C606a`. `config.js` is wired to the mainnet address above — no other file needs to change.

## Tech stack

- **Static site, no build step** — plain HTML + CSS + vanilla JS. Works from
  any static host (GitHub Pages, IPFS, etc.).
- **ethers.js v6.17.0, vendored locally** (`ethers.min.js`) — zero
  runtime CDN dependency.
- **Reads** via a public BSC RPC (`bsc-dataseed.binance.org`); **writes**
  via the user's injected wallet only.
- **Art:** `preview.svg` — dark navy `#0B1020`, gold `#F0B90B`,
  shield + check badge. The on-chain SVG uses the same visual language.
  `social-preview.png` is the 1200×630 social card.

## Project structure

```
pascabowo-pass/          — repo root = GitHub Pages site root
├── index.html           — single-page mint site
├── app.js               — wallet / eligibility / mint logic
├── config.js            — ALL chain / contract values (edit this to wire the contract)
├── styles.css           — styling
├── ethers.min.js        — vendored ethers v6.17.0 (no CDN)
├── preview.svg          — badge art (hero + NFT preview fallback)
├── social-preview.png   — 1200×630 social card
├── package.json / package-lock.json — ethers pin (re-vendor with `npm install ethers@6`)
├── README.md            — this file
├── DEPLOY.md            — GitHub Pages deployment steps
└── contracts/
    ├── src/PascabowoPass.sol    — the mint contract (ERC-721, immutable)
    ├── test/PascabowoPass.t.sol — 8 forge tests
    └── script/DeployMainnet.s.sol — mainnet deploy script
```

## Disclaimer

This badge has no monetary value promised and is not an investment. It is a
free collectible proving you hold an Agent ID.

## License

MIT
