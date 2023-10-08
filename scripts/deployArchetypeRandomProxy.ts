import { ethers, run, upgrades } from "hardhat";
import * as readlineSync from "readline-sync";
import * as fs from "fs";
import { parse } from "csv-parse";
const path = require("path");

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
function parseCsv(csvString: string): Promise<any[]> {
  const options = {
    columns: true,
    skip_empty_lines: true,
  };
  return new Promise((resolve, reject) => {
    parse(csvString, options, (err, output) => {
      if (err) {
        reject(err);
      } else {
        resolve(output);
      }
    });
  });
}

async function getTokenPool() {
  const csvContent = fs.readFileSync(path.join(__dirname, "./data/card_details.csv"), "utf-8");
  const records = await parseCsv(csvContent);

  // const rarityDistribution = {
  //   R1: 35,
  //   R2: 30,
  //   R3: 25,
  //   R4: 15,
  //   R5: 10,
  //   R6: 1,
  // };
  const rarityDistribution = {
    R1: 37,
    R2: 34,
    R3: 24,
    R4: 21,
    R5: 10,
    R6: 1,
  };

  const tokenPool = [];

  for (const record of records) {
    const tokenId = Number(record["Token ID"]);
    const rarity = record.Rarity;
    const distributionCount = rarityDistribution[rarity];
    console.log(tokenId);

    for (let i = 0; i < distributionCount; i++) {
      tokenPool.push(tokenId);
    }
  }

  return tokenPool;
}

async function main() {
  const [signer] = await ethers.getSigners();

  const ArchetypeLogic = await ethers.getContractFactory("ArchetypeLogic");
  const archetypeLogic = await ArchetypeLogic.deploy();
  const Archetype = await ethers.getContractFactory("Archetype", {
    libraries: {
      ArchetypeLogic: archetypeLogic.address,
    },
  });

  const name = "Mondo Megabits";
  const symbol = "MONDO";
  const baseUri = "ipfs://bafybeic4botsnh3bhog7userbrrvjhanqzs7hkkgisixnycqljxboik26m/";
  const affiliateSigner = "0x1f285dD528cf4cDE3081C6d48D9df7A4F8FA9383";
  const affiliateDiscount = 1000;
  const affiliateFee = 2000;
  const tokenPool = await getTokenPool();
  const maxSupply = tokenPool.length;

  console.log({
    name,
    symbol,
    baseUri,
    affiliateSigner,
    affiliateDiscount,
    affiliateFee,
    tokenPool,
    "tokenPool.length": tokenPool.length,
    maxSupply,
  });

  if (!readlineSync.keyInYN("Are the above values correct?")) {
    console.log("config not confirmed. Not sending eth.");
    process.exit();
  }

  const achetypeProxy = await upgrades.deployProxy(
    Archetype,
    [
      name,
      symbol,
      {
        baseUri: baseUri,
        affiliateSigner: affiliateSigner,
        maxSupply: maxSupply,
        tokenPool: tokenPool,
        maxBatchSize: 100,
        affiliateFee: affiliateFee,
        platformFee: 500,
        ownerAltPayout: ethers.constants.AddressZero,
        superAffiliatePayout: ethers.constants.AddressZero,
        defaultRoyalty: 500,
        discounts: { affiliateDiscount: affiliateDiscount, mintTiers: [] },
      },
      signer.address,
    ],
    {
      initializer: "initialize",
      unsafeAllowLinkedLibraries: true,
    }
  );

  console.log({ achetypeProxy });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
