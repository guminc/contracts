import fs from "fs";
import { ethers, run, upgrades } from "hardhat";
import { ArchetypeNononLogic } from "../typechain";

async function main() {
  // set to empty for new deploy
  const LIBRARY_ADDRESS: string = ""; // localhost
  // const LIBRARY_ADDRESS: string = "0xE11FcB03d07CDbf3D2870105b6d6BbF78d44acf5" // SEPOLIA 0.6.0
  // const LIBRARY_ADDRESS: string = "0x73cA112A50C4eAb928AaE07aAF96944d431720EF" // MAINNET 0.6.0

  const NAME: string = "nonon";
  const SYMBOL: string = "NONON";

  const CONFIG = {
    baseUri: "ipfs://CID/",
    affiliateSigner: "0x1f285dD528cf4cDE3081C6d48D9df7A4F8FA9383",
    ownerAltPayout: ethers.constants.AddressZero,
    superAffiliatePayout: ethers.constants.AddressZero,
    friendCardAddress: ethers.constants.AddressZero,
    maxSupply: 5000,
    maxBatchSize: 5000,
    affiliateFee: 500,
    platformFee: 500,
    defaultRoyalty: 500,
    discounts: { affiliateDiscount: 0, mintTiers: [] },
  };

  console.log({ LIBRARY_ADDRESS, NAME, SYMBOL, CONFIG });

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  let archetypeNononLogic: ArchetypeNononLogic;
  const ArchetypeLogic = await ethers.getContractFactory("ArchetypeNononLogic");
  if (LIBRARY_ADDRESS === "") {
    archetypeNononLogic = await ArchetypeLogic.deploy();
  } else {
    archetypeNononLogic = ArchetypeLogic.attach(LIBRARY_ADDRESS);
  }

  // Check the library
  const expectedBytecode = (await ethers.getContractFactory("ArchetypeNononLogic")).bytecode;
  const actualBytecode = await ethers.provider.getCode(archetypeNononLogic.address);
  const matchRate = calculateMatchRate(expectedBytecode, actualBytecode);

  console.log("ArchetypeNononLogic bytecode has a match rate of", matchRate);
  if (matchRate > 90) {
    console.log("ArchetypeNononLogic bytecode match passes");
  } else {
    console.log(
      "ArchetypeNononLogic bytecode match fails, make sure its the correct address. Exiting ..."
    );
    process.exit(1);
  }

  const ArchetypeNonon = await ethers.getContractFactory("ArchetypeNonon", {
    libraries: {
      ArchetypeNononLogic: archetypeNononLogic.address,
    },
  });

  const archetypeNonon = await ArchetypeNonon.deploy();

  await archetypeNonon.deployed();

  console.log("Archetype (nonon ver.) deployed to:", archetypeNonon.address);

  await archetypeNonon.initialize(NAME, SYMBOL, CONFIG, deployerAddress);

  console.log("Archetype (nonon ver.) initialized!");

  /// *** additional nonon setup transactions *** ///

  // deploy friend card
  const NononFriendCard = await ethers.getContractFactory("NononFriendCard");
  const nononFriendCard = await NononFriendCard.deploy(archetypeNonon.address);
  console.log("nonon friend card deployed to:", nononFriendCard.address);

  // set friend card addr in nonon token config
  await archetypeNonon.setFriendCardAddress(nononFriendCard.address);

  // set friend card svgs, by passing the bytes to be saved
  const baseSvgBytes: Buffer = fs.readFileSync("contracts/Nonon/img/base.svg");
  const defsSvgBytes: Buffer = fs.readFileSync("contracts/Nonon/img/defs.svg");
  const spritesSvgBytes: Buffer = fs.readFileSync("contracts/Nonon/img/sprites.svg");

  await Promise.all([
    nononFriendCard.setBaseSvgPointer(baseSvgBytes),
    nononFriendCard.setDefsSvgPointer(defsSvgBytes),
    nononFriendCard.setSpritesSvgPointer(spritesSvgBytes),
  ]).then(() => console.log("Set friend card SVG bytes"));

  console.log("nonon deployment complete!");
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
