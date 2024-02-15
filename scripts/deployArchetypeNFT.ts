import { ethers, run } from "hardhat";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  const Factory = await ethers.getContractFactory("Factory");

  const factory = Factory.attach("0x516a48750D7f906A4dF2F0fC106C95fC9f43069B");

  console.log("Contract Factory is:", factory.address);

  const newContract = await factory.createCollection(
    "0x60A59d7003345843BE285c15c7C78B62b61e0d7c",
    "test 404",
    "404",
    {
      baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
      affiliateSigner: "0x1f285dD528cf4cDE3081C6d48D9df7A4F8FA9383",
      ownerAltPayout: ethers.constants.AddressZero,
      superAffiliatePayout: ethers.constants.AddressZero,
      maxSupply: 5000,
      maxBatchSize: 20,
      affiliateFee: 1500,
      platformFee: 500,
      defaultRoyalty: 500,
      discounts: { affiliateDiscount: 0, mintTiers: [] },
    }
  );

  console.log({ newContract });

  const result = await newContract.wait();

  console.log({ result });

  const newCollectionAddress = result.events[0].address || "";
  console.log({ newCollectionAddress });

  // await sleep(1000 * 120);

  // await run("verify:verify", {
  //   address: newCollectionAddress,
  //   constructorArguments: [],
  // });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

// const _accounts = [
//   "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
//   "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
//   "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
//   "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
//   "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
//   "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
//   "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
//   "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
//   "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
//   "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
//   "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
//   "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
//   "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
//   "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
//   "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
//   "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
//   "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
//   "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
//   "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
//   "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
// ];
