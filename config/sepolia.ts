const SEPOLIA_CONFIG = {
  chain: {
    chainId: 11155111,
    explorerURL: "https://sepolia.etherscan.io"
  },
  defaultAddress: {
    MultiSigOwner1: "0x36fFf5b6168f6c7B38b1226eaf49408eBa1Ab148",
    MultiSigOwner2: "0x0D7524fa3F8f23E1EbE883146905AeD8578aB20B",
    MultiSigOwner3: "0x5e97e6EB042A9f3D55C7016253E7e1D91FaE8aEC",
    FeeReceiver: "0x1271CAba4bf23f8Fb31F97448605d65EE302CA51",
  }, 
  deployedAddress: {
    MultiSigWalletWithTimelock: "0x5dd1930135DB26bE19b6E6962d555E46AdA4B62E",
    Multicall: "0x2B3427Ca2cD474f53E49774c7A7084239F66C453",
  },
};

export { SEPOLIA_CONFIG };
