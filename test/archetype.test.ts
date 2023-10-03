import { ethers, upgrades } from "hardhat";

import { expect } from "chai";
import {
  Archetype__factory,
  Archetype as IArchetype,
  ArchetypeLogic__factory,
  ArchetypeBatch__factory,
  Factory__factory,
  VRFCoordinatorV2Mock__factory,
} from "../typechain";
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
const HASHONE = "0x0000000000000000000000000000000000000000000000000000000000000001";
const HASH256 = "0x00000000000000000000000000000000000000000000000000000000000000ff";

const generateTokenPool = (x: number): number[] =>
  [].concat(...[1, 2, 3, 4, 5].map(i => Array(x / 5).fill(i)));

describe("Factory", function () {
  let Archetype: Archetype__factory;
  let archetype: IArchetype;
  let ArchetypeLogic: ArchetypeLogic__factory;
  let archetypeLogic: Contract;
  let ArchetypeBatch: ArchetypeBatch__factory;
  let archetypeBatch: Contract;
  let Factory: Factory__factory;
  let factory: Contract;
  let VrfCoordinatorMock: VRFCoordinatorV2Mock__factory;
  let vrfCoordinatorMock: Contract;

  before(async function () {
    AFFILIATE_SIGNER = (await ethers.getSigners())[4]; // account[4]
    DEFAULT_CONFIG = {
      baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
      affiliateSigner: AFFILIATE_SIGNER.address,
      ownerAltPayout: ZERO,
      superAffiliatePayout: ZERO,
      maxSupply: 50,
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
      tokenPool: generateTokenPool(50),
    };

    ArchetypeBatch = await ethers.getContractFactory("ArchetypeBatch");
    archetypeBatch = await ArchetypeBatch.deploy();

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

    VrfCoordinatorMock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
    vrfCoordinatorMock = await VrfCoordinatorMock.deploy(1, 1);

    console.log({ vrfCoordinator: vrfCoordinatorMock.address });
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
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    const symbol = await nft.symbol();
    const owner = await nft.owner();

    expect(symbol).to.equal(DEFAULT_SYMBOL);
    expect(owner).to.equal(accountOne.address);
  });

  it("should initialize once and continue to work after initialized", async function () {
    const [_, accountOne] = await ethers.getSigners();

    const res = await archetype.initialize(
      "Flookie",
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG,
      accountOne.address
    );
    await res.wait();

    expect(await archetype.name()).to.equal("Flookie");

    await expect(
      archetype.initialize("Wookie", DEFAULT_SYMBOL, DEFAULT_CONFIG, accountOne.address)
    ).to.be.revertedWith("Initializable: contract is already initialized");

    const newCollection = await factory.createCollection(
      accountOne.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    const symbol = await nft.symbol();
    const owner = await nft.owner();

    expect(symbol).to.equal(DEFAULT_SYMBOL);
    expect(owner).to.equal(accountOne.address);
  });

  it("should let you change the archetype implementation", async function () {
    const [_, accountOne] = await ethers.getSigners();

    const newCollection = await factory.createCollection(
      accountOne.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    const symbol = await nft.symbol();
    const owner = await nft.owner();

    expect(symbol).to.equal(DEFAULT_SYMBOL);
    expect(owner).to.equal(accountOne.address);

    ArchetypeLogic = await ethers.getContractFactory("ArchetypeLogic");
    archetypeLogic = await ArchetypeLogic.deploy();
    const NewArchetype = await ethers.getContractFactory("Archetype", {
      libraries: {
        ArchetypeLogic: archetypeLogic.address,
      },
    });

    // const archetype = await upgrades.deployProxy(Archetype, []);

    const newArchetype = await NewArchetype.deploy();

    await newArchetype.deployed();

    await factory.setArchetype(newArchetype.address);

    const myArchetype = await factory.archetype();

    expect(myArchetype).to.equal(newArchetype.address);

    const anotherCollection = await factory.createCollection(
      accountOne.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result1 = await anotherCollection.wait();

    const anotherollectionAddress = result1.events[0].address || "";

    const nft1 = Archetype.attach(anotherollectionAddress);

    const symbol1 = await nft1.symbol();
    const owner1 = await nft1.owner();

    expect(symbol1).to.equal(DEFAULT_SYMBOL);
    expect(owner1).to.equal(accountOne.address);
  });

  it("should fail if owner method called by non-owner", async function () {
    const [_, accountOne] = await ethers.getSigners();

    const newCollection = await factory.createCollection(
      accountOne.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await expect(nft.lockURI("forever")).to.be.revertedWith("NotOwner");
  });

  it("should mint if public sale is set", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000) - 60), // one minute ago
      end: 0,
      limit: 300,
      unitSize: 0,
      tokenIdsExcluded: [],
      maxSupply: 500,
      tokenAddress: ZERO,
    });

    const invites = await nft.invites(ethers.constants.HashZero);

    console.log({ invites });

    console.log("current time", Math.floor(Date.now() / 1000));

    await nft.mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
      value: ethers.utils.parseEther("0.08"),
    });

    expect(await nft.totalSupply()).to.equal(1);
  });

  it("should mint if user is on valid list, throw appropriate errors otherwise", async function () {
    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();

    const owner = accountOne;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    const addresses = [accountZero.address, accountOne.address];
    // const addresses = [...Array(5000).keys()].map(() => accountZero.address);

    const invitelist = new Invitelist(addresses);

    const root = invitelist.root();
    const proof = invitelist.proof(accountZero.address);

    const price = ethers.utils.parseEther("0.08");

    const today = new Date();
    const tomorrow = today.setDate(today.getDate() + 1);
    const yesterday = today.setDate(today.getDate() + -1);

    console.log({ toda: Math.floor(Date.now() / 1000) });
    console.log({ tomo: Math.floor(tomorrow / 1000) });

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: ethers.BigNumber.from(Math.floor(tomorrow / 1000)),
      end: 0,
      limit: 1000,
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });
    await nft.connect(owner).setInvite(root, ipfsh.ctod(CID_DEFAULT), {
      price: price,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 10,
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    const invitePrivate = await nft.invites(root);
    const invitePublic = await nft.invites(ethers.constants.HashZero);

    console.log({ invitePrivate, invitePublic });

    // whitelisted wallet
    await expect(
      nft.mint({ key: root, proof: proof }, 1, ZERO, "0x", {
        value: ethers.utils.parseEther("0.07"),
      })
    ).to.be.revertedWith("InsufficientEthSent");

    await expect(
      nft.mint({ key: root, proof: proof }, 1, ZERO, "0x", {
        value: ethers.utils.parseEther("0.09"),
      })
    ).to.be.revertedWith("ExcessiveEthSent");

    await nft.mint({ key: root, proof: proof }, 1, ZERO, "0x", {
      value: price,
    });

    await nft.mint({ key: root, proof: proof }, 5, ZERO, "0x", {
      value: price.mul(5),
    });

    expect(await nft.totalSupply()).to.equal(6);

    const proofTwo = invitelist.proof(accountTwo.address);

    // non-whitelisted wallet
    // private mint rejection
    await expect(
      nft.connect(accountTwo).mint({ key: root, proof: proofTwo }, 2, ZERO, "0x", {
        value: price.mul(2),
      })
    ).to.be.revertedWith("WalletUnauthorizedToMint");

    // public mint rejection
    await expect(
      nft.connect(accountTwo).mint({ key: ethers.constants.HashZero, proof: [] }, 2, ZERO, "0x", {
        value: price.mul(2),
      })
    ).to.be.revertedWith("MintNotYetStarted");

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: 0,
      end: ethers.BigNumber.from(Math.floor(yesterday / 1000)),
      limit: 1000,
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // ended list rejectiong
    await expect(
      nft.connect(accountTwo).mint({ key: ethers.constants.HashZero, proof: [] }, 2, ZERO, "0x", {
        value: price.mul(2),
      })
    ).to.be.revertedWith("MintEnded");

    expect(await nft.balanceOf(accountTwo.address, 1)).to.equal(0);
  });

  it("should fail to mint if public limit is 0", async function () {
    const [_, accountOne] = await ethers.getSigners();

    const owner = accountOne;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 0,
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    const invites = await nft.invites(ethers.constants.HashZero);

    console.log({ invites });

    await expect(
      nft.mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
        value: ethers.utils.parseEther("0.08"),
      })
    ).to.be.revertedWith("MintingPaused");
  });

  // reminder: If this test is failing with BalanceEmpty() errors, first ensure
  // that the PLATFORM constant in Archetype.sol is set to local Hardhat network
  // account[2]
  it("should validate affiliate signatures and withdraw to correct account", async function () {
    const [accountZero, accountOne, accountTwo, accountThree] = await ethers.getSigners();

    const owner = accountOne;
    const platform = accountTwo;
    const affiliate = accountThree;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 300,
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // test invalid signature
    const invalidReferral = await accountZero.signMessage(
      ethers.utils.arrayify(ethers.utils.solidityKeccak256(["address"], [affiliate.address]))
    );

    await expect(
      nft
        .connect(accountZero)
        .mint(
          { key: ethers.constants.HashZero, proof: [] },
          1,
          affiliate.address,
          invalidReferral,
          {
            value: ethers.utils.parseEther("0.08"),
          }
        )
    ).to.be.revertedWith("InvalidSignature()");

    // valid signature (from affiliateSigner)
    const referral = await AFFILIATE_SIGNER.signMessage(
      ethers.utils.arrayify(ethers.utils.solidityKeccak256(["address"], [affiliate.address]))
    );

    await nft
      .connect(accountZero)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 1, affiliate.address, referral, {
        value: ethers.utils.parseEther("0.08"),
      });

    await expect((await nft.ownerBalance()).owner).to.equal(ethers.utils.parseEther("0.064")); // 80%
    await expect((await nft.ownerBalance()).platform).to.equal(ethers.utils.parseEther("0.004")); // 5%
    await expect(await nft.affiliateBalance(affiliate.address)).to.equal(
      ethers.utils.parseEther("0.012")
    ); // 15%

    // todo: test withdraw failure
    // let balance = (await ethers.provider.getBalance(owner.address));
    // await nft.connect(owner).withdraw();
    // let diff = (await ethers.provider.getBalance(owner.address)).toBigInt() - balance.toBigInt();
    // expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0")));

    // withdraw owner balance
    let balance = await ethers.provider.getBalance(owner.address);
    await nft.connect(owner).withdraw();
    let diff = (await ethers.provider.getBalance(owner.address)).toBigInt() - balance.toBigInt();
    // withdrawal won't be exact due to gas payment, just check range.
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.062")));
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.064")));

    // mint again
    await nft
      .connect(accountZero)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 1, affiliate.address, referral, {
        value: ethers.utils.parseEther("0.08"),
      });

    await expect((await nft.ownerBalance()).owner).to.equal(ethers.utils.parseEther("0.064"));
    await expect((await nft.ownerBalance()).platform).to.equal(ethers.utils.parseEther("0.008")); // 5% x 2 mints
    await expect(await nft.affiliateBalance(affiliate.address)).to.equal(
      ethers.utils.parseEther("0.024")
    ); // 15% x 2 mints

    // withdraw owner balance again
    balance = await ethers.provider.getBalance(owner.address);
    await nft.connect(owner).withdraw();
    diff = (await ethers.provider.getBalance(owner.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.062"))); // leave room for gas
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.064")));

    // withdraw platform balance
    balance = await ethers.provider.getBalance(platform.address);
    await nft.connect(platform).withdraw(); // partial withdraw
    diff = (await ethers.provider.getBalance(platform.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.007")));
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.008")));

    // withdraw affiliate balance
    balance = await ethers.provider.getBalance(affiliate.address);
    await nft.connect(affiliate).withdraw();
    diff = (await ethers.provider.getBalance(affiliate.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.020")));
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.024")));

    // withdraw empty owner balance
    await expect(nft.connect(owner).withdraw()).to.be.revertedWith("BalanceEmpty");

    // withdraw empty affiliate balance
    await expect(nft.connect(affiliate).withdraw()).to.be.revertedWith("BalanceEmpty");

    // withdraw unused affiliate balance
    await expect(nft.connect(accountThree).withdraw()).to.be.revertedWith("BalanceEmpty");
  });

  it("should set correct discounts - mint tiers and affiliate", async function () {
    const [accountZero, accountOne, accountTwo, accountThree] = await ethers.getSigners();

    const owner = accountOne;
    const platform = accountTwo;
    const affiliate = accountThree;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      // set config that has affiliate and mint tiers
      {
        baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
        affiliateSigner: AFFILIATE_SIGNER.address,
        ownerAltPayout: ZERO,
        superAffiliatePayout: ZERO,
        maxSupply: 50,
        tokenPool: generateTokenPool(50),
        maxBatchSize: 20,
        affiliateFee: 1500,
        platformFee: 500,
        defaultRoyalty: 500,
        discounts: {
          affiliateDiscount: 1000, // 10%
          mintTiers: [
            {
              numMints: 100,
              mintDiscount: 2000, // 20%
            },
            {
              numMints: 20,
              mintDiscount: 1000, // 10%
            },
            {
              numMints: 5,
              mintDiscount: 500, // 5%
            },
          ],
        },
      }
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 300,
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // valid signature (from affiliateSigner)
    const referral = await AFFILIATE_SIGNER.signMessage(
      ethers.utils.arrayify(ethers.utils.solidityKeccak256(["address"], [affiliate.address]))
    );

    await nft
      .connect(accountZero)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 1, affiliate.address, referral, {
        value: ethers.utils.parseEther("0.09"), // 10 % discount from using an affiliate = 0.9
      });

    await expect((await nft.ownerBalance()).owner).to.equal(ethers.utils.parseEther("0.072")); // 80%
    await expect((await nft.ownerBalance()).platform).to.equal(ethers.utils.parseEther("0.0045")); // 5%
    await expect(await nft.affiliateBalance(affiliate.address)).to.equal(
      ethers.utils.parseEther("0.0135")
    ); // 15%

    // reset balances by withdrawing
    await nft.connect(owner).withdraw();
    await nft.connect(platform).withdraw();
    await nft.connect(affiliate).withdraw();

    await nft
      .connect(accountZero)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 20, affiliate.address, referral, {
        value: ethers.utils.parseEther((0.081 * 20).toString()), // 10 % discount from using an affiliate, additional 10% for minting 20 = 0.081 per
      });

    await expect(await nft.computePrice(ethers.constants.HashZero, 20, true)).to.equal(
      ethers.utils.parseEther((0.081 * 20).toString())
    );

    await expect((await nft.ownerBalance()).owner).to.equal(ethers.utils.parseEther("1.296")); // 80%
    await expect((await nft.ownerBalance()).platform).to.equal(ethers.utils.parseEther("0.081")); // 5%
    await expect(await nft.affiliateBalance(affiliate.address)).to.equal(
      ethers.utils.parseEther("0.243")
    ); // 15%
  });

  it("should withdraw and credit correct amount - super affiliate", async function () {
    const [accountZero, accountOne, accountTwo, accountThree, accountFour] =
      await ethers.getSigners();

    const owner = accountOne;
    const platform = accountTwo;
    const affiliate = accountThree;
    const superAffiliate = accountFour;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      // set config that has super affiliate set
      {
        baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
        affiliateSigner: AFFILIATE_SIGNER.address,
        ownerAltPayout: ZERO,
        superAffiliatePayout: superAffiliate.address,
        maxSupply: 50,
        tokenPool: generateTokenPool(50),
        maxBatchSize: 20,
        affiliateFee: 1500,
        platformFee: 500,
        defaultRoyalty: 500,
        discounts: {
          affiliateDiscount: 0, // 10%
          mintTiers: [],
        },
      }
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 300,
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // valid signature (from affiliateSigner)
    const referral = await AFFILIATE_SIGNER.signMessage(
      ethers.utils.arrayify(ethers.utils.solidityKeccak256(["address"], [affiliate.address]))
    );

    await nft
      .connect(accountZero)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 1, affiliate.address, referral, {
        value: ethers.utils.parseEther("0.1"),
      });

    await expect((await nft.ownerBalance()).owner).to.equal(ethers.utils.parseEther("0.08")); // 80%
    await expect((await nft.ownerBalance()).platform).to.equal(ethers.utils.parseEther("0.0025")); // 2.5%
    await expect(await nft.affiliateBalance(superAffiliate.address)).to.equal(
      ethers.utils.parseEther("0.0025")
    ); // 2.5%
    await expect(await nft.affiliateBalance(affiliate.address)).to.equal(
      ethers.utils.parseEther("0.015")
    ); // 15%

    // withdraw owner balance
    let balance = await ethers.provider.getBalance(owner.address);
    await nft.connect(owner).withdraw();
    let diff = (await ethers.provider.getBalance(owner.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.078"))); // leave room for gas
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.08")));

    // withdraw platform balance
    balance = await ethers.provider.getBalance(platform.address);
    await nft.connect(platform).withdraw(); // partial withdraw
    diff = (await ethers.provider.getBalance(platform.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.0023")));
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.0025")));

    // withdraw super affiliate balance
    balance = await ethers.provider.getBalance(superAffiliate.address);
    await nft.connect(superAffiliate).withdraw(); // partial withdraw
    diff =
      (await ethers.provider.getBalance(superAffiliate.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.0023")));
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.0025")));

    // withdraw affiliate balance
    balance = await ethers.provider.getBalance(affiliate.address);
    await nft.connect(affiliate).withdraw();
    diff = (await ethers.provider.getBalance(affiliate.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.014")));
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.015")));
  });

  it("should withdraw to alt owner address", async function () {
    const [accountZero, accountOne, accountFour] = await ethers.getSigners();

    const owner = accountOne;
    const ownerAltPayout = accountFour;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      // set config that has alt owner payout
      {
        baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
        affiliateSigner: AFFILIATE_SIGNER.address,
        ownerAltPayout: ownerAltPayout.address,
        superAffiliatePayout: ZERO,
        maxSupply: 50,
        tokenPool: generateTokenPool(50),
        maxBatchSize: 20,
        affiliateFee: 1500,
        platformFee: 500,
        defaultRoyalty: 500,
        discounts: {
          affiliateDiscount: 0, // 10%
          mintTiers: [],
        },
      }
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 300,
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    await nft
      .connect(accountZero)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
        value: ethers.utils.parseEther("0.1"),
      });

    await expect((await nft.ownerBalance()).owner).to.equal(ethers.utils.parseEther("0.095")); // 95%
    await expect((await nft.ownerBalance()).platform).to.equal(ethers.utils.parseEther("0.005")); // 5%

    // first scenario - owner withdraws to alt payout.

    let balance = await ethers.provider.getBalance(ownerAltPayout.address);
    await nft.connect(owner).withdraw();
    // check that eth was sent to alt address
    let diff =
      (await ethers.provider.getBalance(ownerAltPayout.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.094"))); // leave room for gas
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.095")));

    await nft
      .connect(accountZero)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
        value: ethers.utils.parseEther("0.1"),
      });

    // second scenario - owner alt withdraws to himself.

    balance = await ethers.provider.getBalance(ownerAltPayout.address);
    await nft.connect(ownerAltPayout).withdraw();
    // check that eth was sent to alt address
    diff =
      (await ethers.provider.getBalance(ownerAltPayout.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.094"))); // leave room for gas
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.095")));
  });

  // it("allow token owner to store msg", async function () {
  //   const [accountZero, accountOne] = await ethers.getSigners();

  //   const owner = accountOne;
  //   const holder = accountZero;

  //   const newCollection = await factory.createCollection(
  //     owner.address,
  //     DEFAULT_NAME,
  //     DEFAULT_SYMBOL,
  //     DEFAULT_CONFIG
  //   );

  //   const result = await newCollection.wait();

  //   const newCollectionAddress = result.events[0].address || "";

  //   const nft = Archetype.attach(newCollectionAddress);

  //   await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
  //     price: ethers.utils.parseEther("0.02"),
  //     start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
  //     limit: 300,
  //     maxSupply: 5000,
  //     randomize: true,
  //     tokenIdsExcluded: [1,2,3,4,5],
  //     tokenAddress: ZERO,
  //   });

  //   // mint tokens 1, 2, 3
  //   await nft.connect(holder).mint({ key: ethers.constants.HashZero, proof: [] }, 3, ZERO, "0x", {
  //     value: ethers.utils.parseEther("0.06"),
  //   });

  //   const msg = "Hi this is a test, I own this";

  //   // try to set as non token owner - will fail
  //   await expect(nft.connect(owner).setTokenMsg(3, msg)).to.be.revertedWith("NotTokenOwner");

  //   // try to set as token owner - will succeed
  //   await nft.connect(holder).setTokenMsg(3, msg + msg + msg + msg + msg);

  //   // try to set as token owner - will succeed
  //   await nft.connect(holder).setTokenMsg(3, msg);

  //   // check that msgs match
  //   await expect(await nft.getTokenMsg(3)).to.be.equal(msg);
  // });

  it("test config changes and locking", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;
    const alt = accountZero;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    // CHANGE URI
    await nft.connect(owner).setBaseURI("test uri");
    await expect((await nft.connect(owner).config()).baseUri).to.be.equal("test uri");
    await nft.connect(owner).lockURI("forever");
    await expect(nft.connect(owner).setBaseURI("new test uri")).to.be.reverted;

    // CHANGE TOKEN POOL
    await nft.connect(owner).updateTokenPool([6, 6, 6, 7], "forever");
    await expect(await nft.connect(owner).tokenPool()).to.deep.equal(
      DEFAULT_CONFIG.tokenPool.concat([6, 6, 6, 7])
    );
    await nft.connect(owner).lockTokenPool("forever");
    await expect(nft.connect(owner).updateTokenPool([8, 8, 9, 9], "forever")).to.be.reverted;

    // CHANGE MAX SUPPLY
    await nft.connect(owner).setMaxSupply(4, "forever");
    await expect((await nft.connect(owner).config()).maxSupply).to.equal(4);
    await nft.connect(owner).lockMaxSupply("forever");
    await expect(nft.connect(owner).setMaxSupply(5, "forever")).to.be.reverted;

    // CHANGE AFFILIATE FEE
    await nft.connect(owner).setAffiliateFee(1000);
    await expect((await nft.connect(owner).config()).affiliateFee).to.be.equal(1000);
    await nft.connect(owner).lockAffiliateFee("forever");
    await expect(nft.connect(owner).setAffiliateFee(20)).to.be.reverted;

    // CHANGE OWNER ALT PAYOUT
    await nft.connect(owner).setOwnerAltPayout(alt.address);
    await expect((await nft.connect(owner).config()).ownerAltPayout).to.be.equal(alt.address);
    await nft.connect(owner).lockOwnerAltPayout("forever");
    await expect(nft.connect(owner).setOwnerAltPayout(ZERO)).to.be.reverted;

    // CHANGE DISCOUNTS
    const discount = {
      affiliateDiscount: 2000,
      mintTiers: [
        {
          numMints: 10,
          mintDiscount: 2000,
        },
        {
          numMints: 5,
          mintDiscount: 1000,
        },
      ],
    };
    await nft.connect(owner).setDiscounts(discount);
    const _discount = Object.values(discount);
    discount.mintTiers.forEach((obj, i) => {
      _discount[1][i] = Object.values(obj);
    });
    await expect((await nft.connect(owner).config()).discounts).to.deep.equal(_discount);
    await nft.connect(owner).lockDiscounts("forever");
    await expect(nft.connect(owner).setDiscounts(discount)).to.be.reverted;
  });

  it("test burn to mint functionality", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountZero;
    const minter = accountOne;

    const default_config = {
      ...DEFAULT_CONFIG,
      maxBatchSize: 10,
      maxSupply: 10,
      tokenPool: [1,1,1,1,1,2,2,2,2,2], // all tokens minted will be tokenId 1, 2
    };

    const newCollectionBurn = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultBurn = await newCollectionBurn.wait();
    const newCollectionAddressBurn = resultBurn.events[0].address || "";
    const nftBurn = Archetype.attach(newCollectionAddressBurn);

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    await nftBurn.connect(owner).enableBurnToMint(nftMint.address, BURN);
    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: 0,
      end: 0,
      limit: 300,
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // mint 10 tokens
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 10, ZERO, "0x", {
        value: 0,
      });

    // approve nftBurn to transfer tokens
    await nftMint.connect(minter).setApprovalForAll(nftBurn.address, true);

    // transfer away a token
    await nftMint.connect(minter).safeTransferFrom(minter.address, owner.address, 2, 1, "0x");

    // try to burn unowned token
    await expect(nftBurn.connect(minter).burnToMint([3], [1])).to.be.revertedWith("ERC1155: insufficient balance for transfer");

    // try to burn invalid number of tokens
    await expect(nftBurn.connect(minter).burnToMint([1, 2], [30, 30])).to.be.revertedWith(
      "ERC1155: insufficient balance for transfer"
    );

    // burn 1 of each tokenId
    await nftBurn.connect(minter).burnToMint([1, 2], [1, 1]);

    // burn 2 of token 1 and 3 of token 2
    await nftBurn.connect(minter).burnToMint([1, 2], [2, 3]);

    // disable burn to mint
    await nftBurn.connect(owner).disableBurnToMint();

    // burn will fail as burn is disabled
    await expect(nftBurn.connect(minter).burnToMint([1, 2], [1, 1])).to.be.revertedWith(
      "BurnToMintDisabled"
    );

    await expect(await nftMint.balanceOf(BURN, 1)).to.be.equal(3);
    await expect(await nftMint.balanceOf(BURN, 2)).to.be.equal(4);
    await expect(await nftBurn.balanceOf(minter.address, 1)).to.be.equal(3);
    await expect(await nftBurn.balanceOf(minter.address, 2)).to.be.equal(4);
    await expect(await nftBurn.totalSupply()).to.be.equal(7);

  });

  it("test platform only modifier", async function () {
    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();

    const owner = accountZero;
    const minter = accountOne;
    const platform = accountTwo;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );
    const result = await newCollection.wait();
    const newCollectionAddress = result.events[0].address || "";
    const nft = Archetype.attach(newCollectionAddress);

    await expect(nft.connect(owner).setSuperAffiliatePayout(minter.address)).to.be.revertedWith(
      "NotPlatform"
    );
    await nft.connect(platform).setSuperAffiliatePayout(minter.address);

    await expect((await nft.connect(minter).config()).superAffiliatePayout).to.be.equal(
      minter.address
    );
  });

  it("test max supply checks", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      maxBatchSize: 500,
      maxSupply: 50,
      tokenPool: generateTokenPool(50),
    };

    const owner = accountZero;
    const minter = accountOne;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 500,
      maxSupply: 500,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // try to mint more than max tokens tokens
    await expect(
      nftMint.connect(minter).mint({ key: ethers.constants.HashZero, proof: [] }, 51, ZERO, "0x", {
        value: 0,
      })
    ).to.be.revertedWith("MaxSupplyExceeded");

    // mint max tokens
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 50, ZERO, "0x", {
        value: 0,
      });

    // try to mint after max reached
    await expect(
      nftMint.connect(minter).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
        value: 0,
      })
    ).to.be.revertedWith("MaxSupplyExceeded");

    await expect(await nftMint.totalSupply()).to.be.equal(50);
  });

  it("test minting to another wallet", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;
    const holder = accountZero;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.02"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 300,
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // mint tokens from owner to holder address
    await nft
      .connect(owner)
      .mintTo({ key: ethers.constants.HashZero, proof: [] }, 3, holder.address, ZERO, "0x", {
        value: ethers.utils.parseEther("0.06"),
      });

    // test to=zero reverts with MintToZeroAddress
    await expect(
      nft
        .connect(owner)
        .mintTo({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, ZERO, "0x", {
          value: ethers.utils.parseEther("0.02"),
        })
    ).to.be.revertedWith("ERC1155: mint to the zero address");

    let userBalance = 0;
    for (let i = 0; i <= 5; i++) {
      userBalance += (await nft.balanceOf(holder.address, i)).toNumber();
    }
    await expect(userBalance).to.be.equal(3);
    await expect(await nft.balanceOf(owner.address, 1)).to.be.equal(0);
  });

  // it("test batchMintTo Airdrop", async function () {
  //   const default_config = { ...DEFAULT_CONFIG, maxBatchSize: 5000, maxSupply: [5000] };

  //   const [accountZero, accountOne] = await ethers.getSigners();

  //   const owner = accountOne;

  //   const newCollection = await factory.createCollection(
  //     owner.address,
  //     DEFAULT_NAME,
  //     DEFAULT_SYMBOL,
  //     default_config
  //   );

  //   const result = await newCollection.wait();
  //   const newCollectionAddress = result.events[0].address || "";
  //   const nft = Archetype.attach(newCollectionAddress);

  //   const invitelist = new Invitelist([owner.address]);
  //   const root = invitelist.root();
  //   const proof = invitelist.proof(accountZero.address);

  //   await nft.connect(owner).setInvite(root, ipfsh.ctod(CID_ZERO), {
  //     price: ethers.utils.parseEther("0.00"),
  //     start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
  //     end: 0,
  //     limit: 5000,
  //     maxSupply: 5000,
  //     unitSize: 0,
  //     tokenIdsExcluded: [],
  //     tokenAddress: ZERO,
  //   });

  //   // mint tokens from owner to air drop list
  //   const airDropList: [string, number, number][] = [];
  //   for (let i = 0; i < 100; i++) {
  //     /// 100 addresses
  //     airDropList.push([ethers.Wallet.createRandom().address, 1, 1]);
  //   }

  //   // mint in n txs (can handle about 500 owners per tx with 3mil gas limit)
  //   const splits = 2;
  //   function splitToChunks(array, parts) {
  //     const copied = [...array];
  //     const result = [];
  //     for (let i = parts; i > 0; i--) {
  //       result.push(copied.splice(0, Math.ceil(copied.length / i)));
  //     }
  //     return result;
  //   }
  //   const airDropListSplit = splitToChunks(airDropList, splits);
  //   for (const split of airDropListSplit) {
  //     await nft.connect(owner).batchMintTo(
  //       { key: root, proof: proof },
  //       split.map(list => list[0]),
  //       split.map(list => list[1]),
  //       split.map(list => list[2]),
  //       ZERO,
  //       "0x",
  //       {
  //         value: ethers.utils.parseEther("0.00"),
  //       }
  //     );
  //   }

  //   await expect(await nft.totalSupply()).to.be.equal(airDropList.length);
  //   await expect(await nft.balanceOf(airDropList[0][0], 1)).to.be.equal(1);
  //   await expect(await nft.balanceOf(airDropList[9][0], 1)).to.be.equal(1);
  //   await expect(await nft.balanceOf(airDropList[99][0], 1)).to.be.equal(1);
  //   // await expect(await nft.ownerOf(1)).to.be.equal(airDropList[0][0]);
  //   // await expect(await nft.ownerOf(10)).to.be.equal(airDropList[9][0]);
  //   // await expect(await nft.ownerOf(20)).to.be.equal(airDropList[19][0]);
  //   // await expect(await nft.ownerOf(60)).to.be.equal(airDropList[59][0]);
  //   // await expect(await nft.ownerOf(100)).to.be.equal(airDropList[99][0]);
  // });

  it("test default royalty eip 2981", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;
    const holder = accountZero;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();
    const newCollectionAddress = result.events[0].address || "";
    const nft = Archetype.attach(newCollectionAddress);

    // console.log(owner.address);
    // console.log(holder.address);

    await nft.royaltyInfo(0, ethers.utils.parseEther("1"));
    await expect(
      JSON.stringify(await nft.royaltyInfo(0, ethers.utils.parseEther("1")))
    ).to.be.equal(JSON.stringify([owner.address, ethers.utils.parseEther("0.05")])); // 5% default royalty to owner

    await nft.connect(owner).setDefaultRoyalty(holder.address, 1000);
    await expect(
      JSON.stringify(await nft.royaltyInfo(0, ethers.utils.parseEther("1")))
    ).to.be.equal(JSON.stringify([holder.address, ethers.utils.parseEther("0.10")])); // 10% royalty to holder
  });

  it("test minting with erc20 list", async function () {
    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();

    const owner = accountOne;
    const holder = accountZero;
    const platform = accountTwo;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();
    const newCollectionAddress = result.events[0].address || "";
    const nft = Archetype.attach(newCollectionAddress);

    const erc20 = await (await ethers.getContractFactory("TestErc20")).deploy();
    const tokenAddress = erc20.address;

    const balanceBefore = await erc20.balanceOf(holder.address);

    console.log({ balanceBefore: balanceBefore.toString() });

    const erc20PublicKey = ethers.utils.solidityKeccak256(["address"], [tokenAddress]);

    await nft.connect(owner).setInvite(erc20PublicKey, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("1"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 300,
      maxSupply: 5000,
      tokenAddress: tokenAddress,
      unitSize: 0,
      tokenIdsExcluded: [],
    });

    // try to mint tokens without approval
    await expect(
      nft.connect(holder).mint({ key: erc20PublicKey, proof: [] }, 3, ZERO, "0x")
    ).to.be.revertedWith("NotApprovedToTransfer");

    await erc20.connect(holder).approve(nft.address, ethers.constants.MaxUint256);

    // mint without enough erc20
    await expect(
      nft.connect(holder).mint({ key: erc20PublicKey, proof: [] }, 3, ZERO, "0x")
    ).to.be.revertedWith("Erc20BalanceTooLow");

    await erc20.connect(holder).mint(ethers.utils.parseEther("3"));

    const balance = await erc20.balanceOf(holder.address);

    console.log({ balance: balance.toString() });

    await nft.connect(holder).mint({ key: erc20PublicKey, proof: [] }, 3, ZERO, "0x");

    let userBalance = 0;
    for (let i = 0; i <= 5; i++) {
      userBalance += (await nft.balanceOf(holder.address, i)).toNumber();
    }
    await expect(userBalance).to.be.equal(3);
    await expect(await erc20.balanceOf(holder.address)).to.be.equal(0);
    await expect(await erc20.balanceOf(nft.address)).to.be.equal(ethers.utils.parseEther("3"));

    await expect((await nft.ownerBalanceToken(erc20.address)).owner).to.be.equal(
      ethers.utils.parseEther("2.85")
    ); // 95%
    await expect((await nft.ownerBalanceToken(erc20.address)).platform).to.be.equal(
      ethers.utils.parseEther("0.15")
    ); // 5%

    await nft.connect(owner).withdrawTokens([erc20.address]);
    await expect(await erc20.balanceOf(nft.address)).to.be.equal(ethers.utils.parseEther("0.15"));
    await nft.connect(platform).withdrawTokens([erc20.address]);

    await expect(await erc20.balanceOf(owner.address)).to.be.equal(ethers.utils.parseEther("2.85"));
    await expect(await erc20.balanceOf(platform.address)).to.be.equal(
      ethers.utils.parseEther("0.15")
    );
  });

  it("test dutch Invite", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;
    const holder = accountZero;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setDutchInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("1"),
      reservePrice: ethers.utils.parseEther("0.1"),
      start: 0,
      end: 0,
      limit: 300,
      interval: 1000, // 1000s,
      delta: ethers.utils.parseEther("0.1"),
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // mint at full price
    await nft.connect(holder).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
      value: ethers.utils.parseEther("1"),
    });

    // forward time 5000s
    await ethers.provider.send("evm_increaseTime", [5000]);

    // try to mint at initial price, will revert
    await expect(
      nft.connect(holder).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
        value: ethers.utils.parseEther("1"),
      })
    ).to.be.revertedWith("ExcessiveEthSent");

    // mint at half price
    await nft.connect(holder).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
      value: ethers.utils.parseEther("0.5"),
    });

    // forward a long time
    await ethers.provider.send("evm_increaseTime", [50000]);

    // mint at reserve price
    await nft.connect(holder).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
      value: ethers.utils.parseEther("0.1"),
    });

    let userBalance = 0;
    for (let i = 0; i <= 5; i++) {
      userBalance += (await nft.balanceOf(holder.address, i)).toNumber();
    }
    await expect(userBalance).to.be.equal(3);
  });

  it("test increasing dutch Invite", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();

    const owner = accountOne;
    const holder = accountZero;

    const newCollection = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";
    const nft = Archetype.attach(newCollectionAddress);

    await nft.connect(owner).setDutchInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("1"),
      reservePrice: ethers.utils.parseEther("10"),
      start: 0,
      end: 0,
      limit: 300,
      interval: 1000, // 1000s,
      delta: ethers.utils.parseEther("1"),
      maxSupply: 5000,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // mint at full price
    await nft.connect(holder).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
      value: ethers.utils.parseEther("1"),
    });

    // forward time 5000s
    await ethers.provider.send("evm_increaseTime", [5000]);

    // try to mint at initial price, will revert
    await expect(
      nft.connect(holder).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
        value: ethers.utils.parseEther("1"),
      })
    ).to.be.revertedWith("InsufficientEthSent");

    // mint at half price
    await nft.connect(holder).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
      value: ethers.utils.parseEther("6"),
    });

    // forward a long time
    await ethers.provider.send("evm_increaseTime", [50000]);

    // mint at reserve price
    await nft.connect(holder).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
      value: ethers.utils.parseEther("10"),
    });

    let userBalance = 0;
    for (let i = 0; i <= 5; i++) {
      userBalance += (await nft.balanceOf(holder.address, i)).toNumber();
    }
    await expect(userBalance).to.be.equal(3);
  });

  it("test invite list max supply check", async function () {
    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      maxSupply: 2000,
      tokenPool: generateTokenPool(2000),
      maxBatchSize: 1000,
    };

    const PublicMaxSupply = 90;

    const owner = accountZero;
    const minter = accountOne;
    const minter2 = accountTwo;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: PublicMaxSupply - 20,
      maxSupply: PublicMaxSupply,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 40, ZERO, "0x", { value: 0 });

    // try to mint past invite list max
    await expect(
      nftMint.connect(minter2).mint({ key: ethers.constants.HashZero, proof: [] }, 60, ZERO, "0x", {
        value: 0,
      })
    ).to.be.revertedWith("ListMaxSupplyExceeded");

    await nftMint
      .connect(minter2)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 50, ZERO, "0x", { value: 0 });

    await expect(await nftMint.totalSupply()).to.be.equal(PublicMaxSupply);
  });

  it("test multiple public invite lists support in 0.5.1", async function () {
    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      maxSupply: 200,
      tokenPool: generateTokenPool(200),
      maxBatchSize: 100,
    };

    const owner = accountZero;
    const minter = accountOne;
    const minter2 = accountTwo;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("1"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 100,
      maxSupply: 100,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 40, ZERO, "0x", {
        value: ethers.utils.parseEther("40"),
      });

    // set 2nd public list
    await nftMint.connect(owner).setInvite(HASHONE, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 20,
      maxSupply: 100,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    await nftMint.connect(minter2).mint({ key: HASHONE, proof: [] }, 20, ZERO, "0x", { value: 0 });

    // set 3rd public list
    await nftMint.connect(owner).setInvite(HASH256, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 40,
      maxSupply: 100,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    await nftMint.connect(minter2).mint({ key: HASH256, proof: [] }, 40, ZERO, "0x", { value: 0 });

    await expect(await nftMint.totalSupply()).to.be.equal(100);
  });

  it("test erc1155 random tokenId mints", async function () {
    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      maxSupply: 50,
      tokenPool: new Array(50).fill(100),
      maxBatchSize: 1000,
    };

    const owner = accountZero;
    const minter = accountOne;
    const minter2 = accountTwo;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 100,
      maxSupply: 2 ** 32 - 1,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // mint 1 random tokenIds
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", { value: 0 });

    await expect(await nftMint.totalSupply()).to.be.equal(1);

    // mint 10 more random tokenIds
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 10, ZERO, "0x", { value: 0 });

    await expect(await nftMint.totalSupply()).to.be.equal(11);

    // mint last tokenIds
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 39, ZERO, "0x", { value: 0 });

    // try to mint past max supply
    await expect(
      nftMint.connect(minter2).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
        value: 0,
      })
    ).to.be.revertedWith("MaxSupplyExceeded");

    await expect(await nftMint.totalSupply()).to.be.equal(50);
  });

  it("test unit size mint 1 get x functionality", async function () {
    const [accountZero, accountOne, accountTwo, accountThree] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      tokenPool: generateTokenPool(50),
      maxBatchSize: 50,
    };

    const owner = accountZero;
    const minter = accountOne;
    const minter2 = accountTwo;
    const minter3 = accountThree;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 24,
      maxSupply: 40,
      unitSize: 12,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // mint 1 get 12
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", { value: 0 });

    // try to mint past invite list limit
    await expect(
      nftMint.connect(minter).mint({ key: ethers.constants.HashZero, proof: [] }, 2, ZERO, "0x", {
        value: 0,
      })
    ).to.be.revertedWith("NumberOfMintsExceeded");

    // mint 2 get 24
    await nftMint
      .connect(minter2)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 2, ZERO, "0x", { value: 0 });

    // try to mint past invite list max
    await expect(
      nftMint.connect(minter3).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
        value: 0,
      })
    ).to.be.revertedWith("MaxSupplyExceeded");

    await expect(await nftMint.totalSupply()).to.be.equal(36);
  });

  it("test erc1155 increasing token pool supply", async function () {
    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      tokenPool: generateTokenPool(50),
      maxBatchSize: 1000,
    };

    const owner = accountZero;
    const minter = accountOne;
    const minter2 = accountTwo;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 2 ** 32 - 1,
      maxSupply: 2 ** 32 - 1,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // mint 50
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 50, ZERO, "0x", { value: 0 });

    await expect(await nftMint.totalSupply()).to.be.equal(50);

    // update tokenPool with more tokenIds
    await nftMint.connect(owner).setMaxSupply(57, "forever");
    await nftMint.connect(owner).updateTokenPool([6, 6, 6, 7, 7, 7, 1], "forever");

    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 7, ZERO, "0x", { value: 0 });

    await expect(await nftMint.balanceOf(minter.address, 1)).to.be.equal(11); // 10 from initial + 1 from expansion
    await expect(await nftMint.balanceOf(minter.address, 6)).to.be.equal(3);
    await expect(await nftMint.balanceOf(minter.address, 7)).to.be.equal(3);

    // update again
    await nftMint.connect(owner).setMaxSupply(61, "forever");
    await nftMint.connect(owner).updateTokenPool([20, 20, 20, 20], "forever");

    // mint 10 tokenId 5
    await nftMint
      .connect(minter2)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 4, ZERO, "0x", { value: 0 });

    await expect(await nftMint.balanceOf(minter2.address, 20)).to.be.equal(4);
  });

  it("test erc1155 large token pool of 10000 tokens", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      tokenPool: generateTokenPool(5000),
      maxBatchSize: 1000,
    };

    const owner = accountZero;
    const minter = accountOne;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    // Due to gas limit of 30 million in tx, need to split in two txs
    await nftMint.connect(owner).updateTokenPool(generateTokenPool(5000), "forever");

    const tokenPool = await nftMint.connect(owner).tokenPool();
    await expect(tokenPool.length).to.be.equal(10000);

    // mint 1
    await nftMint.connect(owner).setInvite(HASHONE, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 2 ** 32 - 1,
      maxSupply: 2 ** 32 - 1,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });
    // mint 1 random
    await nftMint.connect(minter).mint({ key: HASHONE, proof: [] }, 1, ZERO, "0x", { value: 0 });

    await expect(await nftMint.totalSupply()).to.be.equal(1);
  });

  it("test erc1155 batch mint owner airdrop", async function () {
    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      maxSupply: 400,
    };
    const owner = accountZero;
    const minter = accountOne;
    const minter2 = accountTwo;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    // expect to throw when not called by owner
    await expect(
      nftMint
        .connect(minter)
        .airdropTo(
          [minter.address, minter2.address, minter.address, owner.address],
          [10, 10, 10, 10],
          [1, 5, 240, 5],
          { value: 0 }
        )
    ).to.be.revertedWith("NotOwner");

    // expect validation to pickup that mint is passed max supply
    await expect(
      nftMint
        .connect(owner)
        .airdropTo(
          [minter.address, minter2.address, minter.address, owner.address],
          [100, 100, 100, 101],
          [1, 5, 240, 6],
          { value: 0 }
        )
    ).to.be.revertedWith("MaxSupplyExceeded");

    // expect payment not to be allowed
    await expect(
      nftMint
        .connect(owner)
        .airdropTo(
          [minter.address, minter2.address, minter.address, owner.address],
          [100, 100, 100, 101],
          [1, 5, 240, 6],
          { value: 1 }
        )
    ).to.be.reverted;

    await nftMint
      .connect(owner)
      .airdropTo(
        [minter.address, minter2.address, minter.address, owner.address],
        [100, 100, 100, 100],
        [1, 5, 240, 6],
        { value: 0 }
      );

    // test lock
    await nftMint.connect(owner).lockAirdrop("forever");
    await expect(
      nftMint
        .connect(owner)
        .airdropTo(
          [minter.address, minter2.address, minter.address, owner.address],
          [100, 100, 100, 101],
          [1, 5, 240, 6],
          { value: 0 }
        )
    ).to.be.revertedWith("LockedForever");

    await expect(await nftMint.totalSupply()).to.be.equal(400);
  });

  it("test batchTransactions method logic", async function () {
    const [accountZero, accountOne, accountTwo, accountThree] = await ethers.getSigners();

    const owner = accountZero;
    const minter = accountOne;
    const minter2 = accountTwo;
    const minter3 = accountThree;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 100,
      maxSupply: 100,
      unitSize: 0,
      tokenAddress: ZERO,
      tokenIdsExcluded: [],
    });

    await nftMint.connect(owner).setInvite(HASHONE, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 100,
      maxSupply: 100,
      unitSize: 0,
      tokenAddress: ZERO,
      tokenIdsExcluded: [],
    });

    const targets = [
      nftMint.address,
      nftMint.address,
      nftMint.address,
      nftMint.address,
      nftMint.address,
    ];
    const values = [0, 0, 0, ethers.utils.parseEther("0.2"), ethers.utils.parseEther("0.3")];
    const datas = [
      nftMint.interface.encodeFunctionData("mintTo", [
        { key: ethers.constants.HashZero, proof: [] },
        1,
        minter3.address,
        ZERO,
        "0x",
      ]),
      nftMint.interface.encodeFunctionData("mint", [
        { key: ethers.constants.HashZero, proof: [] },
        2,
        ZERO,
        "0x",
      ]),
      nftMint.interface.encodeFunctionData("mintTo", [
        { key: ethers.constants.HashZero, proof: [] },
        5,
        minter2.address,
        ZERO,
        "0x",
      ]),
      nftMint.interface.encodeFunctionData("mint", [{ key: HASHONE, proof: [] }, 2, ZERO, "0x"]),
      nftMint.interface.encodeFunctionData("mintTo", [
        { key: HASHONE, proof: [] },
        3,
        minter2.address,
        ZERO,
        "0x",
      ]),
    ];

    // Execute batch transactions
    await archetypeBatch.connect(minter).executeBatch(targets, values, datas, {
      value: ethers.utils.parseEther("0.6"),
    });

    let balanceOfMinter = 0;
    for (let i = 0; i <= 5; i++) {
      balanceOfMinter += (await nftMint.balanceOf(minter.address, i)).toNumber();
    }
    let balanceOfMinter2 = 0;
    for (let i = 0; i <= 5; i++) {
      balanceOfMinter2 += (await nftMint.balanceOf(minter2.address, i)).toNumber();
    }
    const totalSupply = await nftMint.totalSupply();

    expect(balanceOfMinter).to.be.equal(4);
    expect(balanceOfMinter2).to.be.equal(8);
    expect(totalSupply).to.be.equal(13);

    let balanceOfMinter3 = 0;
    for (let i = 0; i <= 5; i++) {
      balanceOfMinter3 += (await nftMint.balanceOf(minter3.address, i)).toNumber();
    }
    expect(balanceOfMinter3).to.be.equal(1);

    // batchTransaction tx sent 0.1 extra eth
    // Use rescueETH method to save eth
    const recipient_ = minter2.address;
    let ethbalance = await ethers.provider.getBalance(minter2.address);
    await archetypeBatch.connect(owner).rescueETH(recipient_);
    let diff =
      (await ethers.provider.getBalance(minter2.address)).toBigInt() - ethbalance.toBigInt();

    expect(Number(diff)).to.be.equal(Number(ethers.utils.parseEther("0.1")));
  });

  it("test batch msg sender vs tx origin logic", async function () {
    const [accountZero, accountOne, accountTwo, accountThree] = await ethers.getSigners();

    const owner = accountZero;
    const minter = accountOne;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    const addresses = [minter.address];
    const invitelist = new Invitelist(addresses);
    const root = invitelist.root();
    const proof = invitelist.proof(accountZero.address);

    // private invite list with only minter
    await nftMint.connect(owner).setInvite(root, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.0"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 100,
      maxSupply: 100,
      unitSize: 0,
      tokenAddress: ZERO,
      tokenIdsExcluded: [],
    });

    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 100,
      maxSupply: 100,
      unitSize: 0,
      tokenAddress: ZERO,
      tokenIdsExcluded: [],
    });

    const targets = [nftMint.address, nftMint.address];
    const values = [ethers.utils.parseEther("0.5"), 0];
    const datas = [
      nftMint.interface.encodeFunctionData("mint", [
        { key: ethers.constants.HashZero, proof: [] },
        5,
        ZERO,
        "0x",
      ]),
      nftMint.interface.encodeFunctionData("mint", [{ key: root, proof: proof }, 5, ZERO, "0x"]),
    ];

    // Execute batch transactions
    await archetypeBatch.connect(minter).executeBatch(targets, values, datas, {
      value: ethers.utils.parseEther("0.5"),
    });

    // minter is validated through tx.origin
    let balanceOfMinter = 0;
    for (let i = 0; i <= 5; i++) {
      balanceOfMinter += (await nftMint.balanceOf(minter.address, i)).toNumber();
    }
    const totalSupply = await nftMint.totalSupply();
    expect(balanceOfMinter).to.be.equal(10);
    expect(totalSupply).to.be.equal(10);
  });

  it("test batching owner method", async function () {
    const [accountZero, accountOne, accountTwo, accountThree] = await ethers.getSigners();

    const owner = accountZero;
    const minter = accountOne;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    const targets = [nftMint.address, nftMint.address, nftMint.address];
    const values = [0, 0, 0];
    const datas = [
      nftMint.interface.encodeFunctionData("setInvite", [
        ethers.constants.HashZero,
        ipfsh.ctod(CID_ZERO),
        {
          price: ethers.utils.parseEther("0.0"),
          start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
          end: 0,
          limit: 100,
          maxSupply: 100,
          unitSize: 0,
          tokenAddress: ZERO,
          tokenIdsExcluded: [],
        },
      ]),
      nftMint.interface.encodeFunctionData("updateTokenPool", [[8, 10, 10], "forever"]),
      nftMint.interface.encodeFunctionData("setBaseURI", ["test"]),
    ];

    // Execute batch transactions
    await archetypeBatch.connect(owner).executeBatch(targets, values, datas, {
      value: ethers.utils.parseEther("0.0"),
    });

    await expect(await nftMint.connect(owner).tokenPool()).to.deep.equal(
      DEFAULT_CONFIG.tokenPool.concat([8, 10, 10])
    );
    await expect((await nftMint.connect(owner).config()).baseUri).to.be.equal("test");
  });

  it("test erc1155 multiple rounds of token pools w/ tokenPool clearing", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      maxSupply: 500,
      tokenPool: Array(10)
        .fill(1)
        .concat(Array(20).fill(2))
        .concat(Array(40).fill(3))
        .concat(Array(30).fill(4))
        .concat(Array(100).fill(5)),
      maxBatchSize: 1000,
    };

    const owner = accountZero;
    const minter = accountOne;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    await nftMint.connect(owner).setInvite(HASHONE, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 2 ** 32 - 1,
      maxSupply: 2 ** 32 - 1,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });
    await nftMint.connect(minter).mint({ key: HASHONE, proof: [] }, 1, ZERO, "0x", { value: 0 });
    await expect(await nftMint.totalSupply()).to.be.equal(1);

    await nftMint.connect(minter).mint({ key: HASHONE, proof: [] }, 99, ZERO, "0x", { value: 0 });
    await expect(await nftMint.totalSupply()).to.be.equal(100);

    await nftMint.connect(minter).mint({ key: HASHONE, proof: [] }, 50, ZERO, "0x", { value: 0 });
    await expect(await nftMint.totalSupply()).to.be.equal(150);

    // lets add 100 more tokens to the pool
    await nftMint.connect(owner).updateTokenPool(Array(100).fill(6), "forever");

    // mint 75 tokens
    await nftMint.connect(minter).mint({ key: HASHONE, proof: [] }, 75, ZERO, "0x", { value: 0 });
    await expect(await nftMint.totalSupply()).to.be.equal(225);

    // should be 75 tokens left
    let tokenPool = await nftMint.connect(owner).tokenPool();
    await expect(tokenPool.length).to.be.equal(75);

    // lets clear the pool for new release
    await nftMint.connect(owner).resetTokenPool(Array(10).fill(7), "forever");

    tokenPool = await nftMint.connect(owner).tokenPool();
    await expect(tokenPool.length).to.be.equal(10);

    // try to mint past token pool length
    await expect(
      nftMint.connect(minter).mint({ key: HASHONE, proof: [] }, 11, ZERO, "0x", {
        value: 0,
      })
    ).to.be.revertedWith("TokenPoolEmpty");
  });

  it("test erc1155 random tokenId exclusion mints", async function () {
    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      maxSupply: 100,
      tokenPool: generateTokenPool(100),
      maxBatchSize: 100,
    };

    const owner = accountZero;
    const minter = accountOne;
    const minter2 = accountTwo;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 2 ** 32 - 1,
      maxSupply: 2 ** 32 - 1,
      unitSize: 0,
      tokenIdsExcluded: [1], // tokenIds 1 cannot be minted - 20% of the supply
      tokenAddress: ZERO,
    });

    // mint 20 tokens
    // we revert on the 5th retry
    // At worst case on the 20th mint, the number of excluded tokens is 20/80 (25%)
    // 0.25^(5 retries) = 0.09% chance that mint fails
    // chance of it failing once in 20 mints assuming every mint is that worst case probability
    // 1−(1−𝑝)𝑛 is 1.93%
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 20, ZERO, "0x", { value: 0 });

    // mint 60 tokens
    // This is basically guaranteed to revert, 20/21 of unmintable at the end.
    await expect(
      nftMint.connect(minter).mint({ key: ethers.constants.HashZero, proof: [] }, 60, ZERO, "0x", {
        value: 0,
      })
    ).to.be.revertedWith("MaxRetriesExceeded");

    await expect(await nftMint.totalSupply()).to.be.equal(20);
    await expect(await nftMint.balanceOf(minter.address, 1)).to.be.equal(0);
  });

  it("test erc1155 random tokenId exclusion large scale mint", async function () {
    const generateTokenPool = (tokenIds: number[], x: number): number[] =>
      [].concat(...tokenIds.map(i => Array(x).fill(i)));
    const tokenPool = generateTokenPool([130, 131, 135, 137, 138], 100)
      .concat(generateTokenPool([132, 134, 139, 140, 141], 50))
      .concat(generateTokenPool([142, 136], 10))
      .concat(generateTokenPool([133, 143], 1));

    const default_config = {
      ...DEFAULT_CONFIG,
      maxSupply: tokenPool.length,
      tokenPool: tokenPool,
      maxBatchSize: tokenPool.length,
    };

    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();
    const owner = accountZero;
    const minter = accountOne;
    const minter2 = accountTwo;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      end: 0,
      limit: 2 ** 32 - 1,
      maxSupply: 2 ** 32 - 1,
      unitSize: 0,
      tokenIdsExcluded: [133, 143], // 133 and 143 are both 1/1s, 2/772 tokens excluded
      tokenAddress: ZERO,
    });

    // mint entire supply
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 20, ZERO, "0x", { value: 0 });
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 700, ZERO, "0x", { value: 0 });
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 30, ZERO, "0x", { value: 0 });
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 10, ZERO, "0x", { value: 0 });

    // the only tokens left at this point are 10 tokens + the excluded 2 tokens 133 and 143

    // mint 12 tokens
    await expect(
      nftMint.connect(minter).mint({ key: ethers.constants.HashZero, proof: [] }, 12, ZERO, "0x", {
        value: 0,
      })
    ).to.be.revertedWith("MaxRetriesExceeded");

    await expect(await nftMint.totalSupply()).to.be.equal(760);
    await expect(await nftMint.balanceOf(minter.address, 133)).to.be.equal(0);
    await expect(await nftMint.balanceOf(minter.address, 143)).to.be.equal(0);
    const remainingPool = await nftMint.connect(owner).tokenPool();
    expect([133, 143].every(tokenId => remainingPool.includes(tokenId))).to.be.true;
  });

  it("test chainlink mint", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      maxSupply: 1,
      tokenPool: [1],
    };

    const owner = accountZero;
    const minter = accountOne;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );

    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    // setup chainlink
    const subId = 1;
    await vrfCoordinatorMock.createSubscription();
    await vrfCoordinatorMock.fundSubscription(subId, ethers.utils.parseEther("7"));
    await vrfCoordinatorMock.addConsumer(subId, nftMint.address);
    await nftMint.enableChainlinkVRF(subId);

    await nftMint.connect(owner).setInvite(HASHONE, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: 0,
      end: 0,
      limit: 2 ** 32 - 1,
      maxSupply: 2 ** 32 - 1,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // initiate mint
    const mintTx = await nftMint
      .connect(minter)
      .mint({ key: HASHONE, proof: [] }, 1, ZERO, "0x", { value: ethers.utils.parseEther("0.1") });
    const mintResult = await mintTx.wait();
    const reqId = mintResult.events[0].data.slice(2, 66); // extract request id
    console.log(reqId);

    // mint paid
    await expect((await nftMint.ownerBalance()).owner).to.equal(ethers.utils.parseEther("0.095"));
    // token counted but not received yet
    await expect(await nftMint.totalSupply()).to.equal(1);
    await expect(await nftMint.balanceOf(minter.address, 1)).to.equal(0);

    await vrfCoordinatorMock.fulfillRandomWords(reqId, nftMint.address);

    // token minted after fulfillment
    await expect(await nftMint.balanceOf(minter.address, 1)).to.equal(1);
    await expect(await nftMint.totalSupply()).to.equal(1);
  });

  it("test complex multi chainlink mint", async function () {
    const [accountZero, accountOne, accountTwo] = await ethers.getSigners();
    const default_config = {
      ...DEFAULT_CONFIG,
      maxSupply: 5,
      tokenPool: [1, 1, 1, 1, 1],
    };

    const owner = accountZero;
    const minter = accountOne;
    const platform = accountTwo;

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      default_config
    );

    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const nftMint = Archetype.attach(newCollectionAddressMint);

    // setup chainlink
    const subId = 1;
    await vrfCoordinatorMock.createSubscription();
    await vrfCoordinatorMock.fundSubscription(subId, ethers.utils.parseEther("7"));
    await vrfCoordinatorMock.addConsumer(subId, nftMint.address);
    await nftMint.enableChainlinkVRF(subId);

    await nftMint.connect(owner).setInvite(HASHONE, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: 0,
      end: 0,
      limit: 2 ** 32 - 1,
      maxSupply: 2 ** 32 - 1,
      unitSize: 0,
      tokenIdsExcluded: [],
      tokenAddress: ZERO,
    });

    // initiate mint 1
    const mintTx1 = await nftMint
      .connect(minter)
      .mint({ key: HASHONE, proof: [] }, 1, ZERO, "0x", { value: ethers.utils.parseEther("0.1") });
    const mintResult1 = await mintTx1.wait();
    const reqId1 = mintResult1.events[0].data.slice(2, 66); // extract request id

    // initiate mint 2
    const mintTx2 = await nftMint
      .connect(minter)
      .mint({ key: HASHONE, proof: [] }, 1, ZERO, "0x", { value: ethers.utils.parseEther("0.1") });
    const mintResult2 = await mintTx2.wait();
    const reqId2 = mintResult2.events[0].data.slice(2, 66); // extract request id

    // initiate mint 3
    const mintTx3 = await nftMint
      .connect(minter)
      .mint({ key: HASHONE, proof: [] }, 1, ZERO, "0x", { value: ethers.utils.parseEther("0.1") });
    const mintResult3 = await mintTx3.wait();
    const reqId3 = mintResult3.events[0].data.slice(2, 66); // extract request id

    // initiate mint 4
    const mintTx4 = await nftMint
      .connect(minter)
      .mint({ key: HASHONE, proof: [] }, 2, ZERO, "0x", { value: ethers.utils.parseEther("0.2") });
    const mintResult4 = await mintTx4.wait();
    const reqId4 = mintResult4.events[0].data.slice(2, 66); // extract request id

    // mints paid
    await expect((await nftMint.ownerBalance()).owner).to.equal(ethers.utils.parseEther("0.475"));
    // but token not received yet
    await expect(await nftMint.totalSupply()).to.equal(5);
    // but token not received yet
    await expect(await nftMint.balanceOf(minter.address, 1)).to.equal(0);

    // fullfill first 2
    await vrfCoordinatorMock.fulfillRandomWords(reqId1, nftMint.address);
    await vrfCoordinatorMock.fulfillRandomWords(reqId2, nftMint.address);

    // 2 tokens minted after fulfillments
    await expect(await nftMint.totalSupply()).to.equal(5);
    await expect(await nftMint.balanceOf(minter.address, 1)).to.equal(2);
    let tokenPool = await nftMint.connect(owner).tokenPool();
    await expect(tokenPool.length).to.be.equal(3);

    const randomSeed = 12342313432;
    // should revert since reqId1 was already fulfilled
    await expect(
      nftMint.connect(owner).rawFulfillRandomWords(reqId1, [randomSeed])
    ).to.be.revertedWith("InvalidRequestId");

    // should revert since reqId 10 doesn't exist
    await expect(nftMint.connect(owner).rawFulfillRandomWords(10, [randomSeed])).to.be.revertedWith(
      "InvalidRequestId"
    );

    // should revert since minter is not approved
    await expect(
      nftMint.connect(minter).rawFulfillRandomWords(reqId3, [randomSeed])
    ).to.be.revertedWith("NotVRF");

    // manually fulfill request from owner
    await nftMint.connect(owner).rawFulfillRandomWords(reqId3, [randomSeed]);

    await expect(await nftMint.balanceOf(minter.address, 1)).to.equal(3);
    tokenPool = await nftMint.connect(owner).tokenPool();
    await expect(tokenPool.length).to.be.equal(2);

    // manually fulfill request from platform
    await nftMint.connect(platform).rawFulfillRandomWords(reqId4, [randomSeed / 2]);

    await expect(await nftMint.balanceOf(minter.address, 1)).to.equal(5);
    tokenPool = await nftMint.connect(owner).tokenPool();
    await expect(tokenPool.length).to.be.equal(0);
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
