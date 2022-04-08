import { ethers, run, upgrades } from "hardhat";

// const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const Factory = await ethers.getContractFactory("Factory");

  const factory = Factory.attach("0x1Cf45Fe4b14dFd2B582447c890610c9B865784f5");

  // const factory = await Factory.deploy();

  // await factory.deployed();

  // const factory = await upgrades.deployProxy(Factory, [], { initializer: "initialize" });

  // await factory.deployed();

  console.log("Contract Factory deployed to:", factory.address);

  const newContract = await factory.genesis(
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
