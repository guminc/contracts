import { ethers, run } from "hardhat";
import fetch from "node-fetch";
import fs from "fs"; // Import fs module
const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {
  const contracts = await (
    await fetch("https://scatter-api.fly.dev/api/fetchHotCollections")
  ).json();

  // scatter-api.fly.dev/api/contracts

  // Prepare the file with the header
  const filename = "getWithdrawable.csv";
  fs.writeFileSync(filename, "name,address,platform,owner\n"); // Initialize the CSV file with headers

  let totalPlat = 0;
  for (const contract of contracts.body) {
    try {
      const archetype = await ethers.getContractAt("Archetype", contract.token_address);
      const balance = await archetype.ownerBalance();

      const platform = ethers.utils.formatEther(balance.platform);
      const owner = ethers.utils.formatEther(balance.owner);

      console.log(contract.name, "platform:", platform, "owner:", owner);

      // Append to the CSV file
      fs.appendFileSync(
        filename,
        `${contract.name},${contract.token_address},${platform},${owner}\n`
      ); // Append the row to the CSV file

      totalPlat += Number(platform);
    } catch (e) {
      console.log(contract.name, "not Archetype");
      continue;
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
