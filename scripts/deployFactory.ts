import { ethers, upgrades, run } from "hardhat";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  // const Archetype = await ethers.getContractFactory("Archetype");

  // const archetype = await Archetype.deploy();

  // await archetype.deployed();

  // console.log("Archetype deployed to:", archetype.address);

  const archetypeAddress = "0x7Db2cf29f87338d13156B55bb3AF70F482BfCAc4";

  const Factory = await ethers.getContractFactory("Factory");

  const factory = await upgrades.deployProxy(Factory, [archetypeAddress], {
    initializer: "initialize",
  });

  await factory.deployed();

  console.log("Contract Factory deployed to:", factory.address);

  const addresses = {
    proxy: factory.address,
    admin: await upgrades.erc1967.getAdminAddress(factory.address),
    implementation: await upgrades.erc1967.getImplementationAddress(factory.address),
  };

  console.log("Factory addresses:", addresses);

  await sleep(150 * 1000);
  try {
    await run("verify:verify", {
      address: addresses.implementation,
      constructorArguments: [archetypeAddress],
    });
  } catch (e) {}
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

//   async function deployProxy(
//   Contract: ethers.ContractFactory,
//   args: unknown[] = [],
//   opts: {
//     initializer: string | false,
//     unsafeAllow: ValidationError[],
//     kind: 'uups' | 'transparent',
//   } = {},
// ): Promise<ethers.Contract>
