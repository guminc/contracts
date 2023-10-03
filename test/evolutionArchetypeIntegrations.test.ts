import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { IArchetypeConfig } from "../lib/types";
import { createEvoCollection as evoFactory, getRandomFundedAccount } from "../scripts/helpers";
import { EvolutionArchetype } from "../typechain";
import ipfsh from "ipfsh";
import { assert } from "console";
import { expect } from "chai";

const DEFAULT_NAME = "Pookie";
const DEFAULT_SYMBOL = "POOKIE";
const ZERO = ethers.constants.AddressZero;
let AFFILIATE_SIGNER: SignerWithAddress;
const CID_ZERO = "bafkreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
let DEFAULT_CONFIG: IArchetypeConfig;
let createEvoCollection : (
  token_name?: string,
  token_symbol?: string,
  config?: IArchetypeConfig,
  royalties_address?: string
) => Promise<EvolutionArchetype>;

const makePublicList = async (
  nft: EvolutionArchetype,
  price: number = 0.08,
  listLimit: number = 300
) => {

  const maxSupply = DEFAULT_CONFIG.maxSupply
  assert(maxSupply >= listLimit)
  const ownerAddr = await nft.owner()
  const owner = await ethers.getImpersonatedSigner(ownerAddr)

  await nft.connect(owner).setInvite(ethers.constants.HashZero, ipfsh.ctod(CID_ZERO), {
    price: ethers.utils.parseEther(price.toString()),
    start: ethers.BigNumber.from(Math.floor(Date.now() / 1000)),
    end: 0,
    limit: 300,
    maxSupply,
    unitSize: 0,
    tokenAddress: ZERO,
    stakingTime: 0
  })
  
}

const mintPublicList = async (
  nft: EvolutionArchetype,
  account: SignerWithAddress,
  amount: number = 1,
  price: number = 0.08
) => {
  return await nft
    .connect(account)
    .mint(
      { key: ethers.constants.HashZero, proof: [] },
      amount,
      ZERO,
      "0x",
      { value: ethers.utils.parseEther((price * amount).toString()) }
    );

}

describe('EvolutionArchetype integrations', () => {
  before(async () => {
    AFFILIATE_SIGNER = (await ethers.getSigners())[4];
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
    }

    const royaltiesAddress = await getRandomFundedAccount()
    createEvoCollection = (
      token_name = DEFAULT_NAME,
      token_symbol = DEFAULT_SYMBOL,
      config = DEFAULT_CONFIG,
      royalties_address = royaltiesAddress.address
    ) => evoFactory(royalties_address, token_name, token_symbol, config)
    
  })

  it('public token shouldn\'t emite lock events', async () => {
    const nft = await createEvoCollection()

    await makePublicList(nft)
    await expect(
      mintPublicList(nft, await getRandomFundedAccount())
    ).not.emit(nft, 'Locked')

    await expect(
      mintPublicList(nft, await getRandomFundedAccount())
    ).emit(nft, 'Transfer')
  })

  it('public token shouldn\'t be locked', async () => {
    const nft = await createEvoCollection()
    const user = await getRandomFundedAccount()
    await makePublicList(nft)
    await mintPublicList(nft, user).then(tx => tx.wait())
    expect(await nft.locked(1)).false
    await expect(nft.unstake(1)).emit(nft, 'Unlocked')
  })

  it('shouldn\'t let unstake non existent token', async () => {
    const nft = await createEvoCollection()
    await expect(nft.locked(1)).reverted
    await expect(nft.unstake(1)).reverted
  })

  it('shouldn\'t have staked public existent tokens', async () => {
    const nft = await createEvoCollection()
    const user = await getRandomFundedAccount()

    await makePublicList(nft)
    await mintPublicList(nft, user).then(tx => tx.wait())

    expect(await nft.locked(1)).false
    await expect(nft.locked(2)).reverted
  
    const newUser = await getRandomFundedAccount()
    await mintPublicList(nft, newUser, 3).then(tx => tx.wait())

    expect(await nft.locked(1)).false
    expect(await nft.locked(2)).false
    expect(await nft.locked(3)).false
    expect(await nft.locked(4)).false
    await expect(nft.locked(5)).reverted
  })

  it('should let unstake multiple times', async () => {
    const nft = await createEvoCollection()
    const user = await getRandomFundedAccount()
    await makePublicList(nft)
    await mintPublicList(nft, user).then(tx => tx.wait())
    await nft.unstake(1)
    await nft.unstake(1)
    await nft.unstake(1)
  })

})
