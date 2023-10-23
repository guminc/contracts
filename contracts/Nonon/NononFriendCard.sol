// SPDX-License-Identifier: MIT 

/// @title NONON FRIEND CARD - YOUR SPECIAL GIFT

pragma solidity 0.8.4;

import "../ERC721A.sol";
import "../IERC721A.sol";
import "solady/src/auth/OwnableRoles.sol";
import "solady/src/utils/Base64.sol";
import "solady/src/utils/SSTORE2.sol";
import "solady/src/utils/LibBitmap.sol";

import "./INononFriendCard.sol";

contract NononFriendCard is INononFriendCard, ERC721A, OwnableRoles {
    using LibBitmap for LibBitmap.Bitmap;

    // track tokens that have been collected by a given address
    mapping(address => LibBitmap.Bitmap) private receivedBitmap;
    mapping(address => LibBitmap.Bitmap) private sentBitmap;

    string public constant TOKEN_NAME = "NONON FRIEND CARD ";
    string public constant DEFAULT_DESC = "share your message at nonon.house";

    address public immutable collectionAddress;

    // address where bytes for base SVG are stored
    address private baseSvgPointer;
    bool private baseSvgPointerLocked;
    // address where bytes for svg defs are stored
    address private defsSvgPointer;
    bool private defsSvgPointerLocked;
    // address where level sprites are stored
    address private spritesSvgPointer;
    bool private spritesSvgPointerLocked;

    struct Level {
        uint256 minimum;
        string name;
        string colorGradient;
        uint16 spriteIndex;
        uint16 spriteLength;
    }

    struct LevelImageData {
        string suffix;
        string colorGradient;
        uint16 spriteIndex;
        uint16 spriteLength;
        uint256 cap;
    }

    // the evolution levels of the token
    Level[] public levels;

    struct TokenPoints {
        uint256 id;
        address owner;
        uint256 points;
    }

    // for easy lookup
    mapping(address => uint256) public tokenOf;

    // user messages (tokenId => message)
    mapping(uint256 => string) public messages;

    constructor(address tokenCollectionAddress) ERC721A("NononFriendCard", "NONON_FRIEND") {
        _setOwner(msg.sender);
        collectionAddress = tokenCollectionAddress;

        levels.push(Level(0, "LEVEL 1", "grad-1", 0, 288));
        levels.push(Level(10, "LEVEL 2", "grad-2", 288, 652));
        levels.push(Level(50, "LEVEL 3", "grad-3", 940, 758));
        levels.push(Level(150, "LEVEL 4", "grad-4", 1698, 646));
        levels.push(Level(500, "LEVEL 5", "grad-5", 2344, 984));
        levels.push(Level(1500, "LEVEL 6", "grad-6", 3328, 817));
        levels.push(Level(3500, "LEVEL 7", "grad-7", 4145, 758));
        levels.push(Level(7500, "LEVEL 8", "grad-8", 4903, 709));
    }

    function setBaseSvgPointer(bytes memory baseImage) public onlyOwner {
        if (baseSvgPointerLocked) revert SvgAlreadySet();

        baseSvgPointer = SSTORE2.write(baseImage);
        baseSvgPointerLocked = true;
    }

    function setDefsSvgPointer(bytes memory defs) public onlyOwner {
        if (defsSvgPointerLocked) revert SvgAlreadySet();

        defsSvgPointer = SSTORE2.write(defs);
        defsSvgPointerLocked = true;
    }

    function setSpritesSvgPointer(bytes memory spriteImages) public onlyOwner {
        if (spritesSvgPointerLocked) revert SvgAlreadySet();

        spritesSvgPointer = SSTORE2.write(spriteImages);
        spritesSvgPointerLocked = true;
    }

    function mintTo(address to) external override onlyCollection {
        uint256 id = _nextTokenId();
        tokenOf[to] = id;
        _mint(to, 1);

        emit Locked(id);
    }

    function burnToken(uint256 tokenId) public {
        delete tokenOf[ownerOf(tokenId)];
        _burn(tokenId, true);
    }

    // set custom message for a token
    function setMessage(uint256 _tokenId, string calldata _message) public {
        if (ownerOf(_tokenId) != msg.sender) revert Unauthorized();
        if (bytes(_message).length > 256) revert MessageTooLong();

        messages[_tokenId] = _message;
        emit MetadataUpdate(_tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if (!_exists(tokenId)) revert URIQueryForNonexistentToken();

        uint256 tokenPoints = points(tokenId);
        LevelImageData memory level = levelData(tokenPoints);
        string memory message = tokenMessage(tokenId);

        string memory baseUrl = "data:application/json;base64,";
        return string(
            abi.encodePacked(
                baseUrl,
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '{"name":"',
                            bytes.concat(bytes(TOKEN_NAME), bytes(level.suffix)),
                            '",',
                            '"description":"',
                            message,
                            '",',
                            '"attributes":[{"trait_type":"points","max_value":',
                            _toString(level.cap),
                            ',"value":',
                            _toString(tokenPoints),
                            "}],",
                            '"image":"',
                            buildSvg(level.colorGradient, level.spriteIndex, level.spriteLength, message),
                            '"}'
                        )
                    )
                )
            )
        );
    }

    function tokenMessage(uint256 tokenId) public view returns (string memory) {
        string memory message = messages[tokenId];
        if (bytes(message).length > 0) {
            return message;
        } else {
            return DEFAULT_DESC;
        }
    }

    // construct image svg
    function buildSvg(string memory colorGradient, uint16 spriteIndex, uint16 spriteLength, string memory message)
        internal
        view
        returns (string memory)
    {
        string memory baseUrl = "data:image/svg+xml;base64,";
        bytes memory baseSvg = SSTORE2.read(baseSvgPointer);
        bytes memory spritesSvg = SSTORE2.read(spritesSvgPointer);
        bytes memory defs = SSTORE2.read(defsSvgPointer);

        return string(
            abi.encodePacked(
                baseUrl,
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 1080 1080"><path fill="rgba(255,255,255,0)" d="M0 0h1080v1080H0z" />',
                            '<path fill="url(#',
                            colorGradient,
                            ')" d="M24 40a16 16 0 0 1 16-16h1000a16 16 0 0 1 16 16v914a16 16 0 0 1-16 16H114.5a24 24 0 0 0-17.6 7.7l-59 63.4a8 8 0 0 1-13.9-5.4V40Z" />',
                            baseSvg,
                            getSpriteSubstring(spritesSvg, spriteIndex, spriteLength),
                            '<text xml:space="preserve" fill="#009DF5" font-family="Courier" font-size="24" letter-spacing="0em" style="white-space:pre"><tspan x="144" y="1044.9">',
                            message,
                            "</tspan></text>",
                            defs,
                            "</svg>"
                        )
                    )
                )
            )
        );
    }

    function getSpriteSubstring(bytes memory spritesSvg, uint16 spriteIndex, uint16 spriteLength)
        internal
        pure
        returns (bytes memory)
    {
        bytes memory sprite = new bytes(spriteLength);

        for (uint256 i = 0; i < sprite.length; i++) {
            sprite[i] = spritesSvg[i + spriteIndex];
        }

        return sprite;
    }

    // get metadata for token display based on a given points value
    function levelData(uint256 tokenPoints) internal view returns (LevelImageData memory levelImageData) {
        for (uint256 i = levels.length; i > 0;) {
            Level memory level = levels[i - 1];
            if (tokenPoints >= level.minimum) {
                if (i < levels.length) {
                    // there is at least one level above current, so get its minimum
                    Level memory nextLevel = levels[i];
                    return LevelImageData(
                        level.name, level.colorGradient, level.spriteIndex, level.spriteLength, nextLevel.minimum
                    );
                } else {
                    // highest level
                    uint256 maxPoints = IERC721A(collectionAddress).totalSupply() * 2;
                    return LevelImageData(level.name, level.colorGradient, level.spriteIndex, level.spriteLength, maxPoints);
                }
            }
            unchecked {
                --i;
            }
        }
    }

    // prevent transfer (except mint and burn)
    function _beforeTokenTransfers(address from, address to, uint256, uint256) internal pure override {
        if (from != address(0) && to != address(0)) {
            revert OnlyForYou();
        }
    }

    // add ID for associated sequential tokens to appropriate lists
    function registerTokenMovement(address from, address to, uint256 collectionTokenStartId, uint256 quantity)
        external
        override
        onlyCollection
    {
        if (from != address(0)) {
            if (to != from) {
                sentBitmap[from].setBatch(collectionTokenStartId, quantity);
            }
        }

        if (to != address(0)) {
            receivedBitmap[to].setBatch(collectionTokenStartId, quantity);
        }

        emit BatchMetadataUpdate(1, type(uint256).max);
    }

    // total points accumulated by a holder
    function points(uint256 tokenId) public view returns (uint256) {
        address owner = ownerOf(tokenId);
        uint256 max = IERC721A(collectionAddress).totalSupply() + 1;

        return receivedBitmap[owner].popCount(1, max) + sentBitmap[owner].popCount(1, max);
    }

    // convenience function to get point information in a token range
    // note that this is expensive and most likely will require multiple calls to cover large ranges.
    function tokenPointsInRange(uint256 startId, uint256 endId) public view returns (TokenPoints[] memory) {
        if (endId < startId) revert InvalidParams();

        TokenPoints[] memory tokenPoints = new TokenPoints[]((endId - startId) + 1);
        uint256 max = IERC721A(collectionAddress).totalSupply() + 1;

        uint256 pointsIndex;
        for (uint256 i = startId; i <= endId;) {
            if (_exists(i)) {
                address owner = ownerOf(i);
                uint256 totalPoints = receivedBitmap[owner].popCount(1, max) + sentBitmap[owner].popCount(1, max);

                tokenPoints[pointsIndex] = TokenPoints({id: i, owner: owner, points: totalPoints});
                ++pointsIndex;
            }
            ++i;
        }

        return tokenPoints;
    }

    // check if given address is a holder of the token
    function hasToken(address receiver) public view override returns (bool) {
        return balanceOf(receiver) > 0;
    }

    // check if given address has ever received tokenId
    function hasReceivedToken(address owner, uint256 tokenId) external view returns (bool) {
        return receivedBitmap[owner].get(tokenId);
    }

    // check if given address has ever sent tokenId
    function hasSentToken(address owner, uint256 tokenId) external view returns (bool) {
        return sentBitmap[owner].get(tokenId);
    }

    function tokenStatusMap(address owner, bool sent) external view returns (uint256[] memory received) {
        // TODO: reference max supply instead of hardcoding
        uint256 maxWordIndex = 5000 >> 8;
        uint256[] memory words = new uint256[](maxWordIndex + 1);
        for (uint256 i = 0; i <= maxWordIndex; i++) {
            words[i] = (sent ? sentBitmap[owner].map[i] : receivedBitmap[owner].map[i]);
        }
        return words;
    }

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }

    modifier onlyCollection() {
        if (msg.sender != collectionAddress) {
            revert Unauthorized();
        }
        _;
    }
}
