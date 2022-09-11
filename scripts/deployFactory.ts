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

  console.log("Uh, Contract Factory deployed to:", factory.address);

  const addresses = {
    proxy: factory.address,
    admin: await upgrades.erc1967.getAdminAddress(factory.address),
    implementation: await upgrades.erc1967.getImplementationAddress(factory.address),
  };

  console.log("Factory addresses:", addresses);

  // await sleep(150 * 1000);

  // Archetype deployed to: 0x48B8b452B2a5dDAF6bB64ceA3E8C06E75dD01ce9
  // Contract Factory deployed to: 0xB12524e93c54d1489978Bcf6cF7DF3ED9D45E3fE
  // Factory addresses: {
  //   proxy: '0xB12524e93c54d1489978Bcf6cF7DF3ED9D45E3fE',
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
