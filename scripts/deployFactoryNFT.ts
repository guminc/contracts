import { ethers, run, upgrades } from "hardhat";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const Factory = await ethers.getContractFactory("Factory");

  const factory = Factory.attach("0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9");

  // const factory = await Factory.deploy();

  // await factory.deployed();

  // const factory = await upgrades.deployProxy(Factory, [], { initializer: "initialize" });

  // await factory.deployed();

  console.log("Contract Factory deployed to:", factory.address);

  const newContract = await factory.createCollection(
    "0x8e8665bE566a0953bBEdACA5D6261F2F33113Ff1",
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

  await sleep(1000 * 5);

  const result = await newContract.wait();

  console.dir({ logs: result.logs });

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
