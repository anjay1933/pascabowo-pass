# Deploying Pascabowo Pass

The site is a **static site with no build step** — the files at the repo root
are the whole site. Anyone can deploy it; the steps below use GitHub Pages.

> **Agents cannot create GitHub repos.** The user creates the repo himself —
> no agent should attempt repo creation or pushing.

## GitHub Pages (recommended)

1. **Create the repo** (on github.com, signed in as yourself):
   - New repository → name: `pascabowo-pass` (suggested)
   - Visibility: Public (required for free GitHub Pages on a personal account)
   - Do NOT initialise with a README / .gitignore / license — the files
     already exist locally.
2. **Push the site files** — `index.html` must be at the repo root
   (GitHub Pages serves from the repo root or `/docs`):
   ```bash
   git init
   git add index.html app.js config.js styles.css ethers.min.js preview.svg social-preview.png README.md DEPLOY.md contracts/
   git commit -m "Pascabowo Pass — free Agent ID-gated mint site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/pascabowo-pass.git
   git push -u origin main
   ```
   Replace `<your-username>` with your GitHub username.
   - `package.json` / `package-lock.json` are harmless to include (they
     only pin the vendored ethers version); `node_modules/` must NOT be
     pushed — it is not part of the site.
3. **Enable Pages:**
   - Repo → **Settings** → **Pages** (left sidebar).
   - Under "Build and deployment", Source: **Deploy from a branch**.
   - Branch: **main**, folder: **/(root)** → Save.
4. **Wait ~1–2 minutes**, then open the site at:
   ```
   https://<your-username>.github.io/pascabowo-pass/
   ```

## Contract — already deployed

The contract is live on BNB Smart Chain mainnet:
`0x366810D042fB69303282223667647d96809ab1ca`
(tx `0xc9b41fb01140621c3b3d717b4e059f5569b4661197627a9f831a3eaa0950b281`).
`config.js` is already wired to it (`PASS_CONTRACT_ADDRESS`).
To change the contract after a redeploy, edit only `config.js` and re-push —
no other file needs to change.

## Alternative: any static host

The same files work on any static host — no server, no build, no env vars:

- **Vercel / Netlify:** drag-and-drop the repo-root files, or connect
  the repo with the publish directory set to the repo root.
- **IPFS / Fleek / Cloudflare Pages:** upload the repo-root files.
- **Any web server:** copy the repo-root files into the web root
  (e.g. `python3 -m http.server` for a local preview — see below).

The only requirement is that all files are served from the **same folder**
over HTTP(S) — opening `index.html` directly via `file://` may be blocked
by browser rules for local scripts, so always preview over HTTP.

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000/ in your browser
```

Connect a wallet holding an Agent ID to test the full mint flow.
