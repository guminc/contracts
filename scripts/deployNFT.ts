import { ethers, run } from "hardhat";

async function main() {
  const NFTContract = await ethers.getContractFactory("ScatterNFT");

  const nftContract = await NFTContract.deploy("Pookie", "POOKIE");

  await nftContract.deployed();

  console.log("Contract deployed to:", nftContract.address);

  // await run("verify:verify", {
  //   address: nftContract.address,
  //   contract: "contracts/NFT.sol:ScatterNFT",
  //   constructorArguments: ["Pookie", "POOKIE"],
  // });

  // await run("verify:verify", {
  //   address: "0xb15051a3259223174AF1338118B60a55a7eCEDC0",
  //   contract: "contracts/NFT.sol:ScatterNFT",
  //   constructorArguments: ["Pookie", "POOKIE"],
  // });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
