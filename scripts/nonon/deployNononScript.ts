import { ethers, run } from "hardhat";
import ipfsh from "ipfsh";
import type { IArchetypeNononConfig } from "../../lib/types";
import { deployNonon } from "./deployNonon";

const CID_ZERO = "bafkreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

// the actual script that will initiate a deploy of the nonon contracts
async function main() {
  // const sepoliaNononArchetype = "0x3f7e8eF699939A0d870a0E87872228Dff2dCFc9d";
  // const sepoliaFriendCard = "0x0Cb32D3A7D35a7D28c5DD81261D87Fa72c82C725";

  const config: IArchetypeNononConfig = {
    baseUri: "ipfs://bafybeibgqd2sulnrfsunmzfx36tnjabljt6g6mvtfy5eqx4rg6tcvb26ca/",
    affiliateSigner: "0x1f285dD528cf4cDE3081C6d48D9df7A4F8FA9383",
    ownerAltPayout: ethers.constants.AddressZero,
    superAffiliatePayout: ethers.constants.AddressZero,
    friendCardAddress: ethers.constants.AddressZero,
    maxSupply: 5000,
    maxBatchSize: 5000,
    affiliateFee: 1500,
    platformFee: 500,
    defaultRoyalty: 500,
    discounts: { affiliateDiscount: 0, mintTiers: [] },
  };

  const contracts = await deployNonon(config);

  await run("verify:verify", {
    address: contracts.archetypeNonon.address,
    contract: "contracts/Nonon/ArchetypeNonon.sol:ArchetypeNonon",
  });

  await run("verify:verify", {
    address: contracts.archetypeNononLogic.address,
    contract: "contracts/Nonon/ArchetypeNononLogic.sol:ArchetypeNononLogic",
  });

  await run("verify:verify", {
    address: contracts.nononFriendCard.address,
    contract: "contracts/Nonon/NononFriendCard.sol:NononFriendCard",
    constructorArguments: [contracts.archetypeNonon.address],
  });

  // public mint
  await contracts.archetypeNonon.setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
    price: ethers.utils.parseEther("0.05"),
    start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
    end: 0,
    limit: 5000,
    maxSupply: 5000,
    unitSize: 0,
    tokenAddress: ethers.constants.AddressZero,
    isBlacklist: false,
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
