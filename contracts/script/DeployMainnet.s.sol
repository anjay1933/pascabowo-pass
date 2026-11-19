// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {PascabowoPass} from "../src/PascabowoPass.sol";

/// @notice MAINNET-ONLY deploy: PascabowoPass with the REAL Agent ID contract.
///         Deploys NOTHING else — no MockAgentID, no mint.
///         Usage (dry-run):  forge script script/DeployMainnet.s.sol --rpc-url <bsc mainnet RPC> --private-key $KEY --chain-id 56
///         Usage (broadcast): add --broadcast
contract DeployMainnet is Script {
    address internal constant AGENT_ID_MAINNET = 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F;

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);
        console.log("Deployer:", deployer);
        console.log("Agent ID (mainnet):", AGENT_ID_MAINNET);
        console.log("maxSupply: 1000");

        vm.startBroadcast(deployerKey);
        PascabowoPass pass = new PascabowoPass(AGENT_ID_MAINNET, 1000);
        vm.stopBroadcast();

        console.log("PascabowoPass deployed:", address(pass));
        console.log("PascabowoPass maxSupply:", pass.maxSupply());
        console.log("PascabowoPass agentID:", pass.agentID());
        console.log("PascabowoPass totalMinted:", pass.totalMinted());
    }
}
