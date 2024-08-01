require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			chainId: 31337
		}
		// sepolia: {
		// 	url: "https://sepolia.",
		// 	accounts: ["0x", "0x"]
		// }
	},
	solidity: "0.8.19"
};
