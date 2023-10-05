import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { EvolutionArchetype } from "../typechain";

export const toWei = (x: number) => ethers.utils.parseUnits(x.toString(), 'ether')
export const fromWei = (x: BigNumber) => ethers.utils.formatEther(x)

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

export const randomAddress = () => {
  const random20hexes = `0x${[...Array(40)]
    .map(() => Math.floor(Math.random() * 16).toString(16))
    .join('')}`
  return ethers.utils.getAddress(random20hexes)
}

export const getRandomAccount = async () => 
  await ethers.getImpersonatedSigner(randomAddress())

export const getRandomFundedAccount = async (funds: number = 10) => {
  const acc = await getRandomAccount() 
  const [admin, ] = await ethers.getSigners()
  await admin.sendTransaction({to: acc.address, value: toWei(funds)})
  return acc
}

/**
 * @description In a product type, converts all optional fields into required.
 */
export type All<T> = {
    [K in keyof T]-?: T[K]    
}

export const sleep = (ms: number) => 
    new Promise(resolve => setTimeout(resolve, 1000 * ms));

