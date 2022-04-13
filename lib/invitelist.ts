import { ethers } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

export default class Invitelist {
  addresses: string[];
  hashedAddresses: Buffer[];
  tree: MerkleTree;

  constructor(addresses: string[]) {
    this.addresses = addresses;
    this.hashedAddresses = addresses.map(this.hash);
    this.tree = new MerkleTree(this.hashedAddresses, keccak256, { sortPairs: true });
  }

  hash(address: string): Buffer {
    return Buffer.from(ethers.utils.solidityKeccak256(["address"], [address]).slice(2), "hex");
  }

  root(): string {
    return this.tree.getHexRoot();
  }

  proof(address: string): any[] {
    return this.tree.getHexProof(this.hash(address));
  }

  verify(address: string, proof: any[]) {
    return this.tree.verify(proof, this.hash(address), this.root());
  }
}
