import { ethers, run } from "hardhat";

async function main() {
  const NFTContract = await ethers.getContractFactory("Remilia");

  const nftContract = await NFTContract.deploy("Pookie", "POOKIE", {
    unrevealedUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
    baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
    affiliateSigner: "0x1f285dD528cf4cDE3081C6d48D9df7A4F8FA9383",
    maxSupply: 5000,
    maxBatchSize: 20,
    affiliateFee: 1500,
    platformFee: 500,
  });

  await nftContract.deployed();

  console.log("Contract deployed to:", nftContract.address);

  // await run("verify:verify", {
  //   address: nftContract.address,
  //   contract: "contracts/Remilia.sol:Remilia",
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
