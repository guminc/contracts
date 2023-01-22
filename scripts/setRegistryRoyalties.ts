import { ethers } from "hardhat";

async function main() {
  // console.log({ accounts });
  try {
    // const SIGNING_WALLET = "0x8E94188034136dCE2BE62C10EaA5471EAf23E86B";
    const ROYALTIES_REGISTRY = "0x5735e502d3568ddfadfc7a2fe4313b00f63d4f98";
    const NFT_COLLECTION = "0xDe6B6090D32eB3eeae95453eD14358819Ea30d33";
    const ROYALTIES_RECIPIENT = "0xEcE89437Ba3bEf4566E0DBE734dB139351e361fb";

    const Registry = await ethers.getContractFactory("RoyaltiesRegistry");
    //const registry = await Registry.attach('0x5FbDB2315678afecb367f032d93F642f64180aa3');
    const registry = await Registry.attach(ROYALTIES_REGISTRY);

    // const mySigner = await ethers.getSigner(SIGNING_WALLET);

    // const res2 = await registry
    //   .connect(mySigner)
    //   .functions.setRoyaltiesByToken(NFT_COLLECTION, [[SIGNING_WALLET, 500]]);
    const res2 = await registry.functions.setRoyaltiesByToken(NFT_COLLECTION, [
      { account: ROYALTIES_RECIPIENT, value: 500 },
    ]);

    console.log({ res2 });

    const res = await registry.functions.royaltiesByToken(NFT_COLLECTION);

    console.log({ res });
  } catch (error) {
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
