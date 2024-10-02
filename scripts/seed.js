const hre = require("hardhat");
const config = require("../src/config.json");
//import config from "../config.json";

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), "ether");
};

async function main() {
	//fetch Network
	const { chainId } = await ethers.provider.getNetwork();
	console.log(`chainId: ${chainId}`);

	//Get The AMM contract
	const AMM = await ethers.getContractAt("AMM", config[chainId].amm.address);
	console.log(`fetched AMM contract ${AMM.address}`);

	const JayBird = await ethers.getContractAt("JayBird", config[chainId].jaybird.address);
	console.log(`Fetched JayBird contract ${JayBird.address}`);

	let transaction;

	transaction = await JayBird.connect(config[chainId].jaybird.address).transfer(AMM.address, tokens(500000), { gasLimit: 300000 });
	await transaction.wait();
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
