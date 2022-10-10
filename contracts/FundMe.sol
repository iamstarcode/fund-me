// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.7;
// 2. Imports
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "hardhat/console.sol";

// 3. Interfaces, Libraries, Contracts
error FundMe__NotOwner();
error FundMe__NeedMoreEth();
error FundMe__WithdrawError();

contract FundMe {
    // Type Declarations
    using PriceConverter for uint256;

    // State variables
    uint256 public constant MINIMUM_USD = 50 * 10**18; //$50 in wei
    address private immutable owner;
    address[] private funders;

    mapping(address => uint256) private addressToAmountFunded; //Mapping for funders to amount they funded
    AggregatorV3Interface private priceFeed;

    // Modifiers
    modifier onlyOwner() {
        if (msg.sender != owner) revert FundMe__NotOwner();
        _;
    }

    constructor(address _priceFeedAddress) {
        priceFeed = AggregatorV3Interface(_priceFeedAddress);
        owner = msg.sender;
    }

    /// @notice Funds our contract based on the ETH/USD price
    function fund() public payable {
        if (msg.value.fiatConversionRate(priceFeed) < MINIMUM_USD) {
            revert FundMe__NeedMoreEth();
        }
        addressToAmountFunded[msg.sender] += msg.value;
        funders.push(msg.sender);
    }

    function withdraw() public onlyOwner {
        address[] memory _funders = funders;
        // mappings can't be in memory, sorry!
        for (uint256 funderIndex = 0; funderIndex < _funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }
        funders = new address[](0);
        (bool success, ) = owner.call{value: address(this).balance}("");
        if (!success) {
            revert FundMe__WithdrawError();
        }
    }

    /** @notice Gets the amount that an address has funded
     *  @param fundingAddress the address of the funder
     *  @return the amount funded
     */
    function getAddressToAmountFunded(address fundingAddress) public view returns (uint256) {
        return addressToAmountFunded[fundingAddress];
    }

    function getVersion() public view returns (uint256) {
        return priceFeed.version();
    }

    function getFunder(uint256 index) public view returns (address) {
        return funders[index];
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return priceFeed;
    }

    function getFiatConversionRate() public view returns (uint256) {
        uint256 price = PriceConverter.fiatConversionRate(1, priceFeed);
        return price;
    }
}
