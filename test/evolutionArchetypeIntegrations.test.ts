import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers, upgrades } from "hardhat";
import { IArchetypeConfig } from "../lib/types";
import { All, getContractAddress, getRandomFundedAccount, randomAddress, sleep, toWei } from "../scripts/helpers";
import { EvolutionArchetype } from "../typechain";
import ipfsh from "ipfsh";
import { assert } from "console";
import { expect } from "chai";
import { BigNumberish } from "ethers";
import Invitelist from "../lib/invitelist";


const DEFAULT_NAME = "Pookie";
const DEFAULT_SYMBOL = "POOKIE";
const ZERO = ethers.constants.AddressZero;
let AFFILIATE_SIGNER: SignerWithAddress;
const CID_DEFAULT = "Qmbro8pnECVvjwWH6J9KyFXR8isquPFNgbUiHDGXhYnmFn";
const CID_ZERO = "bafkreiaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
let DEFAULT_CONFIG: IArchetypeConfig;
let createEvoCollection : (
  token_name?: string,
  token_symbol?: string,
  config?: IArchetypeConfig,
  royalties_address?: string
) => Promise<EvolutionArchetype>;

type Invite = {
  price?: BigNumberish,
  start?: BigNumberish,
  end?: BigNumberish,
  limit?: BigNumberish, // List limit per wallet.
  maxSupply?: BigNumberish, // List max supply.
  unitSize?: BigNumberish,
  stakingTime?: BigNumberish,
  tokenAddress?: string
}

const defaultList = {
  price: 0.08,
  start: undefined,
  end: 0,
  limit: 300,
  maxSupply: undefined, 
  unitSize: 0,
  tokenAddress: ZERO,
  stakingTime: 0
}

/**
 * @param nft EvolutionArchetype contract to add the invite list to.
 * @param list List with all addresses eligible for the new invite list.
 * @param invite Config for the invite list.
 */
const makeList = async (
  nft: EvolutionArchetype,
  list: string[] = [], // List of addresses allowed to mint in the list, empty if public.
  invite: Invite = defaultList
) => {
    if (typeof invite.price === 'number')
      invite.price = toWei(invite.price)

    if (!invite.start)
      invite.start = ethers.BigNumber.from(Math.floor(Date.now() / 1000))

    const maxSupply = await nft.config().then(c => c.maxSupply)

    if (!invite.maxSupply)
      invite.maxSupply = maxSupply
  
    assert(maxSupply >= invite.maxSupply)
    assert(maxSupply >= invite.limit)

    const inviteList = list.length == 0
      ? undefined
      : new Invitelist(list)

    const owner = await nft.owner().then(ethers.getImpersonatedSigner)

    await nft.connect(owner).setInvite(
      inviteList? inviteList.root() : ethers.constants.HashZero,
      inviteList? ipfsh.ctod(CID_DEFAULT) : ipfsh.ctod(CID_ZERO),
      invite as All<Invite>
    ).then(tx => tx.wait())

    return inviteList
}

const makePublicList = async (
  nft: EvolutionArchetype,
  price: number = 0.08,
  listLimit: number = 300
) => await makeList(
  nft,
  [],
  { ...defaultList, price, limit: listLimit }
)

const makeFreeStakeableList = async (
  nft: EvolutionArchetype,
  eligibleAddresses: string[],
  stakingTime: number = 10, // 10 seconds.
  listLimit: number = 300
) => await makeList(
  nft,
  eligibleAddresses,
  { ...defaultList, stakingTime, limit: listLimit, price: 0 }
)


const mintPublicList = async (
  nft: EvolutionArchetype,
  account: SignerWithAddress,
  amount: number = 1,
  price: number = 0.08
) => await nft
  .connect(account)
  .mint(
    { key: ethers.constants.HashZero, proof: [] },
    amount,
    ZERO,
    "0x",
    { value: ethers.utils.parseEther((price * amount).toString()) }
  );

