// Creates interface over Command Prompt
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

module.exports = readline;
