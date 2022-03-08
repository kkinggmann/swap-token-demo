const {ethers, upgrades} = require("hardhat");

async function main() {
  [deployer, userX] = await ethers.getSigners();

  const SwapTokenFactory = await ethers.getContractFactory("SwapTokenV2");
  const swapToken = await upgrades.upgradeProxy(
    "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
    SwapTokenFactory
  );

  console.log("Update succescfully");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
