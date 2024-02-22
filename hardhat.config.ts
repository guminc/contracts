import * as dotenv from "dotenv";
import "hardhat-gas-reporter";
import { HardhatUserConfig, task } from "hardhat/config";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@nomiclabs/hardhat-truffle5";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
require("hardhat-log-remover");
require("hardhat-contract-sizer");

dotenv.config();

const privateKey = process.env.PRIVATE_KEY || "";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // solidity: {
  //   compilers: [
  //     {
  //       version: "0.7.6",
  //     },
  //   ],
  // },
  defaultNetwork: "hardhat",
  networks: {
    sepolia: {
      accounts: [privateKey],
      url: "https://sepolia.infura.io/v3/569cee6284754b9e86ff2e5e55a0dc22",
      chainId: 11155111,
    },
    goerli: {
      accounts: [privateKey],
      url: "https://goerli.infura.io/v3/569cee6284754b9e86ff2e5e55a0dc22",
      chainId: 5,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      gas: 6000000,
      chainId: 31337,
      // gasPrice: 200000,
      // gasPrice: "2000000000000000000",
      minGasPrice: 0,
    },
    mainnet: {
      accounts: [privateKey],
      url: "https://mainnet.infura.io/v3/569cee6284754b9e86ff2e5e55a0dc22",
      chainId: 1,
    },
    hardhat: {},
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};

export default config;
