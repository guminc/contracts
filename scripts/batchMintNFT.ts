import { ethers, run } from "hardhat";
const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {
  const Archetype = await ethers.getContractFactory("Archetype");
  const archetype = Archetype.attach("0xc5BF13d0e5648E318a6B1DD78cA34ECd185E7D40");

  // mint tokens from owner to air drop list
  const airDropList: [string, number][] = [];
  for (let i = 0; i < 1000; i++) {
    airDropList.push([ethers.Wallet.createRandom().address, 2]);
  }

  console.log(airDropList);

  // mint in n txs (can handle about 500 owners per tx with 3mil gas limit)
  const splits = 2;
  function splitToChunks(array, parts) {
    const copied = [...array];
    const result = [];
    for (let i = parts; i > 0; i--) {
      result.push(copied.splice(0, Math.ceil(copied.length / i)));
    }
    return result;
  }
  const airDropListSplit = splitToChunks(airDropList, splits);
  for (const split of airDropListSplit) {
    const result = await archetype.batchMintTo(
      { key: ethers.constants.HashZero, proof: [] },
      split.map(list => list[0]),
      split.map(list => list[1]),
      ZERO,
      "0x",
      {
        value: ethers.utils.parseEther("0.00"),
        // gasLimit: 30000000 // manually set gas limit to 30 million (block limit)
      }
    );

    const msg = await result.wait();
    console.log({ msg });
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
