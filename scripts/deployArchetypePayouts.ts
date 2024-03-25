import { ethers } from "hardhat";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const ArchetypeBatch = await ethers.getContractFactory("ArchetypePayouts");

  const archetypePayouts = await ArchetypeBatch.deploy();

  console.log(`Contract deployed to ${archetypePayouts.address}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
