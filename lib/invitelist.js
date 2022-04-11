const ethers = require("ethers");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
class Invitelist {
  constructor(addresses) {
    this.addresses = addresses;
    this.hashedAddresses = addresses.map(this.hash);
    this.tree = new MerkleTree(this.hashedAddresses, keccak256, { sortPairs: true });
  }

  hash(address) {
    return Buffer.from(ethers.utils.solidityKeccak256(["address"], [address]).slice(2), "hex");
  }

  root() {
    return this.tree.getHexRoot();
  }

  proof(address) {
    return this.tree.getHexProof(this.hash(address));
  }

  verify(address, proof) {
    return this.tree.verify(proof, this.hash(address), this.root());
  }
}
module.exports = Invitelist;
