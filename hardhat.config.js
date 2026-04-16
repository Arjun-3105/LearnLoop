import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

// Hardhat 2 requires valid hex if provided. We use an empty array if missing.
const privateKey = process.env.PRIVATE_KEY || process.env.RPC_PRIVATE_KEY;
const accounts = privateKey ? [privateKey] : [];

/** @type import('hardhat/config').HardhatUserConfig */
const config = {
  solidity: {
    version: "0.8.24",
    settings: {
      evmVersion: "cancun", // Required for OpenZeppelin 5.6+ (fixes "mcopy" error)
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    sepolia: {
      url: process.env.RPC_URL || process.env.POLYGON_RPC_URL || "https://rpc.ankr.com/eth_sepolia",
      accounts: accounts,
    },
    amoy: {
      url: "https://rpc-amoy.polygon.technology",
      accounts: accounts,
    },
  },
};

export default config;