const mintFreeStakeableList = async (    
  nft: EvolutionArchetype,
  minter: SignerWithAddress,
  list: Invitelist,
  amount: number = 1
) => await nft
  .connect(minter)
  .mint(
    { key: list.root(), proof: list.proof(minter.address) },
    amount,
    ZERO,
    "0x",
    { value: 0 }
  )


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
  
    const evoArchetypeLogic = await ethers
      .getContractFactory('EvolutionArchetypeLogic')
      .then(c => c.deploy())

    const EvoArchetype = await ethers.getContractFactory(
      'EvolutionArchetype',
      { libraries: { EvolutionArchetypeLogic: evoArchetypeLogic.address } }
    )
    const evoArchetype = await EvoArchetype.deploy()

    const Factory = await ethers.getContractFactory('EvolutionFactory')
    const factory = await upgrades
      .deployProxy(
        Factory, [evoArchetype.address], {initializer: 'initialize'}
      )
      .then(contract => Factory.attach(contract.address))
     
    const royaltiesAddress = await getRandomFundedAccount()
    createEvoCollection = async (
      token_name = DEFAULT_NAME,
      token_symbol = DEFAULT_SYMBOL,
      config = DEFAULT_CONFIG,
      royalties_address = royaltiesAddress.address
    ) => {
      const txReceipt = await factory.createCollection(
        royalties_address,
        token_name,
        token_symbol,
        config
      ).then(tx => tx.wait())
      const newEvoContractAddress = txReceipt.events[0].address
      return EvoArchetype.attach(newEvoContractAddress)
    }
    
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

  it('should emit staking event on free staking mint', async () => {
    const nft = await createEvoCollection()
    const user = await getRandomFundedAccount()
    const list = await makeFreeStakeableList(nft, [user.address])
    await expect(mintFreeStakeableList(nft, user, list)).emit(nft, 'Locked')
  })

  it('shouldn\'t be able to tx on staking mint', async () => {
    const nft = await createEvoCollection()
    const user = await getRandomFundedAccount()
    const alt = randomAddress()
    const stakingTime = 3 // 3 secs.

    const list = await makeFreeStakeableList(nft, [user.address], stakingTime)
    await mintFreeStakeableList(nft, user, list).then(tx => tx.wait())
    await expect(
      nft.connect(user).transferFrom(user.address, alt, 1)
    ).revertedWith('TokenStaked')
  })

  it('should be able to tx after staking finished', async () => {
    const nft = await createEvoCollection()
    const user = await getRandomFundedAccount()
    const alt = randomAddress()
    const stakingTime = 3 // 3 secs.

    const list = await makeFreeStakeableList(nft, [user.address], stakingTime)
    await mintFreeStakeableList(nft, user, list).then(tx => tx.wait())
    await sleep(stakingTime)
    await nft.connect(user).transferFrom(user.address, alt, 1)
  })

  it('shouldn\'t be able to unstake after staking finished', async () => {
    const nft = await createEvoCollection()
    const user = await getRandomFundedAccount()
    const stakingTime = 3 // 3 secs.

    const list = await makeFreeStakeableList(nft, [user.address], stakingTime)
    await mintFreeStakeableList(nft, user, list).then(tx => tx.wait())
    await expect(nft.connect(user).unstake(1)).revertedWith('TokenStaked')
  })

  it('should be able to unstake and tx after staking finished', async () => {
    const nft = await createEvoCollection()
    const user = await getRandomFundedAccount()
    const alt = randomAddress()
    const stakingTime = 3 // 3 secs.

    const list = await makeFreeStakeableList(nft, [user.address], stakingTime)
    await mintFreeStakeableList(nft, user, list).then(tx => tx.wait())
    await sleep(stakingTime)
    await nft.connect(user).unstake(1)
    await nft.connect(user).transferFrom(user.address, alt, 1)
    expect(await nft.ownerOf(1)).eq(alt)
  })

})
