import { artifacts, ethers, upgrades } from "hardhat";
// const CONTRACTS = require("../app/lib/variables/contracts.ts");

// export const accounts = [
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

// import "@openzeppelin/hardhat-upgrades";
// const fs = require("fs");

// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

// async function main() {
//   // Hardhat always runs the compile task when running scripts with its command
//   // line interface.
//   //
//   // If this script is run directly using `node` you may want to call compile
//   // manually to make sure everything is compiled
//   // await hre.run('compile');
//   // We get the contract to deploy
//   // const Greeter = await ethers.getContractFactory("Greeter");
//   // const greeter = await Greeter.deploy("Hello, Hardhat!");
//   // await greeter.deployed();
//   // console.log("Greeter deployed to:", greeter.address);
// }

// // We recommend this pattern to be able to use async/await everywhere
// // and properly handle errors.
// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });

// sample from https://github.com/dabit3/polygon-ethereum-nextjs-marketplace/blob/main/scripts/deploy.js
// async function main() {
//   const NFTMarket = await ethers.getContractFactory("NFTMarket");
//   const nftMarket = await NFTMarket.deploy();
//   await nftMarket.deployed();
//   console.log("nftMarket deployed to:", nftMarket.address);

//   const NFT = await ethers.getContractFactory("NFT");
//   const nft = await NFT.deploy(nftMarket.address);
//   await nft.deployed();
//   console.log("nft deployed to:", nft.address);

//   const config = `
//   export const nftmarketaddress = "${nftMarket.address}"
//   export const nftaddress = "${nft.address}"
//   `;

//   const data = JSON.stringify(config);
//   fs.writeFileSync("config.js", JSON.parse(data));
// }

async function main() {
  // const SIGNING_WALLET = "0x8E94188034136dCE2BE62C10EaA5471EAf23E86B";

  // console.log({ accounts });
  // const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
  // const ERC20TransferProxyTest = artifacts.require(
  //   "ERC20TransferProxyTest.sol"
  // );
  // const RoyaltiesRegistry = artifacts.require("RoyaltiesRegistry.sol");
  // const royaltiesRegistry = await RoyaltiesRegistry.new();
  // const signer = await ethers.getSigner(SIGNING_WALLET);
  // const [a, b, signer] = await ethers.getSigners();

  // const registry = await Registry.connect(signer).deploy();

  const Registry = await ethers.getContractFactory("RoyaltiesRegistry");

  const registry = await upgrades.deployProxy(Registry, [], {
    initializer: "__RoyaltiesRegistry_init",
  });
  await registry.deployed();

  // const transferProxy = await TransferProxyTest.new();
  // const erc20TransferProxy = await ERC20TransferProxyTest.new();

  // console.log({ transferProxy, erc20TransferProxy, royaltiesRegistry });
  // We get the contract to deploy
  // const ExchangeV2 = await ethers.getContractFactory("ExchangeV2");
  // const ExchangeV2 = artifacts.require("ExchangeV2.sol");

  // const receiverWallet = "0x8E94188034136dCE2BE62C10EaA5471EAf23E86B";

  // const ExchangeV2 = await ethers.getContractFactory("NFTMarket");
  // const exchangeV2 = await NFTMarket.deploy(
  //   transferProxy.address,
  //   erc20TransferProxy.address,
  //   300,
  //   accounts[3],
  //   royaltiesRegistry.address
  // );
  // const exchangeV2 = await upgrades.deployProxy(
  //   ExchangeV2,
  //   [
  //     transferProxy.address,
  //     erc20TransferProxy.address,
  //     300,
  //     receiverWallet,
  //     royaltiesRegistry.address,
  //   ],
  //   { initializer: "__ExchangeV2_init" }
  // );

  // await exchangeV2.deployed();

  // console.log("Exchange deployed to:", exchangeV2.address);
  // console.log("ERC20 Transferproxy", erc20TransferProxy.address);
  // console.log("ERC721 TransferProxy", transferProxy.address);
  console.log("royalties registry: ", registry.address);
  // console.log("defaultFeeReceiver (community wallet): ", receiverWallet);

  // const TestERC20 = artifacts.require("TestERC20.sol");
  // const t2 = await TestERC20.new("Wrapped ETH (Scat)", "WETH");
  // const mintAmount = await t2.mint(accounts[2], "50000000000");

  // await t2.approve(erc20TransferProxy.address, "10000000000000000", {
  //   from: accounts[2],
  // });

  // console.log({ mintAmount });

  // // const myWallet = "0x8e8665bE566a0953bBEdACA5D6261F2F33113Ff1";
  // const nftMinterWallet = accounts[1];

  // const TestERC721 = artifacts.require("TestERC721.sol");

  // const erc721 = await TestERC721.new(
  //   "Sam Hyde Poster",
  //   "HYDE",
  //   "https://ipfs.samhyde.com"
  // );

  // const nftMint = await erc721.mint(nftMinterWallet, 53);
  // console.log({ nftMint });

  // const nftApproval = await erc721.setApprovalForAll(
  //   transferProxy.address,
  //   true,
  //   { from: nftMinterWallet }
  // );

  // console.log({ nftApproval });

  // // console.log({ erc721address: erc721.address });
  // console.log({ erc721address: erc721.address, erc20address: t2.address });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
