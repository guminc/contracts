const { ethers } = require("ethers");
const fs = require("fs");
const nfts: { _id: any; owner_of: string }[] = require("./holders.json");

const uniqueArr = [
  ...new Set(
    nfts.map(nft => {
      return ethers.utils.getAddress(nft.owner_of);
    })
  ),
];

// console.log(uniqueArr.length);
console.log(uniqueArr.length);
const formattedList = uniqueArr.join("\n");

// fs.writeFileSync("./invitelist.json", JSON.stringify({ addresses: uniqueArr }));
fs.writeFileSync("./uniqueAddresses.json", formattedList);
