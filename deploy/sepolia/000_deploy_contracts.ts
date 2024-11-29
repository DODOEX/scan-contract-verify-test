import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { SEPOLIA_CONFIG as config } from "../../config/sepolia";
import { BigNumber } from "@ethersproject/bignumber";
import * as dotenv from 'dotenv';
dotenv.config();

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await main();

  async function main() {
    await deployMultiSigWalletWithTimelock();
    await deployMulticall();
  }

  async function deployContract(name: string, contract: string, args?: any[], verify?: boolean) {
    if (typeof args == 'undefined') {
      args = []
    }
    if (typeof verify == 'undefined') {
      verify = false
    }
    const deployedAddress = config.deployedAddress[name as keyof typeof config.deployedAddress]
    if (!deployedAddress || deployedAddress == "") {
      console.log("Deploying contract:", name);
      const deployResult = await deploy(contract, {
        from: deployer,
        args: args,
        log: true,
      });
      return deployResult.address;
    } else {
      if (verify) {
        await verifyContract(deployedAddress, args);
      }
      console.log("Fetch previous deployed address for", name, deployedAddress );
      return deployedAddress;
    }
  }

  async function verifyContract(address: string, args?: any[]) {
    if (typeof args == 'undefined') {
      args = []
    }
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: args,
      });
    } catch (e) {
      if ((e as Error).message != "Contract source code already verified") {
        throw(e)
      }
      console.log((e as Error).message)
    }
  }

  async function deployMultiSigWalletWithTimelock(verify?: boolean) {
    const d = config.defaultAddress
    const owners = [d.MultiSigOwner1, d.MultiSigOwner2, d.MultiSigOwner3]
    if (verify) {
      await deployContract("MultiSigWalletWithTimelock", "MultiSigWalletWithTimelock", [owners, 2], true);
    } else {
      await deployContract("MultiSigWalletWithTimelock", "MultiSigWalletWithTimelock", [owners, 2]);
    }
  }

  async function deployMulticall() {
    await deployContract("Multicall", "Multicall", []);
  }
};

export default func;