import { ethers, run } from "hardhat";
import * as readlineSync from 'readline-sync';
import { ArchetypeLogic } from "../typechain";

const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {

  // set to empty for new deploy
  const LIBRARY_ADDRESS: string = "0xE11FcB03d07CDbf3D2870105b6d6BbF78d44acf5" // SEPOLIA 0.6.0
  // const LIBRARY_ADDRESS: string = "0x73cA112A50C4eAb928AaE07aAF96944d431720EF" // MAINNET 0.6.0
  const NAME: string = "my nft"
  const SYMBOL: string = "MYNFT"
  const CONFIG = {
    baseUri: "ipfs://CID/",
    affiliateSigner: "0x1f285dD528cf4cDE3081C6d48D9df7A4F8FA9383",
    ownerAltPayout: ethers.constants.AddressZero,
    superAffiliatePayout: ethers.constants.AddressZero,
    maxSupply: 5000,
    maxBatchSize: 5000,
    affiliateFee: 500,
    platformFee: 500,
    defaultRoyalty: 500,
    discounts: { affiliateDiscount: 0, mintTiers: [] }
  };
  const GATEKEEP_CONFIG = {
    openHour: 11,
    closeHour: 12,
    openMinute: 40,
    closeMinute: 50
  };

  console.log({LIBRARY_ADDRESS, NAME, SYMBOL, CONFIG, GATEKEEP_CONFIG});

  if (!readlineSync.keyInYN('Is the above config correct?')) {
    console.log("config not confirmed. Not deploying contract.");
    process.exit();
  }

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  let archetypeLogic: ArchetypeLogic;
  const ArchetypeLogic = await ethers.getContractFactory("ArchetypeLogic");
  if (LIBRARY_ADDRESS === "") {
    archetypeLogic = await ArchetypeLogic.deploy()
  } else {
    archetypeLogic = ArchetypeLogic.attach(LIBRARY_ADDRESS)
  }


  // Check the library
  const expectedBytecode = (await ethers.getContractFactory("ArchetypeLogic")).bytecode;
  const actualBytecode = await ethers.provider.getCode(archetypeLogic.address);
  const matchRate = calculateMatchRate(expectedBytecode, actualBytecode)

  console.log("ArchetypeLogic bytecode has a match rate of", matchRate)
  if (matchRate > 90) {
    console.log("ArchetypeLogic bytecode match passes");
  } else {
    console.log("ArchetypeLogic bytecode match fails, make sure its the correct address. Exiting ...");
    process.exit(1);
  }

  const Archetype = await ethers.getContractFactory("Archetype", {
    libraries: {
      ArchetypeLogic: archetypeLogic.address,
    },
  });

  const archetype = await Archetype.deploy();

  await archetype.deployed();

  console.log("Archetype deployed to:", archetype.address);

  await archetype.initialize(NAME, SYMBOL, CONFIG, GATEKEEP_CONFIG, deployerAddress)

  console.log("Archetype initialized!");
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
