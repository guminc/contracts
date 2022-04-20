import { ethers, upgrades } from "hardhat";

import { expect } from "chai";
import { Archetype__factory, Archetype as IArchetype, Factory__factory } from "../typechain";
import { Contract } from "@ethersproject/contracts";
import Invitelist from "../lib/invitelist";

const DEFAULT_NAME = "Pookie";
const DEFAULT_SYMBOL = "POOKIE";
const DEFAULT_CONFIG = {
  // tokenPrice: ethers.utils.parseEther("0.08"),
  unrevealedUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
  baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
  maxSupply: 5000,
  maxBatchSize: 20,
};
const ZERO = "0x0000000000000000000000000000000000000000";

describe("Factory", function () {
  let Archetype: Archetype__factory;
  let archetype: IArchetype;
  let Factory: Factory__factory;
  let factory: Contract;

  before(async function () {
    Archetype = await ethers.getContractFactory("Archetype");

    // const archetype = await upgrades.deployProxy(Archetype, []);

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

    await nft.connect(owner).setInvite(ethers.constants.HashZero, {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 300,
    });

    // const invites = await nft.invites(ethers.constants.HashZero);

    // console.log({ invites });

    await nft.mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, {
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
        invite: {
          price: ethers.utils.parseEther("0.1"),
          start: ethers.BigNumber.from(Math.floor(tomorrow / 1000)),
          limit: 1000,
        },
      },
      {
        key: root,
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
      nft.mint({ key: root, proof: proof }, 1, ZERO, {
        value: ethers.utils.parseEther("0.07"),
      })
    ).to.be.revertedWith("InsufficientEthSent");

    await expect(
      nft.mint({ key: root, proof: proof }, 1, ZERO, {
        value: ethers.utils.parseEther("0.09"),
      })
    ).to.be.revertedWith("ExcessiveEthSent");

    await nft.mint({ key: root, proof: proof }, 1, ZERO, {
      value: price,
    });

    await nft.mint({ key: root, proof: proof }, 5, ZERO, {
      value: price.mul(5),
    });

    expect(await nft.balanceOf(accountZero.address)).to.equal(6);

    const proofTwo = invitelist.proof(accountTwo.address);

    // non-whitelisted wallet
    // private mint rejection
    await expect(
      nft.connect(accountTwo).mint({ key: root, proof: proofTwo }, 2, ZERO, {
        value: price.mul(2),
      })
    ).to.be.revertedWith("WalletUnauthorizedToMint");

    // public mint rejection
    await expect(
      nft.connect(accountTwo).mint({ key: ethers.constants.HashZero, proof: [] }, 2, ZERO, {
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
      nft.mint({ key: ethers.constants.HashZero, proof: [] }, 1, ZERO, {
        value: ethers.utils.parseEther("0.08"),
      })
    ).to.be.revertedWith("MintingPaused");
  });

  it("test withdraws (affiliate, owner, platform, invalid)", async function () {
    const [accountZero, accountOne, accountTwo, accountThree] = await ethers.getSigners();
  
    const affiliate = accountZero;
    const owner = accountOne;
    const platform = accountTwo
  
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
  
    await nft.connect(owner).setInvite(ethers.constants.HashZero, {
      price: ethers.utils.parseEther("0.08"),
      start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
      limit: 300,
    });
  
    // const invites = await nft.invites(ethers.constants.HashZero);
  
    // console.log({ invites });
  
    await nft.mint({ key: ethers.constants.HashZero, proof: [] }, 1, affiliate.address, {
      value: ethers.utils.parseEther("0.08"),
    });

    await expect((await nft.ownerBalance()).owner).to.equal(ethers.utils.parseEther("0.0744")); // 93%
    await expect((await nft.ownerBalance()).platform).to.equal(ethers.utils.parseEther("0.0016")); // 2%
    await expect((await nft.affiliateBalance(affiliate.address))).to.equal(ethers.utils.parseEther("0.004")); // 5%

    await expect(
      nft.connect(owner).withdraw(ethers.utils.parseEther("0.08"))
    ).to.be.revertedWith("withdraw balance too high");

    await expect(
      nft.connect(platform).withdraw(ethers.utils.parseEther("0.002"))
    ).to.be.revertedWith("withdraw balance too high");

    await expect(
      nft.connect(affiliate).withdraw(ethers.utils.parseEther("0.004001"))
    ).to.be.revertedWith("withdraw balance too high");

    // withdraw owner balance
    let balance = (await ethers.provider.getBalance(owner.address));
    await nft.connect(owner).withdraw(ethers.utils.parseEther("0.0744"));
    let diff = (await ethers.provider.getBalance(owner.address)).toBigInt() - balance.toBigInt();
    // withdrawal won't be exact due to gas payment, just check range.
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.0700"))); 
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.0744"))); 

    // mint again
    await nft.mint({ key: ethers.constants.HashZero, proof: [] }, 1, affiliate.address, {
      value: ethers.utils.parseEther("0.08"),
    });

    await expect((await nft.ownerBalance()).owner).to.equal(ethers.utils.parseEther("0.0744"));
    await expect((await nft.ownerBalance()).platform).to.equal(ethers.utils.parseEther("0.0032"));  // 2% x 2 mints
    await expect((await nft.affiliateBalance(affiliate.address))).to.equal(ethers.utils.parseEther("0.008")); // 5% x 2 mints

    // withdraw owner balance again
    balance = (await ethers.provider.getBalance(owner.address));
    await nft.connect(owner).withdraw(ethers.utils.parseEther("0.0744"));
    diff = (await ethers.provider.getBalance(owner.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.0700"))); // leave room for gas
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.0744"))); 

    // withdraw platform balance
    balance = (await ethers.provider.getBalance(platform.address));
    await nft.connect(platform).withdraw(ethers.utils.parseEther("0.0025")) // partial withdraw
    diff = (await ethers.provider.getBalance(platform.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.0015"))); 
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.0025")));

    // withdraw affiliate balance
    balance = (await ethers.provider.getBalance(affiliate.address));
    await nft.connect(affiliate).withdraw(ethers.utils.parseEther("0.008"))
    diff = (await ethers.provider.getBalance(affiliate.address)).toBigInt() - balance.toBigInt();
    expect(Number(diff)).to.greaterThan(Number(ethers.utils.parseEther("0.007")));
    expect(Number(diff)).to.lessThanOrEqual(Number(ethers.utils.parseEther("0.008")));

    // withdraw empty affiliate balance
    await expect(
      nft.connect(affiliate).withdraw(ethers.utils.parseEther("0.00001"))
    ).to.be.revertedWith("withdraw balance too high");

    // withdraw unused affiliate balance
    await expect(
      nft.connect(accountThree).withdraw(ethers.utils.parseEther("0.00001"))
    ).to.be.revertedWith("withdraw balance too high");

  });
});

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
