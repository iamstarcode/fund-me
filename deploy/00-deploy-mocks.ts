import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { developmentChains, DECIMAL, INITIAL_ANSWER } from "../helper-hardhat-config"

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { network } = hre
    const { deploy, log } = hre.deployments
    const { deployer } = await hre.getNamedAccounts()
    const name = network.name

    if (developmentChains.includes(name)) {
        log("******************* Deploying Mocks *******************")
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMAL, INITIAL_ANSWER],
        })
        log("******************* Mocks Deplyed *******************")
    }
}

export default func
func.tags = ["all", "mocks"]
