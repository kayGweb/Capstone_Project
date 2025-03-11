// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

//Config for network and contracts
const config = require("../src/config.json");

const tokens = (n) => {
	return hre.ethers.utils.parseUnits(n.toString(), "ether");
};

async function main() {
	console.log("🚀 Starting deployment...");
	
	// Get deployer account
	const [deployer] = await hre.ethers.getSigners();
	console.log(`Deploying contracts with the account: ${deployer.address}`);
	
	//NFT Token Constants
	const NAME = "JayBird Collection";
	const SYMBOL = "JBC";
	const MAX_SUPPLY = 20;
	const BASE_URI = "ipfs/QmfPZcNLSeopitShcTYtQDvrTzXc5Y6mCX5trJ5QBavgNY/";
	const COST = tokens("200");
	const NFT_MINT_DATE = (Date.now() + 6000000).toString().slice(0, 10);

	// JayBird Token Constants
	const TOKEN_NAME = "JayBird Token";
	const SYMBOL_JAYBIRD = "JBT";
	const TOTAL_SUPPLY = tokens("1000000");

	// ChainId for this network
	const { chainId } = await hre.ethers.provider.getNetwork();
	console.log(`Deploying to network with chainId: ${chainId}`);
	
	// Define wrapped token address based on network
	let wrappedTokenAddress;
	
	if (chainId === 31337) {
		// For Hardhat local network, deploy a mock wrapped token
		console.log("Deploying mock wrapped token for local testing...");
		const MockToken = await hre.ethers.getContractFactory("JayBird");
		const mockToken = await MockToken.deploy("Wrapped Token", "WPLS", "1000000");
		await mockToken.deployed();
		wrappedTokenAddress = mockToken.address;
		console.log(`Mock Wrapped Token deployed to: ${wrappedTokenAddress}\n`);
	} else if (config[chainId] && config[chainId].wrappedGasToken) {
		// For known networks, use the wrapped token from config
		wrappedTokenAddress = config[chainId].wrappedGasToken.address;
		console.log(`Using existing wrapped token at: ${wrappedTokenAddress}\n`);
	} else {
		// For unknown networks, default to PulseChain testnet wrapped token
		wrappedTokenAddress = "0x70499adEBB11Efd915E3b69E700c331778628707";
		console.log(`Using default wrapped token at: ${wrappedTokenAddress}\n`);
	}

	// Deploy JayBird Token
	console.log("Deploying JayBird token...");
	const JAYBIRD = await hre.ethers.getContractFactory("JayBird");
	let jaybird = await JAYBIRD.deploy(TOKEN_NAME, SYMBOL_JAYBIRD, TOTAL_SUPPLY);
	await jaybird.deployed();
	console.log(`JayBird Token deployed to: ${jaybird.address}\n`);

	// Deploy AMM
	console.log("Deploying AMM contract...");
	const AMM = await hre.ethers.getContractFactory("AMM");
	let amm = await AMM.deploy(jaybird.address, wrappedTokenAddress);
	await amm.deployed();
	console.log(`AMM deployed to: ${amm.address}\n`);

	// Deploy NFT Token
	console.log("Deploying NFT contract...");
	const NFT = await hre.ethers.getContractFactory("NFT");
	let nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, NFT_MINT_DATE, BASE_URI);
	await nft.deployed();
	console.log(`NFT deployed to: ${nft.address}\n`);

	// Initialize AMM with liquidity (only for local development)
	if (chainId === 31337) {
		console.log("Setting up initial liquidity...");
		
		// Approve tokens for AMM
		const initialLiquidity = tokens("50000");
		
		// Approve JayBird tokens
		console.log(`Approving ${hre.ethers.utils.formatEther(initialLiquidity)} JayBird tokens for AMM...`);
		let tx = await jaybird.approve(amm.address, initialLiquidity);
		await tx.wait();
		
		// If using a mock token, approve it too
		console.log(`Approving ${hre.ethers.utils.formatEther(initialLiquidity)} Wrapped tokens for AMM...`);
		const wrappedToken = await hre.ethers.getContractAt("JayBird", wrappedTokenAddress);
		tx = await wrappedToken.approve(amm.address, initialLiquidity);
		await tx.wait();
		
		// Add liquidity
		console.log("Adding initial liquidity to AMM...");
		tx = await amm.addLiquidity(initialLiquidity, initialLiquidity);
		await tx.wait();
		
		console.log("Initial liquidity added successfully!");
		
		// Log AMM state
		const token1Balance = await amm.token1Balance();
		const token2Balance = await amm.token2Balance();
		const totalShares = await amm.totalShares();
		
		console.log(`AMM Token1 Balance: ${hre.ethers.utils.formatEther(token1Balance)} JBT`);
		console.log(`AMM Token2 Balance: ${hre.ethers.utils.formatEther(token2Balance)} WPLS`);
		console.log(`Total Shares: ${hre.ethers.utils.formatEther(totalShares)}`);
		console.log(`Deployer Shares: ${hre.ethers.utils.formatEther(await amm.shares(deployer.address))}`);
		
		// Set up NFT contract with JayBird and AMM addresses
		console.log("\nSetting up NFT contract integrations...");
		try {
			// Set JayBird token in NFT contract
			console.log(`Setting JayBird token (${jaybird.address}) in NFT contract...`);
			tx = await nft.setJayBirdToken(jaybird.address);
			await tx.wait();
			console.log("✅ JayBird token set in NFT contract");
			
			// Set AMM contract in NFT contract
			console.log(`Setting AMM contract (${amm.address}) in NFT contract...`);
			tx = await nft.setAMMContract(amm.address);
			await tx.wait();
			console.log("✅ AMM contract set in NFT contract");
			
			// Add NFT contract as a minter
			console.log(`Adding NFT contract (${nft.address}) as a JayBird minter...`);
			tx = await jaybird.addMinter(nft.address);
			await tx.wait();
			console.log("✅ NFT contract set as a minter");
			
			// Enable auto liquidity
			console.log("Enabling auto liquidity in NFT contract...");
			tx = await nft.toggleAutoLiquidity(true);
			await tx.wait();
			console.log("✅ Auto liquidity enabled");
		} catch (error) {
			console.error("Error setting up NFT integrations:", error);
			console.log("You'll need to manually set up the integrations.");
		}
	}
	
	// Print deployment summary
	console.log("\n--- Deployment Summary ---");
	console.log(`Network: ${chainId === 31337 ? "Hardhat Local" : chainId}`);
	console.log(`NFT Contract: ${nft.address}`);
	console.log(`JayBird Token: ${jaybird.address}`);
	console.log(`Wrapped Token: ${wrappedTokenAddress}`);
	console.log(`AMM Contract: ${amm.address}`);
	console.log("------------------------\n");
	
	// Return deployed contract addresses for testing
	return {
		nft: nft.address,
		jaybird: jaybird.address,
		wrappedToken: wrappedTokenAddress,
		amm: amm.address
	};
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});