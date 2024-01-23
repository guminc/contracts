import { ethers } from "hardhat";
import { expect } from "chai";
import ipfsh from "ipfsh";
import { deployNonon, type NononContracts } from "../scripts/nonon/deployNonon";
import { IArchetypeNononConfig } from "../lib/types";

const CID_ZERO = "bafkreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("nonon", () => {
  let contracts: NononContracts;
  let deployer: ethers.Signer;

  const config: IArchetypeNononConfig = {
    baseUri: "ipfs://CID/",
    affiliateSigner: "0x1f285dD528cf4cDE3081C6d48D9df7A4F8FA9383",
    ownerAltPayout: ethers.constants.AddressZero,
    superAffiliatePayout: ethers.constants.AddressZero,
    friendCardAddress: ethers.constants.AddressZero,
    maxSupply: 5000,
    maxBatchSize: 5000,
    affiliateFee: 500,
    platformFee: 500,
    defaultRoyalty: 500,
    discounts: { affiliateDiscount: 0, mintTiers: [] },
  };

  beforeEach(async () => {
    contracts = await deployNonon(config);
    deployer = (await ethers.getSigners())[0];
  });

  it("can mint a nonon token to a user according to an invite list", async () => {
    await contracts.archetypeNonon.connect(deployer).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
        price: ethers.utils.parseEther("0.05"),
        start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
        end: 0,
        limit: 300,
        maxSupply: config.maxSupply,
        unitSize: 0,
        tokenAddress: ethers.constants.AddressZero,
        isBlacklist: false,
      });

    await contracts.archetypeNonon.invites(ethers.constants.HashZero);
    await sleep(2000);

    const [_, minter] = await ethers.getSigners();
    const minterAddress = await minter.getAddress();

    const mintQuantity = 2;

    await contracts.archetypeNonon
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 2, ethers.constants.AddressZero, "0x", {
        value: ethers.utils.parseEther("0.10"),
      });

    // should mint the two nonon tokens, and also the friend card as a side effect
    expect(await contracts.archetypeNonon.balanceOf(minterAddress)).to.equal(mintQuantity);
    expect(await contracts.nononFriendCard.balanceOf(minterAddress)).to.equal(1);
  });

  it('can correctly track nonon token "points" using the friend card', async () => {
    await contracts.archetypeNonon
      .connect(deployer)
      .setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
        price: ethers.utils.parseEther("0.05"),
        start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
        end: 0,
        limit: 300,
        maxSupply: config.maxSupply,
        unitSize: 0,
        tokenAddress: ethers.constants.AddressZero,
        isBlacklist: false,
      });

    const [_, minter, thirdParty] = await ethers.getSigners();
    const minterAddress = await minter.getAddress();
    const thirdPartyAddress = await thirdParty.getAddress();

    const mintQuantity = 2;
    const testTokenId = 1;

    await contracts.archetypeNonon.invites(ethers.constants.HashZero);
    await sleep(2000);

    await contracts.archetypeNonon
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 2, ethers.constants.AddressZero, "0x", {
        value: ethers.utils.parseEther("0.10"),
      });

    // should mint the two nonon tokens, and also the friend card as a side effect
    expect(await contracts.archetypeNonon.balanceOf(minterAddress)).to.equal(mintQuantity);
    expect(await contracts.nononFriendCard.balanceOf(minterAddress)).to.equal(1);

    // should have two points for minting two tokens
    const minterFriendCardTokenId = await contracts.nononFriendCard.tokenOf(minterAddress);
    expect(await contracts.nononFriendCard.points(minterFriendCardTokenId)).to.equal(2);

    // minter transfers one nonon token to another address
    await contracts.archetypeNonon
      .connect(minter)
      .transferFrom(minterAddress, thirdPartyAddress, testTokenId);

    // expect the third party to have received a friend card as a side effect of receiving a nonon
    const thirdPartyFriendCardTokenId = await contracts.nononFriendCard.tokenOf(thirdPartyAddress);
    expect(thirdPartyFriendCardTokenId).to.not.equal(0);

    // expect minter's points to have incremented by 1 for sending token id 1,
    // and the other address points to have incremented by 1 for receiving id 1
    expect(await contracts.nononFriendCard.points(minterFriendCardTokenId)).to.equal(3);
    expect(await contracts.nononFriendCard.points(thirdPartyFriendCardTokenId)).to.equal(1);

    // other address transfers same tokenId back to minter
    await contracts.archetypeNonon
      .connect(thirdParty)
      .transferFrom(thirdPartyAddress, minterAddress, testTokenId);

    // expect minter's points to not have incremented (already sent + received tokenId)
    // expect other address points to have incremented by 1, for sending tokenId
    // expect minter to still have only a single friend card (limit 1)
    expect(await contracts.nononFriendCard.points(minterFriendCardTokenId)).to.equal(3);
    expect(await contracts.nononFriendCard.points(thirdPartyFriendCardTokenId)).to.equal(2);
    expect(await contracts.nononFriendCard.balanceOf(minterAddress)).to.equal(1);
  });

  it("should reject the transfer of a friend card to a different address", async () => {
    await contracts.archetypeNonon
      .connect(deployer)
      .setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
        price: ethers.utils.parseEther("0.05"),
        start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
        end: 0,
        limit: 300,
        maxSupply: config.maxSupply,
        unitSize: 0,
        tokenAddress: ethers.constants.AddressZero,
        isBlacklist: false,
      });

    const [_, originalMinter] = await ethers.getSigners();
    const originalMinterAddress = await originalMinter.getAddress();
    const randomAddress = await ethers.Wallet.createRandom().getAddress();

    await contracts.archetypeNonon
      .connect(originalMinter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 1, ethers.constants.AddressZero, "0x", {
        value: ethers.utils.parseEther("0.05"),
      });

    const minterFriendCardId = await contracts.nononFriendCard.tokenOf(originalMinterAddress);

    expect(await contracts.nononFriendCard.name()).to.equal("NononFriendCard");

    await expect(
      contracts.nononFriendCard
        .connect(originalMinter)
        .transferFrom(originalMinterAddress, randomAddress, minterFriendCardId)
    ).to.be.reverted;
  });

  it("should return correct metadata from a tokenURI call", async () => {
    await contracts.archetypeNonon
      .connect(deployer)
      .setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
        price: ethers.utils.parseEther("0.05"),
        start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
        end: 0,
        limit: config.maxSupply,
        maxSupply: config.maxSupply,
        unitSize: 0,
        tokenAddress: ethers.constants.AddressZero,
        isBlacklist: false,
      });

    const [_, minter] = await ethers.getSigners();
    const minterAddress = await minter.getAddress();

    await contracts.archetypeNonon.connect(minter).mint(
      {
        key: ethers.constants.HashZero,
        proof: [],
      },
      1000,
      ethers.constants.AddressZero,
      "0x",
      {
        value: ethers.utils.parseEther("50"),
      }
    );

    const minterFriendCardId = await contracts.nononFriendCard.tokenOf(minterAddress);
    const base64Metadata = await contracts.nononFriendCard.tokenURI(minterFriendCardId);

    // expect that metadata has correct data identifier
    const jsonDataIdentifier = "data:application/json;base64";
    expect(base64Metadata.startsWith(jsonDataIdentifier));

    const metadataBuffer = Buffer.from(base64Metadata.slice(jsonDataIdentifier.length), "base64");
    const parsedMetadata = JSON.parse(metadataBuffer.toString("utf8"));

    // expect that metadata has correct fields
    expect(parsedMetadata).to.include.keys("name", "description", "attributes", "image");

    // expect that metadata attributes contain user points, current level maximum
    expect(parsedMetadata.attributes).to.deep.equal([
      {
        trait_type: "Points",
        max_value: 1500,
        value: 1000,
      },
      {
        trait_type: "Level",
        value: "DOMINIONS",
      },
    ]);

    // expect that the token image field is a base64 encoded SVG
    const svgDataIdentifier = "data:image/svg+xml;base64";
    expect(parsedMetadata.image.startsWith(svgDataIdentifier));
    const imageBuffer = Buffer.from(base64Metadata.slice(jsonDataIdentifier.length), "base64");
    const imageString = imageBuffer.toString("utf8");

    // NOTE: actual image composition should be tested manually
    expect(imageString.startsWith("<svg"));
    expect(imageString.endsWith("</svg>"));
  });
});
