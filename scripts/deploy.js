const {ethers} = require("hardhat");
const {utils} = ethers;

async function main() {
  [deployer, userX] = await ethers.getSigners();
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const ERC20Token = await ethers.getContractFactory("ERC20Token");
  const SwapToken = await ethers.getContractFactory("SwapToken");

  const tokenA = await ERC20Token.deploy("Token A", "TOKA", 100, 18);
  const tokenB = await ERC20Token.deploy("Token B", "TOKB", 100, 18);
  const tokenPool = await SwapToken.deploy();

  await tokenA.deployed();
  await tokenB.deployed();
  await tokenPool.deployed();

  await tokenA.transfer(tokenPool.address, utils.parseEther("0.5"));
  await tokenB.transfer(tokenPool.address, utils.parseEther("0.5"));
  await userX.sendTransaction({
    to: tokenPool.address,
    value: utils.parseEther("0.5"),
  });

  await tokenPool.setTokenRate(tokenA.address, tokenB.address, 1, 1);
  await tokenPool.setTokenRate(tokenB.address, tokenA.address, 10, 0);

  await tokenPool
    .connect(deployer)
    .setTokenRate(tokenA.address, zeroAddress, 1, 3);
  await tokenPool
    .connect(deployer)
    .setTokenRate(zeroAddress, tokenA.address, 1000, 0);

  await tokenPool
    .connect(deployer)
    .setTokenRate(tokenB.address, zeroAddress, 1, 2);
  await tokenPool
    .connect(deployer)
    .setTokenRate(zeroAddress, tokenB.address, 100, 0);

  console.log("Token A deployed to:", tokenA.address);
  console.log("Token B deployed to:", tokenB.address);
  console.log("Pool Token deployed to:", tokenPool.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
