import { ethers, run } from "hardhat";
import fetch from "node-fetch";
import fs from "fs"; // Import fs module
const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {
  // const contracts = await (
  //   await fetch("https://scatter-api.fly.dev/api/fetchHotCollections")
  // ).json();

  const contracts = [
    "0xc0a1271687ec0B8AB8edDa560F0f6A62488204C2",
    "0x69491B875B2DA3CA3e02Ae7b4A08827ce3198ad4",
    "0x67063f01D24b55C66D2802dF1Dd019f241338303",
    "0xC735b0BE4955c8bABd41F8F9bc88c9b296CB3fea",
    "0x98003b0512138e08c4410De5C8CDD2dC67742FB6",
    "0x9D9524DB652d2D23c3CB4fb24d5e654bB07bC376",
    "0x83777291535223DBf2685d314fBb2A38bB120626",
    "0x4D259D525eab5C05442f86b9a83A68BA286c37F3",
    "0x83777291535223DBf2685d314fBb2A38bB120626",
    "0xC48657E9EcbDd6c43173F10d1e71E2cf8708d888",
  ];

  // scatter-api.fly.dev/api/contracts

  // Prepare the file with the header
  const filename = "getWithdrawableTokens.csv";
  const ERC20_ADDRESS = "0xaaee1a9723aadb7afa2810263653a34ba2c21c7a";

  fs.writeFileSync(filename, "name,address,platform,owner\n"); // Initialize the CSV file with headers

  let totalPlat = 0;
  for (const contract of contracts) {
    try {
      const archetype = await ethers.getContractAt("Archetype", contract);
      const balance = await archetype.ownerBalanceToken(ERC20_ADDRESS);
      const name = await archetype.name();

      const platform = ethers.utils.formatUnits(balance.platform, 8);
      const owner = ethers.utils.formatUnits(balance.owner, 8);

      console.log(name, contract, "platform:", platform, "owner:", owner);

      // Append to the CSV file
      fs.appendFileSync(filename, `${name},${contract},${platform},${owner}\n`); // Append the row to the CSV file

      totalPlat += Number(platform);
    } catch (e) {
      console.log(contract, "not Archetype");
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
