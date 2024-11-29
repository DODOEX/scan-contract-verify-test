import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ZERO_TESTNET_CONFIG as config } from "../../config/zero_testnet";
import * as dotenv from "dotenv";
dotenv.config();

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await main();

  async function main() {
    await deployWETH();
    await deployMultiSigWalletWithTimelock();
    await deployMulticall();
    await deployHelpers();
    await deployTemplates();
    await deployApproveAndProxy();
    await deployAdapters();
    await deployFactories();
    await deployProxies();
    await deployFeeRouteProxies();
    await initOwners();
    await initDODOApproves();
    await initAdmin();
    await deployMultisend();
  }

  async function deployContract(
    name: string,
    contract: string,
    args?: any[],
    verify?: boolean
  ) {
    if (typeof args == "undefined") {
      args = [];
    }
    const deployedAddress =
      config.deployedAddress[name as keyof typeof config.deployedAddress];
    if (!deployedAddress || deployedAddress == "") {
      console.log("Deploying contract:", name);
      const deployResult = await deploy(contract, {
        from: deployer,
        args: args,
        log: true,
      });
      await verifyContract(deployResult.address, args);
      return deployResult.address;
    } else {
      console.log("Fetch previous deployed address for", name, deployedAddress);
      verify = true;
      if (verify) {
        await verifyContract(deployedAddress, args);
      }
      return deployedAddress;
    }
  }

  async function verifyContract(address: string, args?: any[]) {
    if (typeof args == "undefined") {
      args = [];
    }
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: args,
      });
    } catch (e) {
      if ((e as Error).message != "Contract source code already verified") {
        // throw e;
      }
      console.log((e as Error).message);
    }
  }

  async function deployWETH() {
    await deployContract("WETH", "WETH9");
  }

  async function deployMultiSigWalletWithTimelock() {
    const d = config.defaultAddress;
    const owners = [d.MultiSigOwner1, d.MultiSigOwner2, d.MultiSigOwner3];
    await deployContract("MultiSig", "MultiSigWalletWithTimelock", [owners, 2]);
  }

  async function deployMulticall() {
    await deployContract("Multicall", "Multicall", []);
    await deployContract("MulticallWithValid", "MulticallWithValid", []);
  }

  async function deployHelpers() {
    const sellHelper = await deployContract("DODOSellHelper", "DODOSellHelper");
    await deployContract("DODOSwapCalcHelper", "DODOSwapCalcHelper", [
      sellHelper,
    ]);
    await deployContract("ERC20Helper", "ERC20Helper");
    await deployContract("DODOCalleeHelper", "DODOCalleeHelper", [
      config.deployedAddress.WETH,
    ]);
    await deployContract("DODOV1PmmHelper", "DODOV1PmmHelper");
  }

  async function deployTemplates() {
    await deployContract("CloneFactory", "CloneFactory");
    await deployContract("FeeRateModel", "FeeRateModel");
    await deployContract("FeeRateDIP3Impl", "FeeRateDIP3Impl");
    await deployContract("PermissionManager", "PermissionManager");

    await deployContract("DVM", "DVM");
    await deployContract("DSP", "DSP");
    await deployContract("GSP", "GSP");
    await deployContract("DPPAdvanced", "DPPAdvanced");
    await deployContract("DPPAdvancedAdmin", "DPPAdvancedAdmin");
    await deployContract("CP", "CP");

    await deployContract("InitializableERC20", "InitializableERC20");
    await deployContract("CustomERC20", "CustomERC20");
    await deployContract("CustomMintableERC20", "CustomMintableERC20");

    await deployContract("ERC20MineV2", "ERC20Mine");
    await deployContract("ERC20MineV3", "ERC20MineV3");
  }

  async function deployApproveAndProxy() {
    const dodoApprove = await deployContract("DODOApprove", "DODOApprove");
    await deployContract("DODOApproveProxy", "DODOApproveProxy", [dodoApprove]);
  }

  async function deployAdapters() {
    await deployContract("DODOV2Adapter", "DODOV2Adapter");
  }

  async function deployFactories() {
    const d = config.deployedAddress;
    const cloneFactory = d.CloneFactory;
    const maintainer = d.MultiSig;
    const feeRateModel = d.FeeRateModel;
    const dvm = d.DVM;
    const cp = d.CP;
    const dsp = d.DSP;
    const gsp = d.GSP;
    const dppAdvanced = d.DPPAdvanced;
    const dppAdvancedAdmin = d.DPPAdvancedAdmin;
    const dodoApproveProxy = d.DODOApproveProxy;
    const permissionManager = d.PermissionManager;
    const dvmFactory = d.DVMFactory;

    await deployContract("DVMFactory", "DVMFactory", [
      cloneFactory,
      dvm,
      maintainer,
      feeRateModel,
    ]);
    await deployContract("DSPFactory", "DSPFactory", [
      cloneFactory,
      dsp,
      maintainer,
      feeRateModel,
    ]);
    await deployContract("GSPFactory", "GSPFactory", [
      cloneFactory,
      gsp,
      maintainer,
    ]);
    await deployContract("DPPFactory", "DPPFactory", [
      cloneFactory,
      dppAdvanced,
      dppAdvancedAdmin,
      maintainer,
      feeRateModel,
      dodoApproveProxy,
    ]);
    await deployContract("CrowdPoolingFactory", "CrowdPoolingFactory", [
      cloneFactory,
      cp,
      dvmFactory,
      maintainer,
      feeRateModel,
      permissionManager,
    ]);
    await deployContract("ERC20V3Factory", "ERC20V3Factory", [
      cloneFactory,
      d.InitializableERC20,
      d.CustomERC20,
      d.CustomMintableERC20,
      2000000000000000,
    ]);
    await deployContract("DODOMineV2Factory", "DODOMineV2Factory", [
      cloneFactory,
      d.ERC20MineV2,
      maintainer,
    ]);
    await deployContract("DODOMineV3Registry", "DODOMineV3Registry");
    await deployContract("DODOV2RouteHelper", "DODOV2RouteHelper", [
      d.DVMFactory,
      d.DPPFactory,
      d.DSPFactory,
    ]);
  }

  async function deployProxies() {
    const d = config.deployedAddress;
    await deployContract("DODOV2Proxy02", "DODOV2Proxy02", [
      d.DVMFactory,
      d.WETH,
      d.DODOApproveProxy,
      d.DODOSellHelper,
    ]);
    await deployContract("DODODspProxy", "DODODspProxy", [
      d.DSPFactory,
      d.GSPFactory,
      d.WETH,
      d.DODOApproveProxy,
    ]);
    await deployContract("DODOCpProxy", "DODOCpProxy", [
      d.WETH,
      d.CrowdPoolingFactory,
      d.DODOApproveProxy,
    ]);
    await deployContract("DODODppProxy", "DODODppProxy", [
      d.WETH,
      d.DODOApproveProxy,
      d.DPPFactory,
    ]);
    await deployContract("DODOMineV3Proxy", "DODOMineV3Proxy", [
      d.CloneFactory,
      d.ERC20MineV3,
      d.DODOApproveProxy,
      d.DODOMineV3Registry,
    ]);
  }

  async function deployFeeRouteProxies() {
    const d = config.deployedAddress;
    await deployContract("DODOFeeRouteProxy1", "DODOFeeRouteProxy", [
      d.WETH,
      d.DODOApproveProxy,
      config.defaultAddress.FeeReceiver,
    ]);
    await deployContract("DODOFeeRouteProxy2", "DODOFeeRouteProxy", [
      d.WETH,
      d.DODOApproveProxy,
      config.defaultAddress.FeeReceiver,
    ]);
  }

  async function initOwners() {
    const d = config.deployedAddress;

    console.log("FeeRateModel init owner...");
    const feeRateModel = await ethers.getContractAt(
      "FeeRateModel",
      d.FeeRateModel
    );
    await feeRateModel.initOwner(d.MultiSig);

    console.log("FeeRateDIP3Impl init owner...");
    const feeRateDIP3Impl = await ethers.getContractAt(
      "FeeRateDIP3Impl",
      d.FeeRateDIP3Impl
    );
    await feeRateDIP3Impl.initOwner(d.MultiSig);

    console.log("PermissionManager init owner...");
    const permissionManager = await ethers.getContractAt(
      "PermissionManager",
      d.PermissionManager
    );
    await permissionManager.initOwner(d.MultiSig);

    console.log("ERC20V3Factory init owner...");
    const erc20V3Factory = await ethers.getContractAt(
      "ERC20V3Factory",
      d.ERC20V3Factory
    );
    await erc20V3Factory.initOwner(d.MultiSig);

    console.log("DVMFactory init owner...");
    const dvmFactory = await ethers.getContractAt("DVMFactory", d.DVMFactory);
    await dvmFactory.initOwner(d.MultiSig);

    console.log("DSPFactory init owner...");
    const dspFactory = await ethers.getContractAt("DSPFactory", d.DSPFactory);
    await dspFactory.initOwner(d.MultiSig);

    console.log("DPPFactory init owner...");
    const dppFactory = await ethers.getContractAt("DPPFactory", d.DPPFactory);
    await dppFactory.initOwner(d.MultiSig);

    console.log("CPFactory init owner...");
    const cpFactory = await ethers.getContractAt(
      "CrowdPoolingFactory",
      d.CrowdPoolingFactory
    );
    await cpFactory.initOwner(d.MultiSig);

    console.log("DODOMineV2Factory init owner...");
    const dodoMineV2Factory = await ethers.getContractAt(
      "DODOMineV2Factory",
      d.DODOMineV2Factory
    );
    await dodoMineV2Factory.initOwner(d.MultiSig);

    console.log("DODOMineV3Registry init owner...");
    const DODOMineV3Registry = await ethers.getContractAt(
      "DODOMineV3Registry",
      d.DODOMineV3Registry
    );
    await DODOMineV3Registry.initOwner(d.MultiSig);

    console.log("DODOV2Proxy02 init owner...");
    const DODOV2Proxy02 = await ethers.getContractAt(
      "DODOV2Proxy02",
      d.DODOV2Proxy02
    );
    await DODOV2Proxy02.initOwner(d.MultiSig);

    console.log("DODOMineV3Proxy init owner...");
    const DODOMineV3Proxy = await ethers.getContractAt(
      "DODOMineV3Proxy",
      d.DODOMineV3Proxy
    );
    await DODOMineV3Proxy.initOwner(d.MultiSig);
  }

  async function initDODOApproves() {
    const d = config.deployedAddress;

    console.log("DODOApproveProxy init...");
    const DODOApproveProxy = await ethers.getContractAt(
      "contracts/SmartRoute/DODOApproveProxy.sol:DODOApproveProxy",
      d.DODOApproveProxy
    );
    await DODOApproveProxy.init(d.MultiSig, [
      d.DODOV2Proxy02,
      d.DODODspProxy,
      d.DODOCpProxy,
      d.DODODppProxy,
      d.DODOMineV3Proxy,
      d.DODOFeeRouteProxy1,
      d.DODOFeeRouteProxy2,
    ]);

    console.log("DODOApprove init...");
    const DODOApprove = await ethers.getContractAt(
      "DODOApprove",
      d.DODOApprove
    );
    await DODOApprove.init(d.MultiSig, d.DODOApproveProxy);
  }

  async function initAdmin() {
    const d = config.deployedAddress;

    console.log("FeeRateModel.setFeeProxy FeeRateDIP3Impl ...");
    const FeeRateModel = await ethers.getContractAt(
      "FeeRateModel",
      d.FeeRateModel
    );
    await FeeRateModel.setFeeProxy(d.FeeRateDIP3Impl);

    console.log("DODOMineV3Registry addAdminList DODOMineV3Proxy ...");
    const DODOMineV3Registry = await ethers.getContractAt(
      "DODOMineV3Registry",
      d.DODOMineV3Registry
    );
    await DODOMineV3Registry.addAdminList(d.DODOMineV3Proxy);

    console.log("DPPFactory addAdminList DODODppProxy ...");
    const DPPFactory = await ethers.getContractAt("DPPFactory", d.DPPFactory);
    await DPPFactory.addAdminList(d.DODODppProxy);

    console.log("FeeRateDIP3Impl addAdminList CrowdPoolingFactory ...");
    const FeeRateDIP3Impl = await ethers.getContractAt(
      "FeeRateDIP3Impl",
      d.FeeRateDIP3Impl
    );
    await FeeRateDIP3Impl.addAdminList(d.CrowdPoolingFactory);
  }

  async function deployMultisend() {
    await deployContract("MultiSend", "MultisendWithValid");
  }
};

export default func;
