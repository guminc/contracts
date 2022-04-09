import { ethers, upgrades } from "hardhat";

import { expect } from "chai";
import { Archetype__factory, Archetype as IArchetype, Factory__factory } from "../typechain";
import { Contract } from "@ethersproject/contracts";

const DEFAULT_NAME = "Pookie";
const DEFAULT_SYMBOL = "POOKIE";
const DEFAULT_CONFIG = {
  placeholder: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
  base: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
  supply: 5000,
  permanent: false,
};

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
    const [accountZero, accountOne] = await ethers.getSigners();

    console.log({ accountZero: accountZero.address });

    const newCollection = await factory.createCollection(
      accountOne.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    // console.dir({ events: result.events });
    const newCollectionAddress = result.events[0].address || "";

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    const symbol = await nft.symbol();
    const owner = await nft.owner();
    // const mintRes = await nft.mint();

    expect(symbol).to.equal(DEFAULT_SYMBOL);
    expect(owner).to.equal(accountOne.address);
  });

  it("should initialize once and continue to work after initialized", async function () {
    const res = await archetype.initialize("Flookie", DEFAULT_SYMBOL, DEFAULT_CONFIG);
    const awaitRes = await res.wait();

    console.log({ awaitRes });

    expect(await archetype.name()).to.equal("Flookie");

    await expect(archetype.initialize("Wookie", DEFAULT_SYMBOL, DEFAULT_CONFIG)).to.be.revertedWith(
      "Initializable: contract is already initialized"
    );

    const [accountZero, accountOne] = await ethers.getSigners();

    console.log({ accountZero: accountZero.address });

    const newCollection = await factory.createCollection(
      accountOne.address,
      DEFAULT_NAME,
      DEFAULT_SYMBOL,
      DEFAULT_CONFIG
    );

    const result = await newCollection.wait();

    // console.dir({ events: result.events });
    const newCollectionAddress = result.events[0].address || "";

    const NFT = await ethers.getContractFactory("Archetype");

    const nft = NFT.attach(newCollectionAddress);

    const symbol = await nft.symbol();
    const owner = await nft.owner();
    // const mintRes = await nft.mint();

    expect(symbol).to.equal(DEFAULT_SYMBOL);
    expect(owner).to.equal(accountOne.address);
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
