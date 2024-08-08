const fs = require("fs");
const path = require("path");

async function replaceConstants(filePath) {
  let data = fs.readFileSync(filePath, "utf8");

  // Replace mainnet constants with test values
  data = data.replace(
    "0x86B82972282Dd22348374bC63fd21620F7ED847B",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
  );
  data = data.replace(
    "0xEa49e7bE310716dA66725c84a5127d2F6A202eAf",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );
  data = data.replace(
    "0xaAfdfA4a935d8511bF285af11A0544ce7e4a1199",
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  );

  // Write the updated data to the contract file
  fs.writeFileSync(filePath, data, "utf8");
}

const contractPath = path.resolve(__dirname, "../contracts/ArchetypeLogic.sol");
const originalFile = fs.readFileSync(contractPath, "utf8");
fs.writeFileSync("./contracts/ArchetypeLogic.sol.bak", originalFile);
replaceConstants(contractPath);
