// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

//Config for network and contracts
const config = require("../src/config.json");

async function main() {
	//
	const WtPLS = "0x70499adEBB11Efd915E3b69E700c331778628707";
	//NFT Token Constants
	const NAME = "JayBird Collection";
	const SYMBOL = "JBC";
	const MAX_SUPPLY = 20;
	const BASE_URI = "ipfs/QmfPZcNLSeopitShcTYtQDvrTzXc5Y6mCX5trJ5QBavgNY/";
	const COST = ethers.utils.parseUnits("200", "ether");
	const NFT_MINT_DATE = (Date.now() + 6000000).toString().slice(0, 10);

	// JayBird Token Constants
	const TOKEN_NAME = "JayBird Token";
	const SYMBOL_JAYBIRD = "JBT";
	const TOTAL_SUPPLY = ethers.utils.parseUnits("1000000", "ether");

	// Deploy NFT Token
	const NFT = await hre.ethers.getContractFactory("NFT");
	let nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, NFT_MINT_DATE, BASE_URI);
	await nft.deployed();
	console.log(`NFT deployed to: ${nft.address}\n`);

	// Deploy JayBird Token
	const JAYBIRD = await hre.ethers.getContractFactory("JayBird");
	let jaybird = await JAYBIRD.deploy(TOKEN_NAME, SYMBOL_JAYBIRD, TOTAL_SUPPLY);
	await jaybird.deployed();
	console.log(`JayBird Token deployed to: ${jaybird.address}\n`);

	// ChainId for this network
	const { chainId } = await hre.ethers.provider.getNetwork();
	console.log(`chainId: ${chainId}`);

	// Deploy AMM
	const AMM = await hre.ethers.getContractFactory("AMM");
	let amm = await AMM.deploy(jaybird.address, config[chainId].wrappedGasToken.address);
	await amm.deployed();
	console.log(`AMM deployed to: ${amm.address}\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
