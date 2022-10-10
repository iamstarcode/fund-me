import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"

import { developmentChains, networkConfig } from "../helper-hardhat-config"
import { verify } from "../helper-functions"

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deploy, log } = hre.deployments
    const { deployer } = await hre.getNamedAccounts()
    const chainId = hre.network.config.chainId ?? 0

    //check for dev
    let ethUsdPriceFeedAddress: any | undefined
    if (developmentChains.includes(hre.network.name)) {
        const ethUsdAggregator = await hre.deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed
    }

    // when deploying to local
    log(`******************* Deploying Eth on ${hre.network.name} *******************`)
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        //waitConfirmations: 1,
    })
    log("******************* Deployed Eth *******************")

    //if not on local then run a verify etherscan programatically
    if (!developmentChains.includes(hre.network.name)) {
        await verify(fundMe.address, args)
    }
}
export default func
func.tags = ["all", "eth"]
