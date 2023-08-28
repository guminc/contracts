import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { 
    ArchetypeGatekeep__factory, 
    ArchetypeGatekeep as IArchetype,
    ArchetypeLogic__factory,
    ArchetypeGatekeep,
    FactoryGatekeep__factory, 
} from "../typechain";
import { IArchetypeConfig } from "../lib/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import ipfsh from "ipfsh";
import { Contract } from "ethers";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_NAME = "Pookie";
const DEFAULT_SYMBOL = "POOKIE";
const DEFAULT_HOUR = 13;
const DEFAULT_OPEN_MINUTE = 15;
const DEFAULT_CLOSE_MINUTE = 25;
let AFFILIATE_SIGNER: SignerWithAddress;
let DEFAULT_CONFIG: IArchetypeConfig;
// this is an IPFS content ID which stores a list of addresses ({address: string[]})
// eg: https://ipfs.io/ipfs/bafkreih2kyxirba6a6dyzt4tsdqb5iim3soprumtewq6garaohkfknqlaq
// utility for converting CID to bytes32: https://github.com/factoria-org/ipfsh

const CID_ZERO = "bafkreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const ZERO = "0x0000000000000000000000000000000000000000";

describe("FactoryGatekeep", function () {
    let Archetype: ArchetypeGatekeep__factory;
    let archetype: IArchetype;
    let ArchetypeLogic: ArchetypeLogic__factory;
    let archetypeLogic: Contract;
    let Factory: FactoryGatekeep__factory;
    let factory: Contract;

    before(async function () {
    AFFILIATE_SIGNER = (await ethers.getSigners())[4]; // account[4]
    DEFAULT_CONFIG = {
      baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
      affiliateSigner: AFFILIATE_SIGNER.address,
      ownerAltPayout: ZERO,
      superAffiliatePayout: ZERO,
      maxSupply: 5000,
      maxBatchSize: 20,
      affiliateFee: 1500,
      platformFee: 500,
      defaultRoyalty: 500,
      discounts: {
        affiliateDiscount: 0,
        mintTiers: [],
        // [{
        //   numMints: number;
        //   mintDiscount: number;
        // }];
      },
    };

    ArchetypeLogic = await ethers.getContractFactory("ArchetypeLogic");
    archetypeLogic = await ArchetypeLogic.deploy();
    Archetype = await ethers.getContractFactory("ArchetypeGatekeep", {
      libraries: {
        ArchetypeLogic: archetypeLogic.address,
      },
    });

    archetype = await Archetype.deploy();
    await archetype.deployed();

    Factory = await ethers.getContractFactory("FactoryGatekeep");
    factory = await upgrades.deployProxy(Factory, [archetype.address], {
      initializer: "initialize",
    });
    await factory.deployed();

    console.log({ factoryAddress: factory.address, archetypeAddress: archetype.address });
  });

  it("should have platform set to test account", async function () {
    const [_, _accountOne, accountTwo] = await ethers.getSigners();

    const contractPlatform = await archetype.platform();

    console.log({ accountTwo, contractPlatform });

    expect(accountTwo.address).to.equal(contractPlatform);
  });

  it("should create a collection", async function () {
    const [_, accountOne] = await ethers.getSigners();

    const newCollection = await factory.createCollection(
      accountOne.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG,
      DEFAULT_HOUR,
      DEFAULT_OPEN_MINUTE,
      DEFAULT_CLOSE_MINUTE,
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    const symbol = await nft.symbol();
    const owner = await nft.owner();
    const hour = await nft.HOUR();
    const openMinute = await nft.OPEN_MINUTE();
    const closeMinute = await nft.CLOSE_MINUTE();

    expect(symbol).to.equal(DEFAULT_SYMBOL);
    expect(owner).to.equal(accountOne.address);
    expect(hour).to.equal(DEFAULT_HOUR);
    expect(openMinute).to.equal(DEFAULT_OPEN_MINUTE);
    expect(closeMinute).to.equal(DEFAULT_CLOSE_MINUTE);
  });

  it("should mint if public sale is set", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG,
      DEFAULT_HOUR,
      DEFAULT_OPEN_MINUTE,
      DEFAULT_CLOSE_MINUTE,
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 300,
      maxSupply: DEFAULT_CONFIG.maxSupply,
      unitSize: 0,
      tokenAddress: ZERO,
    });

    const invites = await nft.invites(ethers.constants.HashZero);

    console.log({ invites });

    await sleep(1000);

    console.log("current time", Math.floor(Date.now() / 1000));

    await nft.mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
      value: ethers.utils.parseEther("0.08"),
    });

    expect(await nft.balanceOf(accountZero.address)).to.equal(1);
  });

  it("should fail to transfer outside of gatekeep window", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG,
      DEFAULT_HOUR,
      DEFAULT_OPEN_MINUTE,
      DEFAULT_CLOSE_MINUTE
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 300,
      maxSupply: DEFAULT_CONFIG.maxSupply,
      unitSize: 0,
      tokenAddress: ZERO,
    });

    const invites = await nft.invites(ethers.constants.HashZero);

    console.log({ invites });

    await sleep(1000);

    console.log("current time", Math.floor(Date.now() / 1000));

    await nft.mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
      value: ethers.utils.parseEther("0.08"),
    });

    expect(await nft.balanceOf(accountZero.address)).to.equal(1);

    await expect(nft.connect(accountZero).transferFrom(accountZero.address, accountOne.address, 1)).to.be.revertedWith(
      "Gatekeep()"
    );
  });

  it("should succeed to transfer inside of gatekeep window", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG,
      DEFAULT_HOUR,
      DEFAULT_OPEN_MINUTE,
      DEFAULT_CLOSE_MINUTE
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 300,
      maxSupply: DEFAULT_CONFIG.maxSupply,
      unitSize: 0,
      tokenAddress: ZERO,
    });

    const invites = await nft.invites(ethers.constants.HashZero);

    console.log({ invites });

    await sleep(1000);

    console.log("current time", Math.floor(Date.now() / 1000));

    await nft.mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
      value: ethers.utils.parseEther("0.08"),
    });

    expect(await nft.balanceOf(accountZero.address)).to.equal(1);

    // set approval for all
    await nft.connect(accountZero).setApprovalForAll(accountOne.address, true);

    // Create a new Date object for the current UTC date and time
    let date = new Date();

    // Set the UTC hours to 1 and the UTC minutes to 20
    date.setUTCHours(1, 20, 0, 0); // This sets hours, minutes, seconds, and milliseconds

    // Add one day to the UTC date
    date.setUTCDate(date.getUTCDate() + 1);

    // Get the timestamp
    const timestamp = date.getTime();

    console.log(timestamp);

    await time.increaseTo(timestamp);

    await nft.connect(accountZero).transferFrom(accountZero.address, accountOne.address, 1);

    expect(await nft.balanceOf(accountOne.address)).to.equal(1);
  });

  it("should fail to transfer outside of updated gatekeep window", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG,
      DEFAULT_HOUR,
      DEFAULT_OPEN_MINUTE,
      DEFAULT_CLOSE_MINUTE
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 300,
      maxSupply: DEFAULT_CONFIG.maxSupply,
      unitSize: 0,
      tokenAddress: ZERO,
    });

    const invites = await nft.invites(ethers.constants.HashZero);

    console.log({ invites });

    await sleep(1000);

    console.log("current time", Math.floor(Date.now() / 1000));

    await nft.mint({ key: ethers.constants.HashZero, proof: [] }, 2, ZERO, "0x", {
      value: ethers.utils.parseEther("0.16"),
    });

    expect(await nft.balanceOf(accountZero.address)).to.equal(2);

    // set approval for all
    await nft.connect(accountZero).setApprovalForAll(accountOne.address, true);

    // Create a new Date object for the current UTC date and time
    let date = new Date();

    // Set the UTC hours to 1 and the UTC minutes to 20
    date.setUTCHours(1, 20, 0, 0); // This sets hours, minutes, seconds, and milliseconds

    // Add one day to the UTC date
    date.setUTCDate(date.getUTCDate() + 2);

    // Get the timestamp
    const timestamp = date.getTime();

    console.log(timestamp);

    await time.increaseTo(timestamp);

    await nft.connect(accountZero).transferFrom(accountZero.address, accountOne.address, 1);

    expect(await nft.balanceOf(accountOne.address)).to.equal(1);

    await nft.connect(owner).setGatekeep(5, 5, 10);

    await expect(
      nft.connect(accountZero).transferFrom(accountZero.address, accountOne.address, 1)
    ).to.be.revertedWith("Gatekeep()");

    expect(await nft.balanceOf(accountZero.address)).to.equal(1);
  });

  it("should succeed to transfer inside of updated gatekeep window", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG,
      DEFAULT_HOUR,
      DEFAULT_OPEN_MINUTE,
      DEFAULT_CLOSE_MINUTE
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 300,
      maxSupply: DEFAULT_CONFIG.maxSupply,
      unitSize: 0,
      tokenAddress: ZERO,
    });

    const invites = await nft.invites(ethers.constants.HashZero);

    console.log({ invites });

    await sleep(1000);

    console.log("current time", Math.floor(Date.now() / 1000));

    await nft.mint({ key: ethers.constants.HashZero, proof: [] }, 2, ZERO, "0x", {
      value: ethers.utils.parseEther("0.16"),
    });

    expect(await nft.balanceOf(accountZero.address)).to.equal(2);

    // set approval for all
    await nft.connect(accountZero).setApprovalForAll(accountOne.address, true);

    // Create a new Date object for the current UTC date and time
    let date = new Date();

    // Set the UTC hours to 1 and the UTC minutes to 20
    date.setUTCHours(1, 20, 0, 0); // This sets hours, minutes, seconds, and milliseconds

    // Add one day to the UTC date
    date.setUTCDate(date.getUTCDate() + 3);

    // Get the timestamp
    const timestamp = date.getTime();

    console.log(timestamp);

    await time.increaseTo(timestamp);

    await nft.connect(accountZero).transferFrom(accountZero.address, accountOne.address, 1);

    expect(await nft.balanceOf(accountOne.address)).to.equal(1);

    await nft.connect(owner).setGatekeep(19, 20, 25);

    // Create a new Date object for the current UTC date and time
    let date2 = new Date();

    // Set the UTC hours to 1 and the UTC minutes to 20
    date2.setUTCHours(5, 5, 0, 0); // This sets hours, minutes, seconds, and milliseconds

    // Add one day to the UTC date
    date2.setUTCDate(date2.getUTCDate() + 4);

    // Get the timestamp
    const timestamp2 = date2.getTime();

    console.log(timestamp2);

    await time.increaseTo(timestamp2);

    await nft.connect(accountZero).transferFrom(accountZero.address, accountOne.address, 2);

    expect(await nft.balanceOf(accountZero.address)).to.equal(0);
    expect(await nft.balanceOf(accountOne.address)).to.equal(2);
  });

});