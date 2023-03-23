import { ethers, run } from "hardhat";
import fetch from 'node-fetch';
const ZERO = "0x0000000000000000000000000000000000000000";

async function main() {
    const contracts = await (await fetch('https://scatter-api.fly.dev/api/contracts')).json()

    let totalPlat = 0
    for(const contract of contracts.body) {
        // const archetype = Archetype.attach(contract);
        try{
            const archetype = await ethers.getContractAt("Archetype", contract);
            const balance = await archetype.ownerBalance();
            console.log(contract, "platform:", ethers.utils.formatEther(balance.platform), "owner:", ethers.utils.formatEther(balance.owner));
            totalPlat += Number(ethers.utils.formatEther(balance.platform))
        } catch(e) {
            console.log(contract, "not Archetype");
            continue
        }
    }

    console.log("total platform:", totalPlat)
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
