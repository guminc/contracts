import { ethers } from "hardhat";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {
  const contracts = await (await fetch("https://scatter-api.fly.dev/api/contracts")).json();

  // Prepare to write to a CSV file
  const filePath = path.join(__dirname, "balances.csv");
  const header = "Contract Address,Owner Balance,Platform Balance\n";
  fs.writeFileSync(filePath, header, { encoding: "utf8" });

  let totalPlat = 0;
  for (const contract of contracts.body) {
    try {
      const archetype = await ethers.getContractAt("Archetype", contract);
      const balance = await archetype.ownerBalance();
      const ownerBalance = ethers.utils.formatEther(balance.owner);
      const platformBalance = ethers.utils.formatEther(balance.platform);
      console.log(contract, "platform:", platformBalance, "owner:", ownerBalance);
      totalPlat += Number(platformBalance);

      // Write the contract data to the CSV file
      const line = `${contract},${ownerBalance},${platformBalance}\n`;
      fs.appendFileSync(filePath, line, { encoding: "utf8" });
    } catch (e) {
      console.error(e);
      console.log(contract, "not Archetype");
    }
  }

  console.log("total platform:", totalPlat);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
