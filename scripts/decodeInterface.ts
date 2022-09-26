import { ethers } from "hardhat";
import { CID } from "multiformats/cid";
import * as json from "multiformats/codecs/json";
import { sha256 } from "multiformats/hashes/sha2";
import { base64 } from "multiformats/bases/base64";
import { base58btc } from "multiformats/bases/base58";

async function main() {
  const archetypeJson = require("../artifacts/contracts/Archetype.sol/Archetype.json");
  const archetypeAbi = archetypeJson.abi;

  console.log({ archetypeAbi });

  const iface = new ethers.utils.Interface(archetypeAbi);
  console.log({ iface });
  const error = iface.getError("0x233067ae");
  console.log({ error });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
