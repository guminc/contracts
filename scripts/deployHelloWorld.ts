import { ethers, run } from "hardhat";

async function main() {
  const HelloWorld = await ethers.getContractFactory("HelloWorld");

  const helloWorld = await HelloWorld.deploy("Mookie");

  await helloWorld.deployed();

  console.log("Contract deployed to:", helloWorld.address);

  await run("verify:verify", {
    address: helloWorld.address,
    constructorArguments: ["Mookie"],
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
