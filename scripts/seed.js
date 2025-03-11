const hre = require("hardhat");
const config = require("../src/config.json");

const tokens = (n) => {
    return hre.ethers.utils.parseUnits(n.toString(), "ether");
};

async function main() {
    console.log("📈 Setting up liquidity pools...");
    
    // Get accounts
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Using account: ${deployer.address}`);
    
    // Fetch Network
    const { chainId } = await hre.ethers.provider.getNetwork();
    console.log(`Network chainId: ${chainId}`);
    
    if (!config[chainId]) {
        console.error(`No configuration found for chainId ${chainId}`);
        process.exit(1);
    }
    
    // Get the contract addresses from config
    const ammAddress = config[chainId].amm.address;
    const jaybirdAddress = config[chainId].jaybird.address;
    const wrappedTokenAddress = config[chainId].wrappedGasToken.address;
    
    console.log(`AMM address: ${ammAddress}`);
    console.log(`JayBird token address: ${jaybirdAddress}`);
    console.log(`Wrapped token address: ${wrappedTokenAddress}`);
    
    // Get the contracts
    const AMM = await hre.ethers.getContractAt("AMM", ammAddress);
    console.log(`Connected to AMM contract at ${AMM.address}`);
    
    const JayBird = await hre.ethers.getContractAt("JayBird", jaybirdAddress);
    console.log(`Connected to JayBird contract at ${JayBird.address}`);
    
    let wrappedToken;
    try {
        wrappedToken = await hre.ethers.getContractAt("JayBird", wrappedTokenAddress);
        console.log(`Connected to Wrapped token contract at ${wrappedToken.address}`);
    } catch (error) {
        console.warn(`Could not connect to wrapped token at ${wrappedTokenAddress}`);
        console.warn("This is expected for native wrapped tokens. Will proceed without direct access.");
    }
    
    // Check current liquidity status
    console.log("\nChecking current liquidity status...");
    
    try {
        const token1Balance = await AMM.token1Balance();
        const token2Balance = await AMM.token2Balance();
        const totalShares = await AMM.totalShares();
        
        console.log(`Current AMM Token1 (JayBird) Balance: ${hre.ethers.utils.formatEther(token1Balance)} JBT`);
        console.log(`Current AMM Token2 (Wrapped) Balance: ${hre.ethers.utils.formatEther(token2Balance)} WPLS`);
        console.log(`Current Total Shares: ${hre.ethers.utils.formatEther(totalShares)}`);
        console.log(`Deployer Shares: ${hre.ethers.utils.formatEther(await AMM.shares(deployer.address))}`);
        
        if (token1Balance.gt(0) && token2Balance.gt(0)) {
            console.log("\n✅ Liquidity pool already has funds. No need to add more liquidity.");
            return;
        }
    } catch (error) {
        console.error("Error checking current liquidity:", error);
        console.log("Will attempt to add liquidity anyway.");
    }
    
    // Add liquidity if needed
    console.log("\nSetting up initial liquidity...");
    
    // Define liquidity amount
    const liquidityAmount = tokens("50000");
    console.log(`Will add ${hre.ethers.utils.formatEther(liquidityAmount)} of each token to the pool`);
    
    // Check current JayBird balance
    const jaybirdBalance = await JayBird.balanceOf(deployer.address);
    console.log(`Current JayBird balance: ${hre.ethers.utils.formatEther(jaybirdBalance)} JBT`);
    
    if (jaybirdBalance.lt(liquidityAmount)) {
        console.error("❌ Insufficient JayBird tokens for liquidity provision");
        console.log(`Need: ${hre.ethers.utils.formatEther(liquidityAmount)} JBT`);
        console.log(`Have: ${hre.ethers.utils.formatEther(jaybirdBalance)} JBT`);
        process.exit(1);
    }
    
    // Approve JayBird tokens for AMM
    console.log(`\nApproving ${hre.ethers.utils.formatEther(liquidityAmount)} JayBird tokens for AMM...`);
    let tx = await JayBird.approve(AMM.address, liquidityAmount);
    await tx.wait();
    console.log("✅ JayBird tokens approved");
    
    // If we have direct access to wrapped token, approve it too
    if (wrappedToken) {
        const wrappedBalance = await wrappedToken.balanceOf(deployer.address);
        console.log(`Current Wrapped token balance: ${hre.ethers.utils.formatEther(wrappedBalance)} WPLS`);
        
        if (wrappedBalance.lt(liquidityAmount)) {
            console.error("❌ Insufficient Wrapped tokens for liquidity provision");
            console.log(`Need: ${hre.ethers.utils.formatEther(liquidityAmount)} WPLS`);
            console.log(`Have: ${hre.ethers.utils.formatEther(wrappedBalance)} WPLS`);
            process.exit(1);
        }
        
        console.log(`\nApproving ${hre.ethers.utils.formatEther(liquidityAmount)} Wrapped tokens for AMM...`);
        tx = await wrappedToken.approve(AMM.address, liquidityAmount);
        await tx.wait();
        console.log("✅ Wrapped tokens approved");
    } else {
        console.log("\n⚠️ No direct access to wrapped token. Please ensure it's approved for the AMM contract.");
    }
    
    // Add liquidity
    try {
        console.log("\nAdding liquidity to AMM...");
        tx = await AMM.addLiquidity(liquidityAmount, liquidityAmount, { 
            gasLimit: 500000 
        });
        await tx.wait();
        console.log("✅ Liquidity added successfully!");
        
        // Check updated liquidity status
        const token1Balance = await AMM.token1Balance();
        const token2Balance = await AMM.token2Balance();
        const totalShares = await AMM.totalShares();
        
        console.log(`\nUpdated AMM Token1 Balance: ${hre.ethers.utils.formatEther(token1Balance)} JBT`);
        console.log(`Updated AMM Token2 Balance: ${hre.ethers.utils.formatEther(token2Balance)} WPLS`);
        console.log(`Updated Total Shares: ${hre.ethers.utils.formatEther(totalShares)}`);
        console.log(`Deployer Shares: ${hre.ethers.utils.formatEther(await AMM.shares(deployer.address))}`);
    } catch (error) {
        console.error("❌ Error adding liquidity:", error);
        console.log("Make sure both tokens are properly approved and you have sufficient balances.");
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
