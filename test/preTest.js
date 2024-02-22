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
    "0x6Bc558A6DC48dEfa0e7022713c23D65Ab26e4Fa7",
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );
  data = data.replace(
    "0xe9191E06EaA1b32997FFAFB9a2AbBab525518Fa8",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
  );

  // Write the updated data to the contract file
  fs.writeFileSync(filePath, data, "utf8");
}

const contractPath = path.resolve(__dirname, "../contracts/ArchetypeLogic.sol");
const originalFile = fs.readFileSync(contractPath, "utf8");
fs.writeFileSync("./contracts/ArchetypeLogic.sol.bak", originalFile);
replaceConstants(contractPath);
