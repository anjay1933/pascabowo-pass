/* Pascabowo Pass — mint app.
 * Injected wallet only (window.ethereum — Binance Wallet / MetaMask).
 * No WalletConnect, no QR-code login, no seed / private-key input anywhere.
 * All chain/contract values come from config.js (window.PASS_CONFIG).
 */
(function () {
  "use strict";

  var CFG = window.PASS_CONFIG || {};
  var ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  // ---------- Minimal ABIs ----------
  var PASS_ABI = [
    "function mint()",
    "function totalSupply() view returns (uint256)",
    "function totalMinted() view returns (uint256)", // PascabowoPass exposes totalMinted (no Enumerable)
    "function MAX_SUPPLY() view returns (uint256)",
    "function maxSupply() view returns (uint256)",
    "function hasMinted(address) view returns (bool)",
    "function tokenURI(uint256) view returns (string)",
    "function balanceOf(address) view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  ];
  var AGENT_ID_ABI = [
    "function balanceOf(address) view returns (uint256)",
  ];

  // ---------- DOM ----------
  function $(id) { return document.getElementById(id); }
  var connectBtn = $("connectBtn");
  var switchChainBtn = $("switchChainBtn");
  var mintBtn = $("mintBtn");
  var walletAddressEl = $("walletAddress");
  var networkPill = $("networkPill");
  var agentIdStatus = $("agentIdStatus");
  var mintedStatus = $("mintedStatus");
  var supplyStatus = $("supplyStatus");
  var messageEl = $("message");
  var mintedNft = $("mintedNft");
  var mintedNftImg = $("mintedNftImg");
  var mintedNftMeta = $("mintedNftMeta");

  // ---------- State ----------
  var readProvider = null; // public RPC, wallet-free reads
  var walletProvider = null; // ethers BrowserProvider (injected wallet)
  var signer = null;
  var account = null;
  var chainId = null;
  var isHolder = false;
  var alreadyMinted = false;
  var supplyLeft = null;

  // ---------- Config helpers ----------
  function activeChainId() {
    return CFG.TESTNET_MODE ? CFG.TESTNET_CHAIN_ID : CFG.CHAIN_ID;
  }
  function activeRpc() {
    return CFG.TESTNET_MODE ? CFG.BSC_TESTNET_RPC : CFG.BSC_RPC;
  }
  function activeExplorer() {
    return CFG.TESTNET_MODE ? CFG.BSCSCAN_TESTNET_BASE : CFG.BSCSCAN_BASE;
  }
  function passDeployed() {
    return CFG.PASS_CONTRACT_ADDRESS &&
      CFG.PASS_CONTRACT_ADDRESS.toLowerCase() !== ZERO_ADDRESS;
  }
  function explorerTx(hash) { return activeExplorer() + "/tx/" + hash; }
  function explorerAddress(addr) { return activeExplorer() + "/address/" + addr; }

  function truncate(addr) {
    return addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";
  }

  // ---------- Messages ----------
  function showMessage(text, kind, html) {
    messageEl.className = "message show " + (kind || "info");
    if (html) messageEl.innerHTML = text;
    else messageEl.textContent = text;
  }
  function clearMessage() {
    messageEl.className = "message";
    messageEl.textContent = "";
  }

  function setStatus(el, text, cls) {
    el.textContent = text;
    el.className = "value" + (cls ? " " + cls : "");
  }

  // ---------- Read-only contracts (public RPC, no wallet needed) ----------
  function getReadProvider() {
    if (!readProvider) readProvider = new ethers.JsonRpcProvider(activeRpc());
    return readProvider;
  }
  function passRead() {
    return new ethers.Contract(CFG.PASS_CONTRACT_ADDRESS, PASS_ABI, getReadProvider());
  }
  function agentIdRead() {
    return new ethers.Contract(CFG.AGENT_ID_ADDRESS, AGENT_ID_ABI, getReadProvider());
  }

  async function readMaxSupply(contract) {
    try { return await contract.MAX_SUPPLY(); } catch (e) { /* try lowercase */ }
    try { return await contract.maxSupply(); } catch (e) { /* not exposed */ }
    return BigInt(CFG.MAX_SUPPLY_FALLBACK || 1000);
  }

  async function refreshSupply() {
    if (!passDeployed()) {
      setStatus(supplyStatus, "Contract not deployed yet", "warn");
      supplyLeft = null;
      return;
    }
    try {
      var c = passRead();
      var total;
      try { total = await c.totalSupply(); }
      catch (e) { total = await c.totalMinted(); } // PascabowoPass has no totalSupply()
      var max = await readMaxSupply(c);
      var left = max - total;
      supplyLeft = left;
      setStatus(supplyStatus, total.toString() + " / " + max.toString(),
        left > 0n ? "" : "no");
    } catch (e) {
      setStatus(supplyStatus, "Unavailable", "warn");
      supplyLeft = null;
    }
  }

  // ---------- Eligibility ----------
  async function refreshEligibility() {
    if (!account) return;
    // (a) Agent ID balance
    try {
      var bal = await agentIdRead().balanceOf(account);
      isHolder = bal > 0n;
      setStatus(agentIdStatus,
        isHolder ? "VERIFIED \u2713" : "No Agent ID",
        isHolder ? "ok" : "no");
    } catch (e) {
      isHolder = false;
      setStatus(agentIdStatus, "Check failed", "warn");
    }
    // (b) already minted?
    if (passDeployed()) {
      try {
        alreadyMinted = await passRead().hasMinted(account);
        setStatus(mintedStatus,
          alreadyMinted ? "Already minted" : "Not minted yet",
          alreadyMinted ? "warn" : "ok");
      } catch (e) {
        alreadyMinted = false;
        setStatus(mintedStatus, "Unavailable", "warn");
      }
    } else {
      setStatus(mintedStatus, "Contract not deployed yet", "warn");
    }
    await refreshSupply();
    updateMintButton();
  }

  function updateMintButton() {
    if (!account) {
      mintBtn.disabled = true;
      mintBtn.textContent = "Connect your wallet to mint";
      return;
    }
    if (!passDeployed()) {
      mintBtn.disabled = true;
      mintBtn.textContent = "Contract not deployed yet";
      return;
    }
    if (chainId !== activeChainId()) {
      mintBtn.disabled = true;
      mintBtn.textContent = "Switch to BNB Smart Chain to mint";
      return;
    }
    if (!isHolder) {
      mintBtn.disabled = true;
      mintBtn.textContent = "You need an Agent ID to mint";
      return;
    }
    if (alreadyMinted) {
      mintBtn.disabled = true;
      mintBtn.textContent = "Already minted — 1 per wallet";
      return;
    }
    if (supplyLeft !== null && supplyLeft <= 0n) {
      mintBtn.disabled = true;
      mintBtn.textContent = "Sold out";
      return;
    }
    mintBtn.disabled = false;
    mintBtn.textContent = "Mint — Free";
  }

  // ---------- Wallet ----------
  function hasInjectedWallet() {
    return typeof window.ethereum !== "undefined";
  }

  async function connectWallet() {
    clearMessage();
    if (!hasInjectedWallet()) {
      showMessage("No wallet found. Install Binance Wallet or MetaMask in your browser, then refresh this page.", "error");
      return;
    }
    try {
      walletProvider = new ethers.BrowserProvider(window.ethereum);
      var accounts = await walletProvider.send("eth_requestAccounts", []);
      if (!accounts || !accounts.length) {
        showMessage("No account selected. Please select an account in your wallet and try again.", "error");
        return;
      }
      account = accounts[0];
      signer = await walletProvider.getSigner();
      var net = await walletProvider.getNetwork();
      chainId = Number(net.chainId);
      renderWallet();
      await refreshEligibility();
      if (chainId !== activeChainId()) {
        showMessage("You are on the wrong network. Click “Switch to BNB Smart Chain” to continue.", "info");
      }
    } catch (e) {
      showMessage(friendlyError(e, "Could not connect your wallet."), "error");
    }
  }

  function renderWallet() {
    if (account) {
      connectBtn.textContent = "Connected";
      connectBtn.disabled = true;
      walletAddressEl.textContent = truncate(account);
      var correct = chainId === activeChainId();
      networkPill.textContent = correct
        ? (CFG.TESTNET_MODE ? "BNB Testnet" : "BNB Smart Chain")
        : "Wrong network (chain " + chainId + ")";
      switchChainBtn.style.display = correct ? "none" : "";
    }
  }

  async function switchChain() {
    if (!hasInjectedWallet()) return;
    var hex = "0x" + activeChainId().toString(16);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hex }],
      });
    } catch (e) {
      // 4902 = chain not added to the wallet yet → add it, then switch.
      if (e && (e.code === 4902 || (e.message || "").indexOf("4902") !== -1)) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: hex,
              chainName: CFG.TESTNET_MODE ? "BNB Smart Chain Testnet" : "BNB Smart Chain",
              nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
              rpcUrls: [activeRpc()],
              blockExplorerUrls: [activeExplorer()],
            }],
          });
        } catch (addErr) {
          showMessage(friendlyError(addErr, "Could not add the BNB Smart Chain network."), "error");
        }
      } else {
        showMessage(friendlyError(e, "Could not switch networks."), "error");
      }
    }
  }

  // ---------- Mint ----------
  function decodeTokenImage(tokenUri) {
    // data:application/json;base64,{...} with image: data:image/svg+xml;base64,...
    try {
      var prefix = "data:application/json;base64,";
      if (tokenUri.indexOf(prefix) !== 0) return null;
      var json = JSON.parse(atob(tokenUri.slice(prefix.length)));
      return json && json.image ? json.image : null;
    } catch (e) { return null; }
  }

  async function mint() {
    clearMessage();
    if (!signer || !account) { showMessage("Connect your wallet first.", "error"); return; }
    if (!passDeployed()) { showMessage("The mint contract is not deployed yet. Please check back later.", "error"); return; }
    if (!isHolder) {
      showMessage("You need an Agent ID to mint. Claim a free Agent ID in the Binance App, then come back.", "error");
      return;
    }
    if (alreadyMinted) {
      showMessage("This wallet already minted its one Pass. 1 per wallet — no second mint.", "error");
      return;
    }

    mintBtn.disabled = true;
    mintBtn.textContent = "Waiting for your wallet…";
    try {
      var contract = new ethers.Contract(CFG.PASS_CONTRACT_ADDRESS, PASS_ABI, signer);
      var tx = await contract.mint(); // value 0 — free mint
      showMessage("Mint sent — waiting for confirmation… Tx: " + tx.hash, "info");
      mintBtn.textContent = "Confirming…";
      var receipt = await tx.wait();
      if (receipt.status !== 1n && receipt.status !== 1) throw new Error("tx-failed");

      // Find the minted tokenId from the Transfer event (from 0x0 → you).
      var tokenId = null;
      try {
        var iface = new ethers.Interface(PASS_ABI);
        for (var i = 0; i < receipt.logs.length; i++) {
          try {
            var parsed = iface.parseLog(receipt.logs[i]);
            if (parsed && parsed.name === "Transfer" &&
                parsed.args.to.toLowerCase() === account.toLowerCase()) {
              tokenId = parsed.args.tokenId;
              break;
            }
          } catch (e) { /* log from another contract */ }
        }
      } catch (e) { /* keep tokenId null */ }

      var txLink = '<a href="' + explorerTx(tx.hash) + '" target="_blank" rel="noopener">View on BscScan</a>';
      showMessage("Minted! Your Pascabowo Pass is yours. <span class='tx-link'>" + txLink + "</span>", "success", true);

      alreadyMinted = true;
      await refreshSupply();
      updateMintButton();
      mintBtn.textContent = "Already minted — 1 per wallet";

      // Show the NFT image from tokenURI (on-chain SVG), fallback to preview.
      if (tokenId !== null) {
        try {
          var uri = await passRead().tokenURI(tokenId);
          var img = decodeTokenImage(uri);
          if (img) mintedNftImg.src = img;
          mintedNftMeta.textContent = "Token #" + tokenId.toString() + " · " + truncate(account);
          mintedNft.classList.add("show");
        } catch (e) {
          mintedNftMeta.textContent = "Token #" + tokenId.toString() + " · " + truncate(account);
          mintedNft.classList.add("show");
        }
      }
    } catch (e) {
      updateMintButton();
      mintBtn.textContent = "Mint — Free";
      showMessage(friendlyError(e, "Mint failed."), "error");
    }
  }

  // ---------- Plain-language errors ----------
  function friendlyError(e, fallback) {
    var msg = (e && (e.reason || e.message || "")) + "";
    var short = (e && e.shortMessage) || "";
    var code = e && e.code;

    if (code === "ACTION_REJECTED" || /user rejected|user denied/i.test(msg) || /user rejected/i.test(short))
      return "You rejected the transaction in your wallet. Nothing was minted — try again when ready.";
    if (/already minted|hasMinted|one per wallet/i.test(msg) || /already minted/i.test(short))
      return "This wallet already minted its one Pass. 1 per wallet — no second mint.";
    if (/not (an? )?agent|no agent id|not a holder|not eligible/i.test(msg) || /not a holder/i.test(short))
      return "You need an Agent ID to mint. Claim a free Agent ID in the Binance App, then come back.";
    if (/sold out|out of supply|max supply|exceeds/i.test(msg) || /sold out/i.test(short))
      return "All passes are minted — sold out.";
    if (/insufficient funds/i.test(msg))
      return "Not enough BNB in your wallet to pay the network gas. The mint itself is free, but gas is not.";
    if (/tx-failed/.test(msg))
      return "The transaction failed on-chain. Nothing was minted and no Pass was created — please try again.";
    if (/network|timeout|fetch failed|ECONN/i.test(msg))
      return "Network error while talking to BNB Smart Chain. Check your connection and try again.";
    if (msg) return fallback + " (" + msg.slice(0, 160) + ")";
    return fallback;
  }

  // ---------- Init ----------
  function init() {
    // Footer links
    $("agentIdContractLink").href = explorerAddress(CFG.AGENT_ID_ADDRESS);
    $("announcementLink").href = CFG.HACKATHON_ANNOUNCEMENT;
    var passLink = $("passContractLink");
    if (passDeployed()) {
      passLink.href = explorerAddress(CFG.PASS_CONTRACT_ADDRESS);
    } else {
      passLink.href = "#";
      passLink.textContent = "Pass contract on BscScan (address TBD — not deployed yet)";
      passLink.addEventListener("click", function (ev) { ev.preventDefault(); });
    }

    if (typeof ethers === "undefined") {
      showMessage("Could not load the local ethers library (ethers.min.js). Check that the file sits next to index.html and refresh.", "error");
      connectBtn.disabled = true;
      mintBtn.disabled = true;
      return;
    }

    connectBtn.addEventListener("click", connectWallet);
    switchChainBtn.addEventListener("click", switchChain);
    mintBtn.addEventListener("click", mint);

    // Public supply read — works with no wallet connected.
    refreshSupply();
    if (!passDeployed()) {
      showMessage("The mint contract is not deployed yet — the page will work fully once the contract address is set in config.js.", "info");
    }

    // React to wallet changes.
    if (hasInjectedWallet()) {
      window.ethereum.on("accountsChanged", function (accounts) {
        account = accounts && accounts.length ? accounts[0] : null;
        if (!account) {
          connectBtn.textContent = "Connect Wallet";
          connectBtn.disabled = false;
          walletAddressEl.textContent = "";
          setStatus(agentIdStatus, "—");
          setStatus(mintedStatus, "—");
          isHolder = false; alreadyMinted = false;
          updateMintButton();
          return;
        }
        renderWallet();
        refreshEligibility();
      });
      window.ethereum.on("chainChanged", function (hexId) {
        chainId = parseInt(hexId, 16);
        renderWallet();
        refreshEligibility();
        if (chainId !== activeChainId())
          showMessage("You are on the wrong network. Click “Switch to BNB Smart Chain” to continue.", "info");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
