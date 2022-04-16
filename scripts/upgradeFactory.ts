// copied from https://github.com/chiru-labs/ERC721A/blob/main/docs/upgradeable.md
// scripts/upgrade.js
const { ethers, upgrades, run } = require("hardhat");
const fs = require("fs");

async function main() {
  const Something = await ethers.getContractFactory("Something");
  console.log("Upgrading...");
  let addresses = JSON.parse(fs.readFileSync("deployment-addresses.json"));
  await upgrades.upgradeProxy(addresses.proxy, Something);
  console.log("Upgraded");

  addresses = {
    proxy: addresses.proxy,
    admin: await upgrades.erc1967.getAdminAddress(addresses.proxy),
    implementation: await upgrades.erc1967.getImplementationAddress(addresses.proxy),
  };
  console.log("Addresses:", addresses);

  try {
    await run("verify", { address: addresses.implementation });
  } catch (e) {}

  fs.writeFileSync("deployment-addresses.json", JSON.stringify(addresses));
}

main();
