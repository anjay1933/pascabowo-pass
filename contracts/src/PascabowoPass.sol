// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title Pascabowo Pass
/// @notice A FREE mint NFT that only Binance Agent ID holders can mint.
///         One identity = one mint. Bots without an Agent ID cannot farm.
///         Mainnet Agent ID (BNB Chain, ERC-721, non-transferable):
///         0x60b9262456de011f7d15a54cdd8c48baaa8b022f
///         Holder check: IERC721(agentID).balanceOf(address) > 0.
///
/// @dev OWNER POWERS: NONE. This contract has NO Ownable, NO admin function,
///      NO setBaseURI, NO pause, NO withdraw, NO extra/owner mint, NO upgrade.
///      It is fully immutable once deployed: the only state-changing function
///      is the public, free, permissionless (for Agent ID holders) mint().
///      This is deliberate — a judging strength for the Binance Agent ID
///      Hackathon ("owner permissions: none").
contract PascabowoPass is ERC721 {
    using Strings for uint256;

    /// @notice The Agent ID ERC-721 contract used for the holder check.
    address public immutable agentID;

    /// @notice Hard cap on total supply. Mainnet deploy uses 1000.
    uint256 public immutable maxSupply;

    /// @notice Number of passes minted so far. Next tokenId = totalMinted + 1.
    uint256 public totalMinted;

    /// @notice True once an address has minted its one pass.
    mapping(address => bool) public hasMinted;

    event Minted(address indexed to, uint256 indexed tokenId);

    error NotAgentIDHolder();
    error AlreadyMinted();
    error MaxSupplyReached();
    // Note: mint() is NON-payable, so the EVM itself reverts any call that
    // attaches value — no explicit msg.value check is possible (or needed)
    // in Solidity for a non-payable function.

    constructor(address agentID_, uint256 maxSupply_) ERC721("Pascabowo Pass", "PPASS") {
        require(agentID_ != address(0), "agentID zero");
        require(maxSupply_ > 0, "maxSupply zero");
        agentID = agentID_;
        maxSupply = maxSupply_;
    }

    /// @notice Mint one free Pascabowo Pass. Caller must hold an Agent ID.
    /// @dev Non-payable: any attached value reverts. One mint per wallet.
    ///      TokenIds are sequential starting at 1.
    function mint() external {
        // Non-payable: any attached value reverts automatically at the EVM level.
        if (IERC721(agentID).balanceOf(msg.sender) == 0) revert NotAgentIDHolder();
        if (hasMinted[msg.sender]) revert AlreadyMinted();
        if (totalMinted >= maxSupply) revert MaxSupplyReached();

        hasMinted[msg.sender] = true;
        totalMinted += 1;
        uint256 tokenId = totalMinted;
        _safeMint(msg.sender, tokenId);
        emit Minted(msg.sender, tokenId);
    }

    /// @notice Fully on-chain metadata: base64 JSON with an inline SVG badge.
    ///         No external URL, no IPFS — the badge lives on-chain forever.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert ERC721NonexistentToken(tokenId);

        string memory svg = _svg(tokenId);
        string memory json = string(
            abi.encodePacked(
                '{"name":"Pascabowo Pass #',
                tokenId.toString(),
                '","description":"Pascabowo Pass is a free collectible badge for Binance Agent ID holders. One identity, one mint - no monetary value is promised and none should be expected.","image":"data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '"}'
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _svg(uint256 tokenId) internal view returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'>",
                    "<rect width='512' height='512' fill='#0B1020'/>",
                    "<rect x='16' y='16' width='480' height='480' fill='none' stroke='#F0B90B' stroke-width='4'/>",
                    "<circle cx='256' cy='96' r='28' fill='none' stroke='#F0B90B' stroke-width='3'/>",
                    "<text x='256' y='200' font-family='sans-serif' font-size='40' font-weight='bold' fill='#FFFFFF' text-anchor='middle'>PASCABOWO PASS</text>",
                    "<text x='256' y='290' font-family='sans-serif' font-size='72' font-weight='bold' fill='#F0B90B' text-anchor='middle'>#",
                    tokenId.toString(),
                    "</text>",
                    "<text x='256' y='350' font-family='sans-serif' font-size='24' fill='#FFFFFF' text-anchor='middle'>AGENT ID VERIFIED</text>",
                    "<text x='256' y='392' font-family='sans-serif' font-size='22' fill='#F0B90B' text-anchor='middle'>",
                    tokenId.toString(),
                    " OF ",
                    maxSupply.toString(),
                    "</text>",
                    "</svg>"
                )
            );
    }
}
