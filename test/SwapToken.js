const {expect} = require("chai");
const {ethers, waffle} = require("hardhat");
const {utils} = ethers;

describe("SwapToken", function () {
  let tokenPool;
  let tokenA;
  let tokenB;
  let deployer;
  let userX;
  let userY;
  const zeroAddress = "0x0000000000000000000000000000000000000000";
  const provider = waffle.provider;

  beforeEach(async function () {
    [deployer, userX, userY] = await ethers.getSigners();

    const ERC20Token = await ethers.getContractFactory("ERC20Token");
    const SwapToken = await ethers.getContractFactory("SwapToken");

    tokenA = await ERC20Token.deploy("Token A", "TOKA", 100, 18);
    tokenB = await ERC20Token.deploy("Token B", "TOKB", 100, 18);
    tokenPool = await SwapToken.deploy();

    await tokenA.transfer(tokenPool.address, utils.parseEther("0.5"));
    await tokenB.transfer(tokenPool.address, utils.parseEther("0.5"));
    await userX.sendTransaction({
      to: tokenPool.address,
      value: utils.parseEther("0.5"),
    });

    await tokenPool.setTokenRate(tokenA.address, tokenB.address, 2, 5);
    await tokenPool.setTokenRate(tokenB.address, tokenA.address, 50000, 0);

    await tokenPool
      .connect(deployer)
      .setTokenRate(tokenA.address, zeroAddress, 2, 5);
    await tokenPool
      .connect(deployer)
      .setTokenRate(zeroAddress, tokenA.address, 50000, 0);
  });

  it("exchange native token to native token", async function () {
    await expect(
      tokenPool.connect(userY).swap(zeroAddress, zeroAddress, 0, {
        value: utils.parseEther("0.0000001"),
      })
    ).to.be.revertedWith("Two exchange token must be different");
  });

  context("exchange native token to erc20 token", async function () {
    it("0.0000001 native token to 0.005 token A", async function () {
      await tokenPool.connect(userY).swap(zeroAddress, tokenA.address, 0, {
        value: utils.parseEther("0.0000001"),
      });

      const userYTokens = await tokenA.balanceOf(userY.address);
      const poolTokens = await tokenA.balanceOf(tokenPool.address);
      const poolWeiBalance = await provider.getBalance(tokenPool.address);

      expect(userYTokens.toString()).equal(utils.parseEther("0.005"));
      expect(poolTokens.toString()).equal(
        utils.parseEther((0.5 - 0.005).toString())
      );
      expect(poolWeiBalance).equal("500000100000000000");
    });

    it("0 native token to 0.005 token A", async function () {
      await expect(
        tokenPool.connect(userY).swap(zeroAddress, tokenA.address, 0, {
          value: 0,
        })
      ).to.be.revertedWith("Ether amount must be greater than zero");
    });

    it("with token rate invalid", async function () {
      await tokenPool
        .connect(deployer)
        .setTokenRate(zeroAddress, tokenA.address, 0, 0);

      await expect(
        tokenPool.connect(userY).swap(zeroAddress, tokenA.address, 0, {
          value: utils.parseEther("0.0000001"),
        })
      ).to.be.revertedWith("Token rate must be greater than zero");
    });
  });

  context("exchange erc20 token to native token", async function () {
    beforeEach(async function () {
      await tokenA.transfer(userY.address, utils.parseEther("1"));

      await tokenA
        .connect(userY)
        .approve(tokenPool.address, utils.parseEther("0.005"));
    });

    it("0.005 token A to 0.0000001 native token", async function () {
      await tokenPool
        .connect(userY)
        .swap(tokenA.address, zeroAddress, utils.parseEther("0.005"));

      const userYTokens = await tokenA.balanceOf(userY.address);
      const poolTokens = await tokenA.balanceOf(tokenPool.address);
      const poolWeiBalance = await provider.getBalance(tokenPool.address);

      expect(userYTokens.toString()).equal(
        utils.parseEther((1 - 0.005).toString())
      );
      expect(poolWeiBalance).equal(
        utils.parseEther((0.5 - 0.0000001).toString())
      );
      expect(poolTokens.toString()).equal(utils.parseEther("0.505"));
    });

    it("0 token A to 0.0000001 native token", async function () {
      await expect(
        tokenPool.connect(userY).swap(tokenA.address, zeroAddress, 0)
      ).to.be.revertedWith("Token amount must be greater than zero");
    });
  });

  context("exchange erc20 token to erc20 token", async function () {
    it("0.005 token A to 0.0000001 token B", async function () {
      await tokenA.transfer(userY.address, utils.parseEther("0.5"));

      const initialUserYTokenABalance = await tokenA.balanceOf(userY.address);
      const initialPoolTokenABalance = await tokenA.balanceOf(
        tokenPool.address
      );
      const initialUserYTokenBBalance = await tokenB.balanceOf(userY.address);
      const initialPoolTokenBBalance = await tokenB.balanceOf(
        tokenPool.address
      );

      await tokenA
        .connect(userY)
        .approve(tokenPool.address, utils.parseEther("0.005"));

      await tokenPool
        .connect(userY)
        .swap(tokenA.address, tokenB.address, utils.parseEther("0.005"));

      const finalUserYTokenABalance = await tokenA.balanceOf(userY.address);
      const finalPoolTokenABalance = await tokenA.balanceOf(tokenPool.address);
      const finalUserYTokenBBalance = await tokenB.balanceOf(userY.address);
      const finalPoolTokenBBalance = await tokenB.balanceOf(tokenPool.address);

      expect(finalUserYTokenABalance.toString()).equal(
        initialUserYTokenABalance.sub(utils.parseEther("0.005")).toString()
      );
      expect(finalPoolTokenABalance.toString()).equal(
        initialPoolTokenABalance.add(utils.parseEther("0.005")).toString()
      );
      expect(finalUserYTokenBBalance.toString()).equal(
        initialUserYTokenBBalance.add(utils.parseEther("0.0000001")).toString()
      );
      expect(finalPoolTokenBBalance.toString()).equal(
        initialPoolTokenBBalance.sub(utils.parseEther("0.0000001")).toString()
      );
    });

    it("0.0000001 token B to 0.005 token A", async function () {
      await tokenB.transfer(userY.address, utils.parseEther("0.5"));

      const initialUserYTokenABalance = await tokenA.balanceOf(userY.address);
      const initialPoolTokenABalance = await tokenA.balanceOf(
        tokenPool.address
      );
      const initialUserYTokenBBalance = await tokenB.balanceOf(userY.address);
      const initialPoolTokenBBalance = await tokenB.balanceOf(
        tokenPool.address
      );

      await tokenB
        .connect(userY)
        .approve(tokenPool.address, utils.parseEther("0.0000001"));

      await tokenPool
        .connect(userY)
        .swap(tokenB.address, tokenA.address, utils.parseEther("0.0000001"));

      const finalUserYTokenABalance = await tokenA.balanceOf(userY.address);
      const finalPoolTokenABalance = await tokenA.balanceOf(tokenPool.address);
      const finalUserYTokenBBalance = await tokenB.balanceOf(userY.address);
      const finalPoolTokenBBalance = await tokenB.balanceOf(tokenPool.address);

      expect(finalUserYTokenBBalance.toString()).equal(
        initialUserYTokenBBalance.sub(utils.parseEther("0.0000001")).toString()
      );
      expect(finalPoolTokenBBalance.toString()).equal(
        initialPoolTokenBBalance.add(utils.parseEther("0.0000001")).toString()
      );
      expect(finalUserYTokenABalance.toString()).equal(
        initialUserYTokenABalance.add(utils.parseEther("0.005")).toString()
      );
      expect(finalPoolTokenABalance.toString()).equal(
        initialPoolTokenABalance.sub(utils.parseEther("0.005")).toString()
      );
    });
  });
});
