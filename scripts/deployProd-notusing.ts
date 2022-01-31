import { artifacts, ethers, upgrades } from "hardhat";
const CONTRACTS = require("../app/lib/variables/contracts.ts");

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
  // console.log({ accounts });
  // const NftTransferProxy = await ethers.getContractFactory("INftTransferProxy");
  // const nftTransferProxy = await NftTransferProxy.deploy();

  const NftTransferProxy = artifacts.require("INftTransferProxy");
  const ERC20TransferProxy = artifacts.require(
    "@rarible/exchange-interfaces/contracts/IERC20TransferProxy.sol:IERC20TransferProxy"
  );
  const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");

  const nftTransferProxy = await NftTransferProxy.new();
  const erc20TransferProxy = await ERC20TransferProxy.new();
  const royaltiesRegistry = await TestRoyaltiesRegistry.new();

  // console.log({ transferProxy, erc20TransferProxy, royaltiesRegistry });
  // We get the contract to deploy
  const ExchangeV2 = await ethers.getContractFactory("ExchangeV2");
  // const ExchangeV2 = artifacts.require("ExchangeV2.sol");
  const rinkebyReceiverWallet = "0xd471b17E1271bB1Ccc568f17Fa8FFB695Aac092e";

  const exchangeV2 = await upgrades.deployProxy(
    ExchangeV2,
    [
      nftTransferProxy.address,
      erc20TransferProxy.address,
      300,
      CONTRACTS.DEFAULT_FEE_RECEIVER,
      royaltiesRegistry.address,
    ],
    { initializer: "__ExchangeV2_init" }
  );

  console.log("Exchange deployed to:", exchangeV2.address);
  console.log("ERC20 Transferproxy" + erc20TransferProxy.address);
  console.log("ERC721 TransferProxy", nftTransferProxy.address);
  console.log("royalties registry: " + royaltiesRegistry.address);
  console.log(
    "defaultFeeReceiver (community wallet): " + CONTRACTS.DEFAULT_FEE_RECEIVER
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
