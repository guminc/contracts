// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

interface INononFriendCard {
    /**
     * cannot transfer the soulbound token
     */
    error OnlyForYou();

    /**
     * cannot set collection address to zero address
     */
    error CollectionZeroAddress();

    /**
     * cannot add new level with a lower minimum
     */
    error LevelMinimumLowerThanExisting();

    /**
     * incorrect params given
     */
    error InvalidParams();

    /**
     * message exceeds size limit
     */
    error MessageTooLong();

    /**
     * svg data already set
     */
    error SvgAlreadySet();

    event MetadataUpdate(uint256 _tokenId);

    event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);

    event Locked(uint256 tokenId);

    function registerTokenMovement(address from, address to, uint256 collectionTokenStartId, uint256 quantity)
        external;

    function mintTo(address to) external;

    function hasToken(address receiver) external returns (bool);
}
