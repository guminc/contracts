import fs from "fs";
import { ethers } from "hardhat";
import type { ArchetypeNonon, ArchetypeNononLogic, NononFriendCard } from "../../typechain";
import type { IArchetypeNononConfig } from "../../lib/types";

export interface NononContracts {
  archetypeNonon: ArchetypeNonon;
  archetypeNononLogic: ArchetypeNononLogic;
  nononFriendCard: NononFriendCard;
}

export async function deployNonon(
  config: IArchetypeNononConfig,
  libraryAddress?: string
): Promise<NononContracts> {
  const NAME: string = "nonon";
  const SYMBOL: string = "NONON";

  const CONFIG = config;
  const LIBRARY_ADDRESS = libraryAddress || "";

  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  let archetypeNononLogic: ArchetypeNononLogic;
  const ArchetypeLogic = await ethers.getContractFactory("ArchetypeNononLogic");
  if (LIBRARY_ADDRESS === "") {
    console.log("deploying archetype nonon logic");
    archetypeNononLogic = await ArchetypeLogic.deploy();
    await archetypeNononLogic.deployed();
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

  console.log("deploying Archetype (nonon ver.)");
  const archetypeNonon = await ArchetypeNonon.deploy();
  await archetypeNonon.deployed();
  console.log("Archetype (nonon ver.) deployed to:", archetypeNonon.address);

  console.log("initializing...");
  await archetypeNonon.initialize(NAME, SYMBOL, CONFIG, deployerAddress);
  console.log("Archetype (nonon ver.) initialized!");

  /// *** additional nonon setup transactions *** ///

  // deploy friend card
  console.log("deploying nonon friend card...");
  const NononFriendCard = await ethers.getContractFactory("NononFriendCard");
  const nononFriendCard = await NononFriendCard.deploy(archetypeNonon.address);
  await nononFriendCard.deployed();

  console.log("nonon friend card deployed to:", nononFriendCard.address);

  // set friend card addr in nonon token config
  console.log("setting nonon friend card address in archetype token contract...");
  const setFriendCardTx = await archetypeNonon.setFriendCardAddress(nononFriendCard.address);
  await setFriendCardTx.wait();

  console.log("set archetype nonon config: friend card address to: ", nononFriendCard.address);

  // set friend card svgs, by passing the bytes to be saved
  const baseSvgBytes: Buffer = fs.readFileSync("contracts/Nonon/img/base.svg");
  const defsSvgBytes: Buffer = fs.readFileSync("contracts/Nonon/img/defs.svg");
  const spritesSvgBytes: Buffer = fs.readFileSync("contracts/Nonon/img/sprites.svg");

  const setBaseSvgTx = await nononFriendCard.setBaseSvgPointer(baseSvgBytes);
  console.log(`sent base svg bytes transaction. waiting for tx: ${setBaseSvgTx.hash}`);
  await setBaseSvgTx.wait();
  console.log("done");

  const setDefsSvgTx = await nononFriendCard.setDefsSvgPointer(defsSvgBytes);
  console.log(`sent defs svg bytes transaction. waiting for tx: ${setDefsSvgTx.hash}`);
  await setDefsSvgTx.wait();
  console.log("done");

  const setSpritesSvgTx = await nononFriendCard.setSpritesSvgPointer(spritesSvgBytes);
  console.log(`sent sprites svg bytes transaction. waiting for tx: ${setSpritesSvgTx.hash}`);
  await setSpritesSvgTx.wait();
  console.log("done");

  console.log("finished setting friend card SVG bytes");
  console.log("nonon deployment complete!");

  return {
    archetypeNonon,
    archetypeNononLogic,
    nononFriendCard,
  };
}

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
