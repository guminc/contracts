let fs = require("fs");
let path = require("path");

const contractPath = path.resolve(__dirname, "../contracts/ArchetypeLogic.sol");
const backupFilePath = path.resolve(__dirname, "../contracts/ArchetypeLogic.sol.bak");
const backupFile = fs.readFileSync(backupFilePath, "utf8");
fs.writeFileSync(contractPath, backupFile);

// Delete the backup file
fs.unlinkSync(backupFilePath);
