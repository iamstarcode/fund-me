import { frontEndContractsFile, frontEndAbiFile } from "../helper-hardhat-config"
import fs from "fs"
import { ethers, network } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"

const func: DeployFunction = async () => {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Writing to front end...")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}

async function updateAbi() {
    const fundMe = await ethers.getContract("FundMe")
    fs.writeFileSync(frontEndAbiFile, fundMe.interface.format(ethers.utils.FormatTypes.json))
}

async function updateContractAddresses() {
    const fundMe = await ethers.getContract("FundMe")
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    const chainId = network.config.chainId?.toString()

    if (chainId != undefined)
        if (chainId in contractAddresses) {
            if (!contractAddresses[chainId].includes(fundMe.address)) {
                contractAddresses[chainId].push(fundMe.address)
            }
        } else {
            contractAddresses[chainId] = [fundMe.address]
        }

    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

export default func
func.tags = ["all", "frontend"]
