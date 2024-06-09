// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
	//
	const NAME = "Jay Birds";
	const SYMBOL = "JBTNFT";
	const MAX_SUPPLY = 10000;
	const BASE_URI = "ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/";
	const COST = ethers.utils.parseUnits("2000000", "ether");
	const NFT_MINT_DATE = (Date.now() + 60000).toString().slice(0, 10);

	// JayBird Token Constants
	const TOKEN_NAME = "JayBird Token";
	const SYMBOL_JAYBIRD = "JBT";
	const TOTAL_SUPPLY = ethers.utils.parseUnits("1000000000", "ether"); // 1 billion tokens

	// Deploy NFT Token
	const NFT = await hre.ethers.getContractFactory("NFT");
	let nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, NFT_MINT_DATE, BASE_URI);

	await nft.deployed();
	console.log(`Token deployed to: ${nft.address}\n`);

	// Deploy JayBird Token
	const jayBird = await hre.ethers.getContractFactory("JayBird");
	let jaybird = await jayBird.deploy(TOKEN_NAME, SYMBOL_JAYBIRD, TOTAL_SUPPLY);

	await jaybird.deployed();
	console.log(`Token deployed to: ${jaybird.address}\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
