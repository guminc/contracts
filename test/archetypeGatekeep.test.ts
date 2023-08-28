import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { 
    ArchetypeGatekeep__factory, 
    ArchetypeGatekeep as IArchetype,
    ArchetypeLogic__factory,
    ArchetypeGatekeep,
    FactoryGatekeep__factory, 
} from "../typechain";
import { IArchetypeConfig } from "../lib/types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import ipfsh from "ipfsh";
import { Contract } from "ethers";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const DEFAULT_NAME = "Pookie";
const DEFAULT_SYMBOL = "POOKIE";
let AFFILIATE_SIGNER: SignerWithAddress;
let DEFAULT_CONFIG: IArchetypeConfig;
// this is an IPFS content ID which stores a list of addresses ({address: string[]})
// eg: https://ipfs.io/ipfs/bafkreih2kyxirba6a6dyzt4tsdqb5iim3soprumtewq6garaohkfknqlaq
// utility for converting CID to bytes32: https://github.com/factoria-org/ipfsh
const CID_DEFAULT = "Qmbro8pnECVvjwWH6J9KyFXR8isquPFNgbUiHDGXhYnmFn";

const CID_ZERO = "bafkreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const ZERO = "0x0000000000000000000000000000000000000000";
const BURN = "0x000000000000000000000000000000000000dEaD";
const HASHONE = "0x0000000000000000000000000000000000000000000000000000000000000001";
const HASH256 = "0x00000000000000000000000000000000000000000000000000000000000000ff";

describe("FactoryGatekeep", function () {
    let Archetype: ArchetypeGatekeep__factory;
    let archetype: IArchetype;
    let ArchetypeLogic: ArchetypeLogic__factory;
    let archetypeLogic: Contract;
    let Factory: FactoryGatekeep__factory;
    let factory: Contract;

    before(async function () {
    AFFILIATE_SIGNER = (await ethers.getSigners())[4]; // account[4]
    DEFAULT_CONFIG = {
      baseUri: "ipfs://bafkreieqcdphcfojcd2vslsxrhzrjqr6cxjlyuekpghzehfexi5c3w55eq",
      affiliateSigner: AFFILIATE_SIGNER.address,
      ownerAltPayout: ZERO,
      superAffiliatePayout: ZERO,
      maxSupply: 5000,
      maxBatchSize: 20,
      affiliateFee: 1500,
      platformFee: 500,
      defaultRoyalty: 500,
      discounts: {
        affiliateDiscount: 0,
        mintTiers: [],
        // [{
        //   numMints: number;
        //   mintDiscount: number;
        // }];
      },
    };

    ArchetypeLogic = await ethers.getContractFactory("ArchetypeLogic");
    archetypeLogic = await ArchetypeLogic.deploy();
    Archetype = await ethers.getContractFactory("ArchetypeGatekeep", {
      libraries: {
        ArchetypeLogic: archetypeLogic.address,
      },
    });

    archetype = await Archetype.deploy();
    await archetype.deployed();

    Factory = await ethers.getContractFactory("FactoryGatekeep");
    factory = await upgrades.deployProxy(Factory, [archetype.address], {
      initializer: "initialize",
    });
    await factory.deployed();

    console.log({ factoryAddress: factory.address, archetypeAddress: archetype.address });
  });
});