// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title MockAgentID
/// @notice Minimal ERC-721 stand-in for the real Binance Agent ID contract,
///         used ONLY on testnet / in tests. Anyone can mint a mock Agent ID
///         to any address so tests and the testnet demo can grant holder status.
///         The real Agent ID (0x60b9262456de011f7d15a54cdd8c48baaa8b022f on
///         BNB Chain mainnet) is non-transferable and issued by Binance —
///         this mock deliberately does NOT reproduce that.
contract MockAgentID is ERC721 {
    uint256 public nextId;

    constructor() ERC721("Mock Agent ID", "MOCKID") {}

    function mint(address to) external returns (uint256 tokenId) {
        tokenId = ++nextId;
        _safeMint(to, tokenId);
    }
}
