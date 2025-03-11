// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC721Enumerable.sol";
import "./Ownable.sol";
import "./JayBird.sol";

interface IAMM {
    function addLiquidity(uint256 _token1Amount, uint256 _token2Amount) external payable;
    function token1() external view returns (address);
}

contract NFT is ERC721Enumerable, Ownable {
    using Strings for uint256;

    uint256 public cost;
    uint256 public maxSupply;
    uint256 public allowMintingOn;
    string public baseURI;
    string public baseExtension = ".json";
    
    // Token reward config
    uint256 public tokenRatio = 5; // 5 JBT tokens per 1 ETH spent
    uint256 public liquidityPercentage = 70; // 70% goes to liquidity
    uint256 public rewardPercentage = 30; // 30% goes to user as reward
    
    // AMM and JayBird token contracts
    JayBird public jayBirdToken;
    IAMM public ammContract;
    bool public autoLiquidityEnabled = true;

    event Mint(uint256 amount, address minter);
    event Withdraw(uint256 amount, address owner);
    event TokensRewarded(address indexed user, uint256 amount);
    event LiquidityAdded(uint256 tokenAmount, uint256 ethAmount);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _cost,
        uint256 _maxSupply,
        uint256 _allowMintingOn,
        string memory _baseURI
    ) ERC721(_name, _symbol) {
        cost = _cost;
        maxSupply = _maxSupply;
        allowMintingOn = _allowMintingOn;
        baseURI = _baseURI;
    }
    
    // Set JayBird token contract
    function setJayBirdToken(address _jayBirdToken) external onlyOwner {
        require(_jayBirdToken != address(0), "Invalid JayBird token address");
        jayBirdToken = JayBird(_jayBirdToken);
    }
    
    // Set AMM contract
    function setAMMContract(address _ammContract) external onlyOwner {
        require(_ammContract != address(0), "Invalid AMM contract address");
        ammContract = IAMM(_ammContract);
        
        // Validate that AMM uses the same token
        require(
            ammContract.token1() == address(jayBirdToken),
            "AMM contract does not use JayBird token"
        );
    }
    
    // Toggle auto liquidity
    function toggleAutoLiquidity(bool _enabled) external onlyOwner {
        autoLiquidityEnabled = _enabled;
    }
    
    // Update token reward ratio (tokens per ETH)
    function setTokenRatio(uint256 _newRatio) external onlyOwner {
        require(_newRatio > 0, "Ratio must be greater than 0");
        tokenRatio = _newRatio;
    }
    
    // Update liquidity percentage
    function setLiquidityPercentage(uint256 _percentage) external onlyOwner {
        require(_percentage <= 100, "Percentage cannot exceed 100");
        liquidityPercentage = _percentage;
        rewardPercentage = 100 - _percentage;
    }

    function mint(uint256 _mintAmount) public payable {
        // only allow minting after specified time
        require(block.timestamp >= allowMintingOn, "minting not allowed yet");

        //Require enough payment
        require(msg.value >= cost * _mintAmount, "Not enough ETH sent");

        //must mint at lease one NFT
        require(_mintAmount > 0, "Must mint at least one NFT");

        //Create a new NFT
        uint256 supply = totalSupply();

        //_afterTokenTransfer
        require(supply + _mintAmount <= maxSupply, "Max supply exceeded");

        for (uint256 i = 1; i <= _mintAmount; i++) {
            _safeMint(msg.sender, supply + i);
        }
        
        // Handle token rewards and liquidity if enabled
        if (address(jayBirdToken) != address(0) && autoLiquidityEnabled) {
            _handleTokenRewardsAndLiquidity(_mintAmount);
        }

        //Emit event
        emit Mint(_mintAmount, msg.sender);
    }
    
    // Internal function to handle token rewards and liquidity
    function _handleTokenRewardsAndLiquidity(uint256 _mintAmount) internal {
        // Calculate total cost paid
        uint256 totalCost = cost * _mintAmount;
        
        // Calculate token amounts based on ratio
        uint256 totalTokenAmount = totalCost * tokenRatio;
        
        // Calculate how much goes to liquidity vs reward
        uint256 tokensForLiquidity = (totalTokenAmount * liquidityPercentage) / 100;
        uint256 tokensForReward = (totalTokenAmount * rewardPercentage) / 100;
        uint256 ethForLiquidity = (totalCost * liquidityPercentage) / 100;
        
        // Mint tokens to user (reward portion)
        if (tokensForReward > 0) {
            jayBirdToken.mint(msg.sender, tokensForReward);
            emit TokensRewarded(msg.sender, tokensForReward);
        }
        
        // Handle liquidity portion if AMM is set
        if (address(ammContract) != address(0) && tokensForLiquidity > 0 && ethForLiquidity > 0) {
            // Mint tokens to this contract for liquidity
            jayBirdToken.mint(address(this), tokensForLiquidity);
            
            // Approve AMM to spend tokens
            jayBirdToken.approve(address(ammContract), tokensForLiquidity);
            
            // Add liquidity to AMM
            try ammContract.addLiquidity{value: ethForLiquidity}(tokensForLiquidity, ethForLiquidity) {
                emit LiquidityAdded(tokensForLiquidity, ethForLiquidity);
            } catch {
                // If failed, transfer tokens to the owner
                jayBirdToken.transfer(owner(), tokensForLiquidity);
            }
        }
    }

    // Return metadata IPFS URL
    function tokenURI(
        uint256 _tokenId
    ) public view virtual override returns (string memory) {
        require(_exists(_tokenId), "token does not exist");
        return (
            string(
                abi.encodePacked(baseURI, _tokenId.toString(), baseExtension)
            )
        );
    }

    function walletOfOwner(
        address _owner
    ) public view returns (uint256[] memory) {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i = 0; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    //Owner functions

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success);

        emit Withdraw(balance, msg.sender);
    }

    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }
}
