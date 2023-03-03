import { ethers, upgrades, run } from "hardhat";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const ArchetypeLogic = await ethers.getContractFactory("ArchetypeLogic");
  const archetypeLogic = await ArchetypeLogic.deploy();
  const Archetype = await ethers.getContractFactory("Archetype", {
    libraries: {
      ArchetypeLogic: archetypeLogic.address,
    },
  });

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

  // Archetype deployed to: 0x6e77e2514F75ECe71b6e5abC1a4d96Cc012eFB4e
  // Uh, Contract Factory deployed to: 0x69C96B9a0a091252C7A9b6D221D443641eDf7BD4
  // Factory addresses: {
  //   proxy: '0x69C96B9a0a091252C7A9b6D221D443641eDf7BD4',
  //   admin: '0xc90A3419941dC2311745346B01450988116D6910',
  //   implementation: '0x690eb624DFBd36f83a8092E3F586b733Df827baA'
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
