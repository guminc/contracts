import * as dotenv from "dotenv";
import "hardhat-gas-reporter";
import { HardhatUserConfig, task } from "hardhat/config";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-truffle5";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
require("hardhat-log-remover");
require('hardhat-contract-sizer');

const fs = require("fs");
const privateKey = fs.readFileSync(".secret").toString().trim() || "01234567890123456789";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// extendEnvironment((hre) => {
// const Web3 = require("web3");
// hre.network.provider is an EIP1193-compatible provider.
// hre.web3 = new Web3(hre.network.provider);
// });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

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
  //     {
  //       version: "0.5.0",
  //     },
  //   ],
  // },
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      accounts: [privateKey],
      url: "https://goerli.infura.io/v3/569cee6284754b9e86ff2e5e55a0dc22",
      chainId: 5,
      // gas: 2100000,
      // gasPrice: 8000000000000,
      // gasPrice: 200000,
      // gasPrice: 2000000000000000000,
    },
    rinkeby: {
      accounts: [privateKey],
      url: "https://rinkeby.infura.io/v3/569cee6284754b9e86ff2e5e55a0dc22",
      chainId: 4,
      // gas: 2100000,
      // gasPrice: 8000000000000,
      // gasPrice: 200000,
      // gasPrice: 2000000000000000000,
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
    apiKey: process.env.ETHERSCAN_API_KEY || "HDBRZ227RPV6YFG2QY1SCKE6IG3P7FG7R5",
  },
};

export default config;
