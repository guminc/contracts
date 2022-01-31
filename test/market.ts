import { BN } from "bn.js";
import {
  web3,
  artifacts,
  contract,
  assert,
  expect,
  ethers,
  upgrades,
} from "hardhat";
import { sign } from "./order";
import { Asset, Order } from "./test-types";
// import { artifacts } from "truffle-contracts";
//
// import truffle from "@nomiclabs/truffle-contract";
// import truffle from "@nomiclabs/truffle-contract";
// const { artifacts } = require("truffle");
// import { artifacts } from "@truffle/artifactor";

// import typings from "truffle-typings";

// typings.
// const { deployProxy, upgradeProxy } = require("@openzeppelin/truffle-upgrades");
const ZERO = "0x0000000000000000000000000000000000000000";
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const TestERC1155 = artifacts.require("TestERC1155.sol");
const ERC1155_V2 = artifacts.require("TestERC1155WithRoyaltiesV2.sol");
const ERC721_V1 = artifacts.require("TestERC721WithRoyaltiesV1.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const LibOrderTest = artifacts.require("LibOrderTest.sol");
const RaribleTransferManagerTest = artifacts.require(
  "RaribleTransferManagerTest.sol"
);
// const truffleAssert = require("truffle-assertions");
const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
// const TestERC721RoyaltyV1OwnUpgrd = artifacts.require(
//   "TestERC721WithRoyaltiesV1OwnableUpgradeable"
// );
// const AssetMatcherCollectionTest = artifacts.require(
//   "AssetMatcherCollectionTest.sol"
// );
const Greeter = artifacts.require("Greeter");

const BUYER_FEE = 0.03;
const SELLER_FEE = 0.03;

const {
  ETH,
  ERC20,
  ERC721,
  ERC1155,
  ORDER_DATA_V1,
  ORDER_DATA_V2,
  TO_MAKER,
  TO_TAKER,
  PROTOCOL,
  ROYALTY,
  ORIGIN,
  PAYOUT,
  CRYPTO_PUNKS,
  COLLECTION,
  enc,
  id,
} = require("./assets.js");

contract("ExchangeV2, sellerFee + buyerFee =  6%,", (accounts) => {
  console.log({ accounts });
  let testing;
  let transferProxy;
  let erc20TransferProxy;
  let transferManagerTest;
  let t1;
  let t2;
  let libOrder;
  let erc721;
  let erc1155V2;
  let erc721V1;
  let protocol = accounts[9];
  let community = accounts[8];
  const eth = "0x0000000000000000000000000000000000000000";
  let erc721TokenId0 = 52;
  let erc721TokenId1 = 53;
  let erc1155TokenId1 = 54;
  let erc1155TokenId2 = 55;
  let royaltiesRegistry;
  let ExchangeV2;

  beforeEach(async () => {
    libOrder = await LibOrderTest.new();
    transferProxy = await TransferProxyTest.new();
    erc20TransferProxy = await ERC20TransferProxyTest.new();
    console.log("c");
    royaltiesRegistry = await TestRoyaltiesRegistry.new();

    console.log("GETTIN CONTRACT");
    ExchangeV2 = await ethers.getContractFactory("ExchangeV2");
    console.log("GOT CONTRACT");
    testing = await upgrades.deployProxy(
      ExchangeV2,
      [
        transferProxy.address,
        erc20TransferProxy.address,
        300,
        community,
        royaltiesRegistry.address,
      ],
      { initializer: "__ExchangeV2_init" }
    );
    await testing.deployed();
    console.log("CONTRACT DEPLOYED");

    transferManagerTest = await RaribleTransferManagerTest.new();
    t1 = await TestERC20.new();
    t2 = await TestERC20.new();
    await testing.setFeeReceiver(eth, protocol);
    await testing.setFeeReceiver(t1.address, protocol);
    /* ERC721 */
    erc721 = await TestERC721.new(
      "Rarible",
      "RARI",
      "https://ipfs.rarible.com"
    );
    /* ERC1155V2 */
    erc1155V2 = await ERC1155_V2.new("https://ipfs.rarible.com");
    erc1155V2.initialize();
    /* ERC721_V1 */
    erc721V1 = await ERC721_V1.new(
      "Rarible",
      "RARI",
      "https://ipfs.rarible.com"
    );
    await erc721V1.initialize();
  });

  describe("matchOrders", () => {
    console.log("MATCH ORDERS");
    it("eth orders work, expect throw, not enough eth ", async () => {
      await t1.mint(accounts[1], 100);
      await t1.approve(erc20TransferProxy.address, 10000000, {
        from: accounts[1],
      });
      const right = Order(
        accounts[1],
        Asset(ERC20, enc(t1.address), 100),
        ZERO,
        Asset(ETH, "0x", 200),
        1,
        0,
        0,
        "0xffffffff",
        "0x"
      );
      const left = Order(
        accounts[2],
        Asset(ETH, "0x", 200),
        ZERO,
        Asset(ERC20, enc(t1.address), 100),
        1,
        0,
        0,
        "0xffffffff",
        "0x"
      );

      const signer = await ethers.getSigner(accounts[2]);
      await expectThrow(
        testing
          .connect(signer)
          .matchOrders(
            left,
            "0x",
            right,
            await getSignature(right, accounts[1]),
            { from: accounts[2], value: 199 }
          )
      );
    });

    it("handle accept highest bid after auction", async () => {
      // Seller needs the NFT and give approval for the NFT to be traded.
      await erc721.mint(accounts[2], erc721TokenId0);
      await erc721.setApprovalForAll(transferProxy.address, true, {
        from: accounts[2],
      });
      // Buyer needs ERC20 tokens, and approval for them to be exchanged.
      await t1.mint(accounts[1], 100000);
      await t1.approve(erc20TransferProxy.address, 10000, {
        from: accounts[1],
      });

      const encDataLeft = await encDataV2([[], [], true]);
      const encDataRight = await encDataV2([[], [], false]);

      const left = Order(
        accounts[2],
        Asset(ERC721, enc(erc721.address, erc721TokenId0), 1),
        ZERO,
        Asset(ERC20, enc(t1.address), 100),
        1,
        0,
        0,
        ORDER_DATA_V2,
        encDataLeft
      );
      const right = Order(
        accounts[1],
        Asset(ERC20, enc(t1.address), 100),
        ZERO,
        Asset(ERC721, enc(erc721.address, erc721TokenId0), 1),
        1,
        0,
        0,
        ORDER_DATA_V2,
        encDataRight
      );

      const signer = await ethers.getSigner(accounts[2]);

      const res = await testing
        .connect(signer)
        .matchOrders(
          left,
          "0x",
          right,
          await getSignature(right, accounts[1]),
          {
            from: accounts[2],
          }
        );
    });
  });

  // Traditional Truffle test
  // contract("Greeter", (accounts) => {
  //   it("Should return the new greeting once it's changed", async function () {
  //     const greeter = await Greeter.new("Hello, world!");
  //     assert.equal(await greeter.greet(), "Hello, world!");

  //     await greeter.setGreeting("Hola, mundo!");

  //     assert.equal(await greeter.greet(), "Hola, mundo!");
  //   });
  // });

  function encDataV1(tuple) {
    return transferManagerTest.encode(tuple);
  }

  function encDataV2(tuple) {
    return transferManagerTest.encodeV2(tuple);
  }

  async function getSignature(order, signer) {
    return sign(order, signer, testing.address);
  }
});

// // Vanilla Mocha test. Increased compatibility with tools that integrate Mocha.
// describe("Greeter contract", function () {
//   let accounts;
//   console.log(accounts);

//   before(async function () {
//     accounts = await web3.eth.getAccounts();
//     console.log({ accounts });
//   });

//   describe("Deployment", function () {
//     it("Should deploy with the right greeting", async function () {
//       const greeter = await Greeter.new("Hello, world!");
//       assert.equal(await greeter.greet(), "Hello, world!");

//       const greeter2 = await Greeter.new("Hola, mundo!");
//       assert.equal(await greeter2.greet(), "Hola, mundo!");
//     });
//   });
// });
