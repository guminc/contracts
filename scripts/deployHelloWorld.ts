import { ethers } from "hardhat";

async function main() {
  const HelloWorld = await ethers.getContractFactory("HelloWorld");

  const helloWorld = await HelloWorld.deploy();

  await helloWorld.deployed();

  console.log("Contract deployed to:", helloWorld.address);

  // await run("verify:verify", {
  //   address: nftContractFactory.address,
  //   constructorArguments: [],
  // });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
