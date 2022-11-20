import { ethers, upgrades } from "hardhat";

import { expect } from "chai";
import { Archetype__factory, Archetype as IArchetype, Factory__factory } from "../typechain";
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
  let Archetype: Archetype__factory;
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

    Archetype = await ethers.getContractFactory("Archetype");

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

    const NFT = await ethers.getContractFactory("Archetype");

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

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

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

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    const symbol = await nft.symbol();
    const owner = await nft.owner();

    expect(symbol).to.equal(DEFAULT_SYMBOL);
    expect(owner).to.equal(accountOne.address);

    const NewArchetype = await ethers.getContractFactory("Archetype");

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

    const nft1 = NFT.attach(anotherollectionAddress);

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

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    await expect(nft.lockURI("forever")).to.be.revertedWith("Ownable: caller is not the owner");
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

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 300,
    });

    // const invites = await nft.invites(ethers.constants.HashZero);

    // console.log({ invites });

    await nft.mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
      value: ethers.utils.parseEther("0.08"),
    });

    expect(await nft.balanceOf(accountZero.address)).to.equal(1);
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

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    const addresses = [accountZero.address, accountOne.address];
    // const addresses = [...Array(5000).keys()].map(() => accountZero.address);

    const invitelist = new Invitelist(addresses);

    const root = invitelist.root();
    const proof = invitelist.proof(accountZero.address);

    const price = ethers.utils.parseEther("0.08");

    const today = new Date();
    const tomorrow = today.setDate(today.getDate() + 1);

    console.log({ toda: Math.floor(Date.now() / 1000) });
    console.log({ tomo: Math.floor(tomorrow / 1000) });

    await nft.connect(owner).setInvites([
      {
        key: ethers.constants.HashZero,
        cid: ipfsh.ctod(CID_ZERO),
        invite: {
          price: ethers.utils.parseEther("0.1"),
          start: ethers.BigNumber.from(Math.floor(tomorrow / 1000)),
          limit: 1000,
        },
      },
      {
        key: root,
        cid: ipfsh.ctod(CID_DEFAULT),
        invite: {
          price: price,
          start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
          limit: 10,
        },
      },
    ]);

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

    expect(await nft.balanceOf(accountZero.address)).to.equal(6);

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

    expect(await nft.balanceOf(accountTwo.address)).to.equal(0);
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

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    // await nft.connect(owner).setPaused(false);

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

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 300,
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

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 300,
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
        unrevealedUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
        baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
        affiliateSigner: AFFILIATE_SIGNER.address,
        ownerAltPayout: ZERO,
        superAffiliatePayout: superAffiliate.address,
        maxSupply: 5000,
        maxBatchSize: 20,
        affiliateFee: 1500,
        platformFee: 500,
        discounts: {
          affiliateDiscount: 0, // 10%
          mintTiers: [],
        },
      }
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 300,
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
        unrevealedUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
        baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
        affiliateSigner: AFFILIATE_SIGNER.address,
        ownerAltPayout: ownerAltPayout.address,
        superAffiliatePayout: ZERO,
        maxSupply: 5000,
        maxBatchSize: 20,
        affiliateFee: 1500,
        platformFee: 500,
        discounts: {
          affiliateDiscount: 0, // 10%
          mintTiers: [],
        },
      }
    );

    const result = await newCollection.wait();

    const newCollectionAddress = result.events[0].address || "";

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.1"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 300,
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

  it("allow token owner to store msg", async function () {
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

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.02"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 300,
    });

    // mint tokens 1, 2, 3
    await nft.connect(holder).mint({ key: ethers.constants.HashZero, proof: [] }, 3, ZERO, "0x", {
      value: ethers.utils.parseEther("0.06"),
    });

    const msg = "Hi this is a test, I own this";

    // try to set as non token owner - will fail
    await expect(nft.connect(owner).setTokenMsg(3, msg)).to.be.revertedWith("NotTokenOwner");

    // try to set as token owner - will succeed
    await nft.connect(holder).setTokenMsg(3, msg + msg + msg + msg + msg);

    // try to set as token owner - will succeed
    await nft.connect(holder).setTokenMsg(3, msg);

    // check that msgs match
    await expect(await nft.getTokenMsg(3)).to.be.equal(msg);
  });

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

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    // CHANGE URI
    await nft.connect(owner).setBaseURI("test uri");
    await expect((await nft.connect(owner).config()).baseUri).to.be.equal("test uri");
    await nft.connect(owner).lockURI("forever");
    await expect(nft.connect(owner).setBaseURI("new test uri")).to.be.reverted;

    // CHANGE MAX SUPPLY
    await nft.connect(owner).setMaxSupply(100, "forever");
    await expect((await nft.connect(owner).config()).maxSupply).to.be.equal(100);
    await nft.connect(owner).lockMaxSupply("forever");
    await expect(nft.connect(owner).setMaxSupply(20, "forever")).to.be.reverted;

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

    const newCollectionBurn = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );
    const resultBurn = await newCollectionBurn.wait();
    const newCollectionAddressBurn = resultBurn.events[0].address || "";
    const NFTBurn = await ethers.getContractFactory("Archetype");
    const nftBurn = NFTBurn.attach(newCollectionAddressBurn);

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const NFTMint = await ethers.getContractFactory("Archetype");
    const nftMint = NFTMint.attach(newCollectionAddressMint);

    await nftBurn.connect(owner).enableBurnToMint(nftMint.address, 2, 0, 5000);
    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 300,
    });

    // mint 10 tokens
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 12, ZERO, "0x", {
        value: 0,
      });

    // approve nftBurn to transfer tokens
    await nftMint.connect(minter).setApprovalForAll(nftBurn.address, true);

    // transfer away a token
    await nftMint.connect(minter).transferFrom(minter.address, owner.address, 10);

    // try to burn unowned token
    await expect(nftBurn.connect(minter).burnToMint([9, 10])).to.be.revertedWith("NotTokenOwner");

    // try to burn invalid number of tokens
    await expect(nftBurn.connect(minter).burnToMint([9])).to.be.revertedWith(
      "InvalidAmountOfTokens"
    );

    // burn 2 tokens and collect 1 token in new collection
    await nftBurn.connect(minter).burnToMint([2, 4]);

    // burn 4 tokens and collect 2 tokens in new collection
    await nftBurn.connect(minter).burnToMint([1, 3, 5, 8]);

    // disable burn to mint
    await nftBurn.connect(owner).disableBurnToMint();

    // burn will fail as burn is disabled
    await expect(nftBurn.connect(minter).burnToMint([11, 12])).to.be.revertedWith(
      "BurnToMintDisabled"
    );;

    // re-enable with time set in future
    await nftBurn.connect(owner).enableBurnToMint(nftMint.address, 2, 10000000000, 5000);

    // burn will fail as burn is time is set in future
    await expect(nftBurn.connect(minter).burnToMint([11, 12])).to.be.revertedWith(
      "MintNotYetStarted"
    );

    // re-enable again with valid config
    await nftBurn.connect(owner).enableBurnToMint(nftMint.address, 2, 0, 5000);

    // burn 4 tokens and collect 2 tokens in new collection
    await nftBurn.connect(minter).burnToMint([11, 12]);

    await expect(await nftMint.ownerOf(1)).to.be.equal(BURN);
    await expect(await nftMint.ownerOf(2)).to.be.equal(BURN);
    await expect(await nftMint.ownerOf(3)).to.be.equal(BURN);
    await expect(await nftMint.ownerOf(4)).to.be.equal(BURN);
    await expect(await nftMint.ownerOf(5)).to.be.equal(BURN);
    await expect(await nftMint.ownerOf(8)).to.be.equal(BURN);
    await expect(await nftMint.ownerOf(11)).to.be.equal(BURN);
    await expect(await nftMint.ownerOf(12)).to.be.equal(BURN);
    await expect(await nftMint.balanceOf(minter.address)).to.be.equal(3);

    await expect(await nftBurn.balanceOf(minter.address)).to.be.equal(4);
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
    const NFT = await ethers.getContractFactory("Archetype");
    const nft = NFT.attach(newCollectionAddress);

    await expect(nft.connect(owner).setSuperAffiliatePayout(minter.address)).to.be.revertedWith(
      "caller is not the platform"
    );
    await nft.connect(platform).setSuperAffiliatePayout(minter.address);

    await expect((await nft.connect(minter).config()).superAffiliatePayout).to.be.equal(
      minter.address
    );
  });

  it("test max supply checks", async function () {
    const [accountZero, accountOne] = await ethers.getSigners();
    DEFAULT_CONFIG.maxBatchSize = 5000;
    DEFAULT_CONFIG.maxSupply = 5000;

    const owner = accountZero;
    const minter = accountOne;

    const newCollectionBurn = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );
    const resultBurn = await newCollectionBurn.wait();
    const newCollectionAddressBurn = resultBurn.events[0].address || "";
    const NFTBurn = await ethers.getContractFactory("Archetype");
    const nftBurn = NFTBurn.attach(newCollectionAddressBurn);

    const newCollectionMint = await factory.createCollection(
      owner.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );
    const resultMint = await newCollectionMint.wait();
    const newCollectionAddressMint = resultMint.events[0].address || "";
    const NFTMint = await ethers.getContractFactory("Archetype");
    const nftMint = NFTMint.attach(newCollectionAddressMint);

    await nftBurn.connect(owner).enableBurnToMint(nftMint.address, 2, 0, 5000);
    await nftMint.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 10000,
    });
    await nftBurn.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: 0,
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 10000,
    });

    // mint some tokens
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 10, ZERO, "0x", {
        value: 0,
      });

    // try to mint more than max tokens tokens
    await expect(
      nftMint
        .connect(minter)
        .mint({ key: ethers.constants.HashZero, proof: [] }, 4991, ZERO, "0x", {
          value: 0,
        })
    ).to.be.revertedWith("MaxSupplyExceeded");

    // mint max tokens
    await nftMint
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 4990, ZERO, "0x", {
        value: 0,
      });

    // try to mint after max reached
    await expect(
      nftMint.connect(minter).mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, "0x", {
        value: 0,
      })
    ).to.be.revertedWith("MaxSupplyExceeded");

    // approve nftBurn to transfer tokens
    await nftMint.connect(minter).setApprovalForAll(nftBurn.address, true);

    // mint tokens on burn to mint
    await nftBurn
      .connect(minter)
      .mint({ key: ethers.constants.HashZero, proof: [] }, 4990, ZERO, "0x", {
        value: 0,
      });

    // try burn to mint past max supply
    await expect(
      nftBurn.connect(minter).burnToMint(Array.from({ length: 40 }, (_, i) => i + 1))
    ).to.be.revertedWith("MaxSupplyExceeded");

    // burn to max
    await nftBurn.connect(minter).burnToMint(Array.from({ length: 20 }, (_, i) => i + 1));

    // try to burn past max supply
    await expect(nftBurn.connect(minter).burnToMint([1000, 1001])).to.be.revertedWith(
      "MaxSupplyExceeded"
    );

    await expect(await nftMint.totalSupply()).to.be.equal(DEFAULT_CONFIG.maxSupply);
    await expect(await nftBurn.totalSupply()).to.be.equal(DEFAULT_CONFIG.maxSupply);
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

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.02"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 300,
    });

    // mint tokens from owner to holder address
    await nft
      .connect(owner)
      .mintTo({ key: ethers.constants.HashZero, proof: [] }, 3, holder.address, ZERO, "0x", {
        value: ethers.utils.parseEther("0.06"),
      });

    // test to=zero defaults to msg.sender
    await nft
      .connect(owner)
      .mintTo({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, ZERO, "0x", {
        value: ethers.utils.parseEther("0.02"),
      });

    await expect(await nft.balanceOf(holder.address)).to.be.equal(3);
    await expect(await nft.balanceOf(owner.address)).to.be.equal(1);
  });

  it("test batchMintTo Airdrop", async function () {
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
    const NFT = await ethers.getContractFactory("Archetype");
    const nft = NFT.attach(newCollectionAddress);

    const invitelist = new Invitelist([owner.address]);
    const root = invitelist.root();
    const proof = invitelist.proof(accountZero.address);

    await nft.connect(owner).setInvite(root, ipfsh.ctod(CID_ZERO), {
      price: ethers.utils.parseEther("0.00"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 5000,
    });

    // mint tokens from owner to air drop list
    let airDropList:[string, number][] = []
    for(let i=0; i<1000; i++) { /// 1000 addresses
      airDropList.push([ethers.Wallet.createRandom().address, 1])
    }

    // mint in n txs (can handle about 500 owners per tx with 3mil gas limit)
    const splits = 2
    function splitToChunks(array, parts) {
        const copied = [ ...array ]
        let result = [];
        for (let i = parts; i > 0; i--) {
            result.push(copied.splice(0, Math.ceil(copied.length / i)));
        }
        return result;
    }
    const airDropListSplit = splitToChunks(airDropList, splits)
    for (const split of airDropListSplit) {
      await nft
        .connect(owner)
        .batchMintTo({ key: root, proof: proof }, 
          split.map(list => list[0]),
          split.map(list => list[1]),
          ZERO, "0x", {
          value: ethers.utils.parseEther("0.00"),
        });
      }

    await expect(await nft.totalSupply()).to.be.equal(airDropList.length);
    await expect(await nft.ownerOf(1)).to.be.equal(airDropList[0][0]);
    await expect(await nft.ownerOf(10)).to.be.equal(airDropList[9][0]);
    await expect(await nft.ownerOf(100)).to.be.equal(airDropList[99][0]);
    await expect(await nft.ownerOf(500)).to.be.equal(airDropList[499][0]);
    await expect(await nft.ownerOf(1000)).to.be.equal(airDropList[999][0]);
  });

  it("test royalty enforcement enabling and lock", async function () {
    const [accountZero, accountOne , accountTwo] = await ethers.getSigners();

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
    const NFT = await ethers.getContractFactory("Archetype");
    const nft = NFT.attach(newCollectionAddress);

    // // mock opensea default block list addresses
    // ///The default OpenSea operator blocklist subscription.
    // const _DEFAULT_SUBSCRIPTION = "0x3cc6CddA760b79bAfa08dF41ECFA224f810dCeB6";
    // const Subscription = await ethers.getContractFactory("OwnedRegistrant");
    // const subscription = await Subscription.deploy(opensea.address);
    // await subscription.deployed();
    
    // /// @dev The OpenSea operator filter registry.
    // const _OPERATOR_FILTER_REGISTRY = "0x000000000000AAeB6D7670E522A718067333cd4E";
    // const Filter = await ethers.getContractFactory("OperatorFilterRegistry");
    // const filter = await Filter.deploy();
    // await filter.deployed();

    // await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
    //   price: ethers.utils.parseEther("0.00"),
    //   start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
    //   limit: 5000,
    // });

    await expect(await nft.royaltyEnforcementEnabled()).to.be.equal(false);
    await nft.connect(owner).enableRoyaltyEnforcement()
    await expect(await nft.royaltyEnforcementEnabled()).to.be.equal(true);
    await nft.connect(owner).disableRoyaltyEnforcement()
    await expect(await nft.royaltyEnforcementEnabled()).to.be.equal(false);
    await expect(await nft.royaltyEnforcementLocked()).to.be.equal(false);
    await nft.connect(owner).lockRoyaltyEnforcement("forever")
    await expect(await nft.royaltyEnforcementLocked()).to.be.equal(true);
    await expect(nft.connect(owner).enableRoyaltyEnforcement()).to.be.reverted;
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
