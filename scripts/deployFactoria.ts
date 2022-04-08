import { ethers, run, upgrades } from "hardhat";

// const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const Factory = await ethers.getContractFactory("Factory");

  const factory = await Factory.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // const factory = await Factory.deploy();

  // await factory.deployed();

  // const Factory = await ethers.getContractFactory("Factory");

  // const factory = await upgrades.deployProxy(Factory, []);

  // await factory.deployed();

  // console.log("Contract Factory deployed to:", factory.address);

  const newContract = await factory.genesis(
    "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199",
    "Pookie",
    "POOKIE",
    {
      placeholder: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
      base: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
      supply: 5000,
      permanent: false,
    }
  );

  console.log({ newContract });

  // await sleep(60 * 1000);

  // await run("verify:verify", {
  //   address: factory.address,
  //   constructorArguments: [],
  // });
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
