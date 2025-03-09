const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("Mint with Liquidity", () => {
    let accounts, deployer, user;
    let nft, token1, token2, amm;
    let transaction, result;
    let cost = ether(1);
    let allowMintingOn = (Date.now() / 1000).toFixed();
    let baseURI = "https://ipfs.io/ipfs/QmThdTBCR8DsnXMViDGC13uWEZ4cGLANiJd1p7CxHgzuTE/";
    
    beforeEach(async () => {
        accounts = await ethers.getSigners();
        deployer = accounts[0];
        user = accounts[1];
        
        // Deploy NFT contract
        const NFT = await ethers.getContractFactory("NFT");
        nft = await NFT.deploy(
            "JayBird NFT", 
            "JNFT", 
            cost, 
            20, // maxSupply
            allowMintingOn, 
            baseURI
        );
        
        // Deploy JayBird token (token1)
        const JayBird = await ethers.getContractFactory("JayBird");
        token1 = await JayBird.deploy("JayBird", "JBT", "1000000");
        
        // Deploy a mock token for token2 (simulating PLS)
        token2 = await JayBird.deploy("PulseToken", "PLS", "1000000");
        
        // Deploy AMM
        const AMM = await ethers.getContractFactory("AMM");
        amm = await AMM.deploy(token1.address, token2.address);
        
        // Transfer tokens to user
        transaction = await token1.connect(deployer).transfer(user.address, tokens(10000));
        await transaction.wait();
        
        transaction = await token2.connect(deployer).transfer(user.address, tokens(10000));
        await transaction.wait();
    });
    
    describe("Minting NFTs and Adding Liquidity", () => {
        it("allows minting NFTs", async () => {
            // User mints an NFT
            transaction = await nft.connect(user).mint(1, { value: cost });
            await transaction.wait();
            
            // Check NFT ownership
            expect(await nft.balanceOf(user.address)).to.equal(1);
            
            // Check tokenURI
            const tokenId = await nft.tokenOfOwnerByIndex(user.address, 0);
            const tokenURI = await nft.tokenURI(tokenId);
            expect(tokenURI).to.include(baseURI);
        });
        
        it("allows adding liquidity after minting", async () => {
            // User mints an NFT
            transaction = await nft.connect(user).mint(1, { value: cost });
            await transaction.wait();
            
            // User approves AMM to spend tokens
            const token1Amount = tokens(5);
            const token2Amount = tokens(5);
            
            transaction = await token1.connect(user).approve(amm.address, token1Amount);
            await transaction.wait();
            
            transaction = await token2.connect(user).approve(amm.address, token2Amount);
            await transaction.wait();
            
            // User adds liquidity
            transaction = await amm.connect(user).addLiquidity(token1Amount, token2Amount);
            await transaction.wait();
            
            // Check AMM contract token balances
            expect(await token1.balanceOf(amm.address)).to.equal(token1Amount);
            expect(await token2.balanceOf(amm.address)).to.equal(token2Amount);
            
            // Check user's shares
            expect(await amm.shares(user.address)).to.be.above(0);
            expect(await amm.totalShares()).to.equal(await amm.shares(user.address));
        });
        
        it("calculates correct token amounts for liquidity", async () => {
            // First user adds initial liquidity
            const initialToken1 = tokens(10);
            const initialToken2 = tokens(10);
            
            transaction = await token1.connect(deployer).approve(amm.address, initialToken1);
            await transaction.wait();
            
            transaction = await token2.connect(deployer).approve(amm.address, initialToken2);
            await transaction.wait();
            
            transaction = await amm.connect(deployer).addLiquidity(initialToken1, initialToken2);
            await transaction.wait();
            
            // Second user calculates token2 amount needed for a given token1 amount
            const userToken1Amount = tokens(5);
            const calculatedToken2Amount = await amm.calculateToken2Deposit(userToken1Amount);
            
            // Expected token2 amount is 5 tokens (token2Balance * token1Amount / token1Balance)
            // Since the pool has 10 tokens of each, adding 5 token1 requires 5 token2
            expect(calculatedToken2Amount).to.equal(tokens(5));
            
            // User adds calculated liquidity
            transaction = await token1.connect(user).approve(amm.address, userToken1Amount);
            await transaction.wait();
            
            transaction = await token2.connect(user).approve(amm.address, calculatedToken2Amount);
            await transaction.wait();
            
            transaction = await amm.connect(user).addLiquidity(userToken1Amount, calculatedToken2Amount);
            await transaction.wait();
            
            // Verify pool balances after adding liquidity
            expect(await token1.balanceOf(amm.address)).to.equal(tokens(15));
            expect(await token2.balanceOf(amm.address)).to.equal(tokens(15));
            
            // User should have 50 shares (50% of initial shares)
            expect(await amm.shares(user.address)).to.equal(tokens(50));
        });
        
        it("handles swapping tokens after adding liquidity", async () => {
            // Add initial liquidity
            const initialToken1 = tokens(100);
            const initialToken2 = tokens(100);
            
            transaction = await token1.connect(deployer).approve(amm.address, initialToken1);
            await transaction.wait();
            
            transaction = await token2.connect(deployer).approve(amm.address, initialToken2);
            await transaction.wait();
            
            transaction = await amm.connect(deployer).addLiquidity(initialToken1, initialToken2);
            await transaction.wait();
            
            // User swaps token1 for token2
            const swapAmount = tokens(10);
            
            // Calculate expected token2 amount from swap
            const expectedToken2Amount = await amm.calculateToken1Swap(swapAmount);
            
            // User approves and swaps
            transaction = await token1.connect(user).approve(amm.address, swapAmount);
            await transaction.wait();
            
            // Capture user's token2 balance before swap
            const initialBalance = await token2.balanceOf(user.address);
            
            transaction = await amm.connect(user).swapToken1(swapAmount);
            await transaction.wait();
            
            // Check if user received the correct amount of token2
            const finalBalance = await token2.balanceOf(user.address);
            expect(finalBalance.sub(initialBalance)).to.equal(expectedToken2Amount);
            
            // Check if AMM balances updated correctly
            expect(await token1.balanceOf(amm.address)).to.equal(initialToken1.add(swapAmount));
            expect(await token2.balanceOf(amm.address)).to.equal(initialToken2.sub(expectedToken2Amount));
        });
    });
});