import { ethers, run } from "hardhat";

async function main() {
  const AlienMiladyFumo = await ethers.getContractFactory("AlienMiladyFumo");
  const alienMiladyFumoContract = await AlienMiladyFumo.deploy();
  await alienMiladyFumoContract.deployed();
  console.log("Alien Milady Fumo ERC20 Contract deployed to:", alienMiladyFumoContract.address);

  const fumoErc20Address = alienMiladyFumoContract.address; // use this on Sepolia
  // const fumoErc20Address = "0x2890df158d76e584877a1d17a85fea3aeeb85aa6" // use this on mainnet

  const NFT = await ethers.getContractFactory("FUMOMintable");

  const placeholderAddress = "0x60A59d7003345843BE285c15c7C78B62b61e0d7c";

  const nftContract = await NFT.deploy(placeholderAddress); // this minter param is a placeholder, we'll replace it after we deploy Redeemer

  await nftContract.deployed();

  console.log("NFT Contract deployed to:", nftContract.address);

  const Redeemer = await ethers.getContractFactory("Redeemer");

  const redeemerContract = await Redeemer.deploy(fumoErc20Address, nftContract.address);

  await redeemerContract.deployed();

  console.log("Redeemer Contract deployed to:", redeemerContract.address);

  await nftContract.setMinter(redeemerContract.address);

  await run("verify:verify", {
    address: nftContract.address,
    contract: "contracts/FUMOMintable.sol:FUMOMintable",
    constructorArguments: [placeholderAddress],
  });

  await run("verify:verify", {
    address: redeemerContract.address,
    contract: "contracts/Redeemer.sol:Redeemer",
    constructorArguments: [fumoErc20Address, nftContract.address],
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
