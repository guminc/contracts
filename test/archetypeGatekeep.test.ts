import { ethers, upgrades } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  Archetype__factory,
  Archetype as IArchetype,
  ArchetypeLogic__factory,
  Archetype,
  Factory__factory,
} from "../typechain";
import { IArchetypeConfig } from "../lib/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import ipfsh from "ipfsh";
import { Contract } from "ethers";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_NAME = "Pookie";
const DEFAULT_SYMBOL = "POOKIE";
const DEFAULT_GATEKEEP_CONFIG = {
  openHour: 13,
  closeHour: 14,
  openMinute: 15,
  closeMinute: 25
};
let AFFILIATE_SIGNER: SignerWithAddress;
let DEFAULT_CONFIG: IArchetypeConfig;
// this is an IPFS content ID which stores a list of addresses ({address: string[]})
// eg: https://ipfs.io/ipfs/bafkreih2kyxirba6a6dyzt4tsdqb5iim3soprumtewq6garaohkfknqlaq
// utility for converting CID to bytes32: https://github.com/factoria-org/ipfsh

const CID_ZERO = "bafkreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const ZERO = "0x0000000000000000000000000000000000000000";

describe("Factory", function () {
  let Archetype: Archetype__factory;
  let archetype: IArchetype;
  let ArchetypeLogic: ArchetypeLogic__factory;
  let archetypeLogic: Contract;
  let Factory: Factory__factory;
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
    Archetype = await ethers.getContractFactory("Archetype", {
      libraries: {
        ArchetypeLogic: archetypeLogic.address,
      },
    });

    archetype = await Archetype.deploy();
    await archetype.deployed();

    Factory = await ethers.getContractFactory("Factory");
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
      DEFAULT_GATEKEEP_CONFIG,
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    const symbol = await nft.symbol();
    const owner = await nft.owner();

    const gatekeepConfig = await nft.gatekeepConfig();

    expect(symbol).to.equal(DEFAULT_SYMBOL);
    expect(owner).to.equal(accountOne.address);
    expect(gatekeepConfig.openHour).to.equal(DEFAULT_GATEKEEP_CONFIG.openHour);
    expect(gatekeepConfig.closeHour).to.equal(DEFAULT_GATEKEEP_CONFIG.closeHour);
    expect(gatekeepConfig.openMinute).to.equal(DEFAULT_GATEKEEP_CONFIG.openMinute);
    expect(gatekeepConfig.closeMinute).to.equal(DEFAULT_GATEKEEP_CONFIG.closeMinute);
  });

  it("should mint if public sale is set", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG,
      DEFAULT_GATEKEEP_CONFIG
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
      DEFAULT_GATEKEEP_CONFIG
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

    await expect(
      nft.connect(accountZero).transferFrom(accountZero.address, accountOne.address, 1)
    ).to.be.revertedWith("Gatekeep()");
  });

  it("should succeed to transfer inside of gatekeep window", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG,
      DEFAULT_GATEKEEP_CONFIG
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
    const date = new Date();

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
      DEFAULT_GATEKEEP_CONFIG
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
    const date = new Date();

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

    await nft.connect(owner).setGatekeep(5, 6, 5, 10);

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
      DEFAULT_GATEKEEP_CONFIG
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
    const date = new Date();

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

    await nft.connect(owner).setGatekeep(19, 20, 20, 25);

    // Create a new Date object for the current UTC date and time
    const date2 = new Date();

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
