require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
  paths: {
    cache: "./client/src/cache",
    artifacts: "./client/src/artifacts",
  },
  solidity: "0.8.4",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://localhost:8545",
      chainId: 1337,
    },
    ropsten: {
      url: `https://eth-ropsten.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [`${process.env.ROPSTEN_PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: `${process.env.ETHERSCAN_API_KEY}`,
  },
};
