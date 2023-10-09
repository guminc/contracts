import { ethers } from "hardhat";
import * as readlineSync from "readline-sync";
import * as fs from "fs";
import { parse } from "csv-parse";
import { ArchetypeBatch } from "../typechain";
const path = require("path");

async function parseCsv(csvString: string): Promise<any[]> {
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
  const BATCH_ADDRESS: string = "0x6Bc558A6DC48dEfa0e7022713c23D65Ab26e4Fa7"; // MAINNET

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

  const TOKEN_ADDRESS: string = "0x750ee3529D13819E00E4e67063D6e500870d5AF3";
  const tokenContract = await ethers.getContractAt("IERC1155", TOKEN_ADDRESS);

  const csvContent = fs.readFileSync(path.join(__dirname, "./data/mondo_transfer.csv"), "utf-8");
  const records = await parseCsv(csvContent);

  const recipientList = records.map(record => record["ETH Address"]);
  const quantityList = records.map(record => record["Amount"]);
  console.log({ recipientList, quantityList });

  const ownedTokenIds = [
    213, 237, 172, 169, 247, 211, 177, 140, 151, 241, 232, 230, 142, 188, 249, 228, 211, 245, 152,
    157, 163, 187,
  ];

  const [signer] = await ethers.getSigners();
  console.log(`Distributing tokens from address: ${signer.address}`);

  // Formulate the calls
  const targets: string[] = [];
  const values: number[] = [];
  const datas: string[] = [];

  let i = 0;
  for (let j = 0; j < recipientList.length; j++) {
    for (let k = 0; k < quantityList[j]; k++) {
      targets.push(TOKEN_ADDRESS); // This remains the token address for each entry
      values.push(0); // This remains 0 for each entry

      console.log({ receiver: recipientList[j], tokenId: ownedTokenIds[i], quantity: 1 });
      const data = tokenContract.interface.encodeFunctionData("safeTransferFrom", [
        signer.address,
        recipientList[j],
        ownedTokenIds[i],
        1,
        "0x",
      ]);

      datas.push(data);
      i++;
    }
  }

  console.log({ targets, values, datas, tokenIdsToSend: ownedTokenIds });

  if (!readlineSync.keyInYN("Are the above values correct?")) {
    console.log("config not confirmed. Not sending eth.");
    process.exit();
  }

  const tx = await archetypeBatch.executeBatch(targets, values, datas);
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
