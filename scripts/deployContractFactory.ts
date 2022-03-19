import { ethers, run } from "hardhat";

async function main() {
  const NFTContractFactory = await ethers.getContractFactory("NFTContractFactory");

  const nftContractFactory = await NFTContractFactory.deploy();

  await nftContractFactory.deployed();

  console.log("Contract Factory deployed to:", nftContractFactory.address);

  await run("verify:verify", {
    address: nftContractFactory.address,
    constructorArguments: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
