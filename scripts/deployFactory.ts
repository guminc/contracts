import { ethers, run } from "hardhat";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const Factory = await ethers.getContractFactory("Factory");

  const factory = await Factory.deploy();

  await factory.deployed();

  console.log("Contract Factory deployed to:", factory.address);

  await sleep(60 * 1000);

  await run("verify:verify", {
    address: factory.address,
    constructorArguments: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
