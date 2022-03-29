import { ethers } from "hardhat";

// const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const factoryAddress = "0x7E3E71E5C1ab135Bb5ab6bfca1be2f97daFbF2dd";

  const NFTContractFactory = await ethers.getContractFactory("NFTContractFactory");

  const nftContractFactory = NFTContractFactory.attach(factoryAddress);

  const res = await nftContractFactory.createNFTContract(
    "Pookie",
    "POOKIE",
    "ipfs://QmNsrxoVdgkBbHH7qemsoHYvoxgW8wQ2KTwE5G1LdLXEJW/",
    ethers.BigNumber.from("10000000000000000"),
    5000,
    20
  );

  console.log({ res });

  // await sleep(60 * 1000);

  // await run("verify:verify", {
  //   address: nftContractFactory.address,
  //   constructorArguments: [],
  // });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
