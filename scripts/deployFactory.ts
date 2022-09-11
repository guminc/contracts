import { ethers, upgrades, run } from "hardhat";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  // const Archetype = await ethers.getContractFactory("Archetype");

  // const archetype = await Archetype.deploy();

  // await archetype.deployed();

  // console.log("Archetype deployed to:", archetype.address);

  // const Factory = await ethers.getContractFactory("Factory");

  // const factory = await upgrades.deployProxy(Factory, [archetype.address], {
  //   initializer: "initialize",
  // });

  // await factory.deployed();

  // console.log("Contract Factory deployed to:", factory.address);

  // const addresses = {
  //   proxy: factory.address,
  //   admin: await upgrades.erc1967.getAdminAddress(factory.address),
  //   implementation: await upgrades.erc1967.getImplementationAddress(factory.address),
  // };

  // console.log("Factory addresses:", addresses);

  // await sleep(150 * 1000);

  const archetype = {
    address: 0xc59202894be018375f535cd42fac60a8d809a567,
  };

  const addresses = {
    proxy: "0xd8F6CeEE1C7cb8014513547b67B7cbD8f76f4a62",
    admin: "0xE2214a831874728EB4a9f22fE51A09B789F21810",
    implementation: "0x1Def6BC418A1791b43786faF4B63c9baFce105F8",
  };

  try {
    await run("verify:verify", {
      address: addresses.implementation,
      constructorArguments: [archetype.address],
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
