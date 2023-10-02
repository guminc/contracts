import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { IArchetypeConfig } from "../lib/types";
import { EvolutionArchetype } from "../typechain";

export const toWei = (x: number) => ethers.utils.parseUnits(x.toString(), 'ether')
export const fromWei = (x: BigNumber) => ethers.utils.formatEther(x)

export const createEvoCollection = async (
  royaltiesAddress: string,
  token_name: string,
  token_symbol: string,
  general_archetype_config: IArchetypeConfig,
  deployer?: SignerWithAddress
) => {
  const [_, d1] = await ethers.getSigners()
  if (!deployer) deployer = d1

  const archetypeLogic = await ethers
    .getContractFactory('EvolutionArchetypeLogic')
    .then(c => c.connect(deployer).deploy())
  

  const nft = await ethers
    .getContractFactory(
        'EvolutionArchetype',
        { libraries: { EvolutionArchetypeLogic: archetypeLogic.address}}
    ).then(c => c.connect(deployer).deploy(token_name, token_symbol))

  await nft.deployed()
  await nft
    .connect(deployer) 
    .initialize(general_archetype_config, royaltiesAddress)
    .then(tx => tx.wait())

  return nft
}

export const getFundedPlatformAccount = async (archetype: EvolutionArchetype) => {
  const platformAddress = await archetype.platform()
  const platformAccount = await ethers.getImpersonatedSigner(platformAddress)
  const [fundedAccount, ] = await ethers.getSigners()
  await fundedAccount.sendTransaction({
    to: platformAddress,
    value: ethers.utils.parseUnits('10', 'ether')
  })
  return platformAccount
};

export const randomAddress = () => `0x${[...Array(40)]
  .map(() => Math.floor(Math.random() * 16).toString(16))
  .join('')}`;

export const getRandomAccount = async () => 
  await ethers.getImpersonatedSigner(randomAddress())

export const getRandomFundedAccount = async (funds: number = 10) => {
  const acc = await getRandomAccount() 
  const [admin, ] = await ethers.getSigners()
  await admin.sendTransaction({to: acc.address, value: toWei(funds)})
  return acc
}

