// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SkillNFT
 * @dev Implementation of a "Proof of Learning" NFT for assignment completions.
 * This contract allows the owner (the application server) to mint NFTs to learners
 * with specific metadata URIs stored on IPFS.
 */
contract SkillNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    /**
     * @dev Constructor that initializes the NFT name and symbol.
     * @param name The name of the NFT collection (e.g., "LearnLoop Skill").
     * @param symbol The ticker symbol for the collection (e.g., "LSKL").
     */
    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
        Ownable(msg.sender)
    {}

    /**
     * @dev Mints a new Skill NFT to a learner.
     * @param learner The address of the student who completed the assignment.
     * @param metadataURI The IPFS link to the JSON metadata (from Pinata).
     * @return The ID of the newly minted token.
     */
    function mintSkillNFT(address learner, string memory metadataURI)
        public
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(learner, tokenId);
        _setTokenURI(tokenId, metadataURI);

        return tokenId;
    }

    /**
     * @dev Returns the current count of tokens minted.
     */
    function totalMinted() public view returns (uint256) {
        return _nextTokenId;
    }
}
