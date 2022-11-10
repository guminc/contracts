import { ethers, upgrades } from "hardhat";

import { expect } from "chai";
import { ArchetypeAirDrop__factory, ArchetypeAirDrop as IArchetype, Factory__factory } from "../typechain";
import Invitelist from "../lib/invitelist";
import { IArchetypeConfig } from "../lib/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import ipfsh from "ipfsh";
import { Contract } from "ethers";

const DEFAULT_NAME = "Pookie";
const DEFAULT_SYMBOL = "POOKIE";
let AFFILIATE_SIGNER: SignerWithAddress;
let DEFAULT_CONFIG: IArchetypeConfig;
// this is an IPFS content ID which stores a list of addresses ({address: string[]})
// eg: https://ipfs.io/ipfs/bafkreih2kyxirba6a6dyzt4tsdqb5iim3soprumtewq6garaohkfknqlaq
// utility for converting CID to bytes32: https://github.com/factoria-org/ipfsh
const CID_DEFAULT = "Qmbro8pnECVvjwWH6J9KyFXR8isquPFNgbUiHDGXhYnmFn";

const CID_ZERO = "bafkreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const ZERO = "0x0000000000000000000000000000000000000000";
const BURN = "0x000000000000000000000000000000000000dEaD";

describe("Factory", function () {
  let Archetype: ArchetypeAirDrop__factory;
  let archetype: IArchetype;
  let Factory: Factory__factory;
  let factory: Contract;

  before(async function () {
    AFFILIATE_SIGNER = (await ethers.getSigners())[4]; // account[4]
    DEFAULT_CONFIG = {
      unrevealedUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
      baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
      affiliateSigner: AFFILIATE_SIGNER.address,
      ownerAltPayout: ZERO,
      superAffiliatePayout: ZERO,
      maxSupply: 5000,
      maxBatchSize: 20,
      affiliateFee: 1500,
      platformFee: 500,
      discounts: {
        affiliateDiscount: 0,
        mintTiers: [],
        // [{
        //   numMints: number;
        //   mintDiscount: number;
        // }];
      },
    };

    Archetype = await ethers.getContractFactory("ArchetypeAirDrop");

    archetype = await Archetype.deploy();

    await archetype.deployed();

    Factory = await ethers.getContractFactory("Factory");

    factory = await upgrades.deployProxy(Factory, [archetype.address], {
      initializer: "initialize",
    });

    await factory.deployed();

    console.log({ factoryAddress: factory.address, archetypeAddress: archetype.address });
  });

  it("should create a collection", async function () {
    const [_, accountOne] = await ethers.getSigners();

    const newCollection = await factory.createCollection(
      accountOne.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const NFT = await ethers.getContractFactory("ArchetypeAirDrop");

    const nft = NFT.attach(newCollectionAddress);

    const symbol = await nft.symbol();
    const owner = await nft.owner();

    expect(symbol).to.equal(DEFAULT_SYMBOL);
    expect(owner).to.equal(accountOne.address);
  });

  it("should initialize once and continue to work after initialized", async function () {
    const res = await archetype.initialize("Flookie", DEFAULT_SYMBOL, DEFAULT_CONFIG);
    await res.wait();

    expect(await archetype.name()).to.equal("Flookie");

    await expect(archetype.initialize("Wookie", DEFAULT_SYMBOL, DEFAULT_CONFIG)).to.be.revertedWith(
      "Initializable: contract is already initialized"
    );

    const [_, accountOne] = await ethers.getSigners();

    const newCollection = await factory.createCollection(
      accountOne.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const NFT = await ethers.getContractFactory("ArchetypeAirDrop");

    const nft = NFT.attach(newCollectionAddress);

    const symbol = await nft.symbol();
    const owner = await nft.owner();

    expect(symbol).to.equal(DEFAULT_SYMBOL);
    expect(owner).to.equal(accountOne.address);
  });

  it("should air drop tokens on launch", async function () {
    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();

    const owner = accountOne;
    const minter = accountZero;
    const airDropReceiver = accountTwo;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const NFT = await ethers.getContractFactory("ArchetypeAirDrop");

    const nft = NFT.attach(newCollectionAddress);

    expect(await nft.ownerOf(1)).to.equal('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    expect(await nft.ownerOf(20)).to.equal('0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199');

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.00"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 300,
    });

    await nft.connect(minter).mint({ key: ethers.constants.HashZero, proof: [] }, 5, ZERO, "0x", {
      value: ethers.utils.parseEther("0.00"),
    });

    expect(await nft.ownerOf(21)).to.equal(minter.address);
    expect(await nft.ownerOf(25)).to.equal(minter.address);
    expect(await nft.balanceOf(minter.address)).to.equal(5);

    // try transfer pre and post airdrop tokens
    await nft.connect(airDropReceiver).transferFrom(airDropReceiver.address, minter.address, 3);
    await nft.connect(minter).transferFrom(minter.address, airDropReceiver.address, 23);


    expect(await nft.ownerOf(3)).to.equal(minter.address);
    expect(await nft.ownerOf(23)).to.equal(airDropReceiver.address);

  });
});

// todo: add test to ensure affiliate signer can't be zero address

// const _accounts = [
//   "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
//   "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
//   "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
//   "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
//   "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
//   "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
//   "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
//   "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
//   "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
//   "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
//   "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
//   "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
//   "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
//   "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
//   "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
//   "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
//   "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
//   "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
//   "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
//   "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
// ];
