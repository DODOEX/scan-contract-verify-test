import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@nomiclabs/hardhat-ethers";
import "@matterlabs/hardhat-zksync";
import "@okxweb3/hardhat-explorer-verify";
import "hardhat-deploy";
import "hardhat-contract-sizer";
import dotenv from "dotenv";

dotenv.config();

const TRUFFLE_DASHBOARD_RPC = "http://localhost:24012/rpc";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.6.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  zksolc: {
    version: "1.5.0", // Uses latest available in https://github.com/matter-labs/zksolc-bin
    settings: {},
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    sepolia: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 11155111,
      deploy: ["./deploy/sepolia/"],
    },
    bitlayer: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 200901,
      deploy: ["./deploy/bitlayer/"],
    },
    zircuit_testnet: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 48899,
      deploy: ["./deploy/zircuit_testnet/"],
    },
    zircuit: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 48900,
      deploy: ["./deploy/zircuit/"],
    },
    xlayer: {
      url: TRUFFLE_DASHBOARD_RPC,
      chainId: 196,
      deploy: ["./deploy/xlayer/"],
    },
    zero_testnet: {
      url: "https://rpc.zerion.io/v1/zero-sepolia",
      chainId: 4457845,
      zksync: true,
      ethNetwork: "sepolia",
      accounts: [process.env.PRIVATE_KEY ?? ""],
      verifyURL:
        "https://api-explorer.zero.network/contract/contract_verification",
      deploy: ["./deploy/zero_testnet/"],
    },
    zero_mainnet: {
      url: "https://zero-network.calderachain.xyz",
      chainId: 543210,
      zksync: true,
      ethNetwork: "mainnet",
      accounts: [process.env.PRIVATE_KEY ?? ""],
      verifyURL:
        "https://zero-network.calderaexplorer.xyz/verification/contract_verification",
      deploy: ["./deploy/zero_mainnet/"],
    },
  },
  okxweb3explorer: {
    apiKey: process.env.OKLINK_API_KEY ?? "",
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY ?? "",
      bitlayer: "1234",
      zircuit: process.env.ZIRCUIT_API_KEY ?? "",
      zero_mainnet: process.env.ZERO_MAINNET_API_KEY ?? "33232323",
    },
    customChains: [
      {
        network: "goerli",
        chainId: 5,
        urls: {
          apiURL: "https://api-goerli.etherscan.io/api",
          browserURL: "https://goerli.etherscan.io",
        },
      },
      {
        network: "bitlayer",
        chainId: 200901,
        urls: {
          apiURL: "https://api.btrscan.com/scan/api",
          browserURL: "https://www.btrscan.com",
        },
      },
      {
        network: "zircuit_testnet",
        chainId: 48899,
        urls: {
          apiURL: "https://explorer.zircuit.com/api/contractVerifyHardhat",
          browserURL: "https://explorer.zircuit.com",
        },
      },
      {
        network: "zircuit",
        chainId: 48900,
        urls: {
          apiURL: "https://explorer.zircuit.com/api/contractVerifyHardhat",
          browserURL: "https://explorer.zircuit.com",
        },
      },
      {
        network: "zero_testnet",
        chainId: 4457845,
        urls: {
          apiURL:
            "https://api-explorer.zero.network/contract/contract_verification",
          browserURL: "https://explorer.zero.network",
        },
      },
      {
        network: "zero_mainnet",
        chainId: 543210,
        urls: {
          apiURL: "https://zero-network.calderaexplorer.xyz/api",
          browserURL: "https://zero-network.calderaexplorer.xyz",
        },
      },
    ],
  },
};

export default config;
