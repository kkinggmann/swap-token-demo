const hre = require("hardhat");

async function main() {
  const ERC20Token = await hre.ethers.getContractFactory("ERC20Token");
  const SwapToken = await hre.ethers.getContractFactory("SwapToken");

  const tokenA = await ERC20Token.deploy("Token A", "TOKA", 100, 18);
  const tokenB = await ERC20Token.deploy("Token B", "TOKB", 100, 18);
  const poolToken = await SwapToken.deploy();

  await tokenA.deployed();
  await tokenB.deployed();
  await poolToken.deployed();

  console.log("Token A deployed to:", tokenA.address);
  console.log("Token B deployed to:", tokenB.address);
  console.log("Pool Token deployed to:", poolToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
