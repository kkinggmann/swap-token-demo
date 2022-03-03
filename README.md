# Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```

# Deploy Smart Contract

npx hardhat run scripts/deploy.js --network <network-name>
  
# Verify Smart Contract

npx hardhat verify --constructor-args scripts/arguments.js SMART_CONTRACT_ADDRESS --network <network-name>
