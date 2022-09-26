import { ethers, upgrades, run } from "hardhat";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const Archetype = await ethers.getContractFactory("Archetype");

  const archetype = await Archetype.deploy();

  await archetype.deployed();

  console.log("Archetype deployed to:", archetype.address);

  const Factory = await ethers.getContractFactory("Factory");

  const factory = await upgrades.deployProxy(Factory, [archetype.address], {
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

  // await sleep(150 * 1000);

  // Archetype deployed to: 0x93Bbaa422F10ed3b9bD2424175Cf6A56AB5d7bBd
  // Contract Factory deployed to: 0x2eA29C115dBcE49F3df1fD4EcB6Fc82c635BAD76
  // Factory addresses: {
  //   proxy: '0x2eA29C115dBcE49F3df1fD4EcB6Fc82c635BAD76',
  //   admin: '0xE2214a831874728EB4a9f22fE51A09B789F21810',
  //   implementation: '0xc078Aed674c230cDD7ADD602E077797d08d8f0c2'
  // }

  // try {
  //   await run("verify:verify", {
  //     address: addresses.implementation,
  //     constructorArguments: [archetype.address],
  //   });
  // } catch (e) {}
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
