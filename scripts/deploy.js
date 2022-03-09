const {ethers, upgrades} = require("hardhat");
const {utils} = ethers;
const fs = require("fs");

async function main() {
  [deployer, userX] = await ethers.getSigners();
  const zeroAddress = "0x0000000000000000000000000000000000000000";

  const ERC20TokenFactory = await ethers.getContractFactory("ERC20Token");
  const SwapTokenFactory = await ethers.getContractFactory("SwapToken");

  const tokenA = await upgrades.deployProxy(
    ERC20TokenFactory,
    ["Token A", "TOKA", utils.parseEther("100")],
    {
      initializer: "__ERC20Token_init",
    }
  );

  const tokenB = await upgrades.deployProxy(
    ERC20TokenFactory,
    ["Token B", "TOKB", utils.parseEther("100")],
    {
      initializer: "__ERC20Token_init",
    }
  );

  const tokenPool = await upgrades.deployProxy(SwapTokenFactory, [], {
    initializer: "__Swap_init",
  });

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

  const result = `export const tokenAAddress = "${tokenA.address}";\nexport const tokenBAddress = "${tokenB.address}";\nexport const tokenPoolAddress = "${tokenPool.address}";`;

  fs.writeFileSync(`${process.cwd()}/client/src/config.js`, result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
