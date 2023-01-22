import { ethers, upgrades, run } from "hardhat";

async function main() {
  const NFT = await ethers.getContractFactory("F0");

  const nft = await NFT.deploy();

  await nft.deployed();

  console.log("Contract deployed to:", nft.address);

  // await run("verify:verify", {
  //   address: nft.address,
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
