import { ethers } from "hardhat";
import * as readlineSync from "readline-sync";
import * as fs from "fs";
import { parse } from "csv-parse";
import { ArchetypeBatch } from "../typechain";
const path = require("path");

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

async function main() {
  // const BATCH_ADDRESS: string = "0x0e1356208CA2eB9Cc4EFaEb42cc8287CB7ED8e1F"; // SEPOLIA
  const BATCH_ADDRESS: string = "0x6Bc558A6DC48dEfa0e7022713c23D65Ab26e4Fa7"; // MAINNET

  // Check the batch contract
  const archetypeBatch: ArchetypeBatch = await ethers.getContractAt(
    "ArchetypeBatch",
    BATCH_ADDRESS
  );
  const expectedBytecode = (await ethers.getContractFactory("ArchetypeBatch")).bytecode;
  const actualBytecode = await ethers.provider.getCode(archetypeBatch.address);
  const matchRate = calculateMatchRate(expectedBytecode, actualBytecode);

  console.log("ArchetypeBatch bytecode has a match rate of", matchRate);
  if (matchRate > 90) {
    console.log("ArchetypeBatch bytecode match passes");
  } else {
    console.log(
      "ArchetypeBatch bytecode match fails, make sure its the correct address. Exiting ..."
    );
    process.exit(1);
  }

  const csvContent = fs.readFileSync(path.join(__dirname, "./data/refundList.csv"), "utf-8");
  const records = await parseCsv(csvContent);

  const balances: { [address: string]: ethers.BigNumber } = {};
  let totalValue = ethers.BigNumber.from(0);
  for (const record of records) {
    try {
      const address = ethers.utils.getAddress(record.address);
      const value = ethers.utils.parseEther(record.value);

      if (!balances[address]) {
        balances[address] = value;
      } else {
        balances[address] = balances[address].add(value);
      }
      totalValue = totalValue.add(value);
    } catch {
      continue;
    }
  }

  console.log(balances);
  console.log({
    totalValue: totalValue,
    totalValueFormatted: ethers.utils.formatEther(totalValue),
  });

  if (!readlineSync.keyInYN("Are the above values correct?")) {
    console.log("config not confirmed. Not sending eth.");
    process.exit();
  }

  // Formulate the calls
  const targets = Object.keys(balances);
  const values = Object.values(balances).map(v => v.toString());
  const datas = targets.map(() => "0x");

  const tx = await archetypeBatch.executeBatch(targets, values, datas, { value: totalValue });
  const receipt = await tx.wait();

  console.log(`Transaction hash: ${receipt.transactionHash}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

/*
  Uses a sliding window approach, chunkBytecode produces overlapping chunks.
  E.g., for "ABCDEF" and chunk size 3, we get ["ABC", "BCD", "CDE", "DEF"].
  This ensures better matching, especially when bytecodes have minor offsets.
*/
function calculateMatchRate(bytecode1: string, bytecode2: string): number {
  function chunkBytecode(bytecode: string, chunkSize: number): string[] {
    const chunks = [];
    for (let i = 0; i <= bytecode.length - chunkSize; i++) {
      chunks.push(bytecode.slice(i, i + chunkSize));
    }
    return chunks;
  }

  const chunkSize = 10;
  const chunks1 = chunkBytecode(bytecode1, chunkSize);
  const chunks2 = new Set(chunkBytecode(bytecode2, chunkSize));

  const commonChunks = chunks1.filter(chunk => chunks2.has(chunk)).length;

  const maxPossibleMatches = Math.max(chunks1.length, chunks2.size);
  return (commonChunks / maxPossibleMatches) * 100;
}
