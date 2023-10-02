import { ethers, run } from "hardhat";
import fs from "fs"; // Import fs module

async function main() {
  // const contracts = await (
  //   await fetch("https://scatter-api.fly.dev/api/fetchHotCollections")
  // ).json();

  const contracts = [
    "0xdDc6625FEcA10438857DD8660C021Cd1088806FB",
    "0x088f21a9f387aa4395836344c6bb26d0c207b8d4",
    "0x365F721a522A7Fc66d08449C4f3984D1E36D58dC",
    "0x726516B20c4692a6beA3900971a37e0cCf7A6BFf",
    "0x3fd77fda258fa66f30579ca4b1250651a2462bad",
    "0xAFCdd4f666c84Fed1d8BD825aA762e3714F652c9",
    "0x544613F087aC194ABa134Be08F9c699c0050ebD1",
    "0xA381e7073EA828Fb963157DcC4b414DA4344e3Fd",
    "0xEE526EB643A8cD392a853B533582183721eFEB5D",
    "0xF03D5fC6E08dE6Ad886fCa34aBF9a59ef633b78a",
    "0x3007083EAA95497cD6B2b809fB97B6A30bdF53D3",
    "0x07E0EDf8ce600FB51d44F51E3348D77D67F298ae",
    "0x6AF36AdD4E2F6e8A9cB121450d59f6C30F3F3722",
    "0x6e08B5D1169765f94d5ACe5524F56E8ac75B77c6",
    "0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a",
    "0x802d0359e1308C32D13264be9Bf248b06660D4E3",
    "0x72e4f9F808C49A2a61dE9C5896298920Dc4EEEa9",
    "0xbbBa7FaB56Db7c471b2094e6f132A88130Ae2C94",
    "0xf03d5fc6e08de6ad886fca34abf9a59ef633b78a",
    "0x3D806324b6Df5AF3c1a81aCbA14A8A62Fe6D643F",
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    "0x0000000000000000000000000000000000000000",
    "0x1A963Df363D01EEBB2816b366d61C917F20e1EbE",
    "0x36d7aa5c67efd83992fc5cbc488cc2f9ba7689b8",
    "0x79DB761B6E0f426152052eeD399E3Fbb1922Fae3",
    "0x0a693a301215aad39d83a32a5b5279f2d238851b",
    "0xf072dDC2f80f490b4D507d04424E112CCF307386",
    "0xB22C05CeDbF879a661fcc566B5a759d005Cf7b4C",
    "0xc83aedf16f508539763bb7c1d86ff6f9ae97d9e3",
    "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84",
    "0x088F21A9f387aa4395836344c6Bb26D0C207B8D4",
    "0xE59aCBE910dcdb8a0E79F337de4391907Dc8989c",
    "0x2890dF158D76E584877a1D17A85FEA3aeeB85aa6",
    "0x51187Cab377eD5E1386042919A9C3D6b5ea402f0",
    "0xa12fe47a20c3a13773da0e5c0c05b35223a9054a",
    "0x427A03Fb96D9A94A6727fbcfbBA143444090dd64",
    "0xddc6625feca10438857dd8660c021cd1088806fb",
    "0x1142866f451d9d5281c5c8349a332bd338e552a1",
    "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    "0x9416bA76e88D873050A06e5956A3EBF10386b863",
    "0xa12fe47A20C3a13773DA0E5c0C05b35223a9054a",
    "0xB90B2A35C65dBC466b04240097Ca756ad2005295",
    "0x30BCd71b8d21FE830e493b30e90befbA29de9114",
    "0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C",
    "0x6982508145454ce325ddbe47a25d4ec3d2311933",
    "0xb5c0fb97512cabb70d8b164639416cee9d54b5be",
    "0xDe950e159655cA981cb46d4ccfE251Ba8D6c7772",
    "0x8cbf530219037cEC95Db91Db8EeeCB3661968865",
    "0x72e4f9f808c49a2a61de9c5896298920dc4eeea9",
    "0x5A9BEe6cFb395f93d426A41B93C647E05D058EAb",
    "0x423f4e6138E475D85CF7Ea071AC92097Ed631eea",
    "0xD3D9ddd0CF0A5F0BFB8f7fcEAe075DF687eAEBaB",
    "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
    "0xa358491CA72B793ddf21cF46C7289CC6e0ce9e5A",
    "0x04E6cA1EaA6622858Ef07E26496f627f4Cb8A0cc",
    "0xaaee1a9723aadb7afa2810263653a34ba2c21c7a",
    "0x2890df158d76e584877a1d17a85fea3aeeb85aa6",
    "0xC56bC8232eaA35Af16167c946436a0F9b66B4c1A",
    "0x9657477ac915F56ca87C253db1320218Ec2D5DDD",
  ];

  // scatter-api.fly.dev/api/contracts

  // Prepare the file with the header
  const filename = "getERC20Names.csv";

  fs.writeFileSync(filename, "name,symbol,address\n"); // Initialize the CSV file with headers

  for (const contract of contracts) {
    try {
      const archetype = await ethers.getContractAt("Archetype", contract);
      const name = await archetype.name();
      const symbol = await archetype.symbol();

      console.log(symbol, name, contract);

      // Append to the CSV file
      fs.appendFileSync(filename, `${symbol},${name},${contract}\n`); // Append the row to the CSV file
    } catch (e) {
      console.log(contract, "not Archetype");
      continue;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
