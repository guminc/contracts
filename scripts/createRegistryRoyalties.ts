import { ethers, upgrades } from "hardhat";

const CONTRACTS = require("../app/lib/variables/contracts.ts");
const hre = require("hardhat");
const { EXCHANGE_V2_ADDRESS } = CONTRACTS;
const exchangeV2Abi = require("../app/lib/abi/raribleExchangeV2.json");
const sellingNftAbi = require("../app/lib/abi/flurksToken.json");
const wethTokenAbi = require("../app/lib/abi/wethToken.json");

const accounts = [
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
  "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
  "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
  "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
  "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
  "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
  "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
  "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
  "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
  "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
  "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
  "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
  "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
  "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
];

async function main() {
  // console.log({ accounts });
  try {
    // const ROYALTIES_REGISTRY = "0xc7032A710d5B6a7a936EaF23B3681c37F5E0881e";
    // const NFT_COLLECTION = "0xe5F378457BbC0412B951Acc4000ab24FA1a7e8Bb";

    const [signer] = await ethers.getSigners();
    // console.log({ signer });

    const SIGNING_WALLET = signer.address;

    const Registry = await ethers.getContractFactory("RoyaltiesRegistry");

    const registry = await upgrades.deployProxy(Registry, [], {
      initializer: "__RoyaltiesRegistry_init",
    });
    await registry.deployed();

    const ROYALTIES_REGISTRY = registry.address;

    const NFT = await ethers.getContractFactory("GameItem", signer);
    const nft = await NFT.connect(signer).deploy();
    // const nft = await NFT.deploy({ from: accounts[0] });
    // console.log({ nft });
    const NFT_COLLECTION = nft.address;

    console.log({ ROYALTIES_REGISTRY, SIGNING_WALLET, NFT_COLLECTION });

    // const registry = await Registry.attach(ROYALTIES_REGISTRY);

    const owner = await registry.connect(signer).owner();

    console.log({ owner });

    const res = await registry
      .connect(signer)
      .functions.royaltiesByToken(NFT_COLLECTION);

    console.log({ res });

    const res2 = await registry
      .connect(signer)
      .functions.setRoyaltiesByToken(NFT_COLLECTION, [
        { account: SIGNING_WALLET, value: 500 },
      ]);
    console.log({ res2 });
  } catch (error) {
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
