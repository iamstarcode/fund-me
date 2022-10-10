import { assert, expect } from "chai"
import { deployments, ethers, getNamedAccounts } from "hardhat"
import { FundMe, MockV3Aggregator } from "../../typechain/"

describe("FundMe", async () => {
    let fundMe: FundMe
    let mockV3Aggregator: MockV3Aggregator
    const sendValue = ethers.utils.parseEther("1")

    beforeEach(async () => {
        const { deployer } = await getNamedAccounts()
        await deployments.fixture(["all"]) // deploy all contracts
        fundMe = await ethers.getContract("FundMe", deployer) // get fundMe contract
        mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer) // get mockv3aggregator
    })

    describe("constructor", async () => {
        it("set agrregator correctly", async () => {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("Fund", () => {
        it("Fails if you don't send enough ETH!", async () => {
            await expect(fundMe.fund()).to.be.revertedWithCustomError(fundMe, "FundMe__NeedMoreEth")
        })

        it("upated the amount funded", async () => {
            const { deployer } = await getNamedAccounts()
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getAddressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })

        it("adding to funders array", async () => {
            const { deployer } = await getNamedAccounts()
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.getFunder(0)
            assert.equal(deployer, funder)
        })
    })

    describe("Withdraw", async () => {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue })
        })

        it("withdraw ETH from a single funder", async () => {
            const { deployer } = await getNamedAccounts()
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address //get contract balance
            )

            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer //get deployer balance
            )

            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const { gasUsed, effectiveGasPrice } = transactionReceipt

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address //get contract balance
            )

            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer //get deployer balance
            )

            assert.equal(endingFundMeBalance.toString(), "0")

            const gasCost = gasUsed.mul(effectiveGasPrice)
            assert.equal(
                endingDeployerBalance.add(gasCost).toString(),
                startingFundMeBalance.add(startingDeployerBalance).toString()
            )
        })
    })
})
