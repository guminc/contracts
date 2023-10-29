import ethers from "ethers";
import type { IArchetypeNononConfig } from "../../lib/types";
import { deployNonon } from "./deployNonon";

// the actual script that will initiate a deploy of the nonon contracts
async function main() {
  const config: IArchetypeNononConfig = {
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

  await deployNonon(config);

  // add verify
  // add invite tiers
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
