import { ethers } from "hardhat";

async function main() {
  const NFTContractFactory = await ethers.getContractFactory("NFTContractFactory");

  const nftContractFactory = await NFTContractFactory.deploy();

  await nftContractFactory.deployed();

  console.log("Contract Factory deployed to:", nftContractFactory.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
