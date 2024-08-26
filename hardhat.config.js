require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			chainId: 31337
		},
		pulsechainTestnet: {
			url: "https://rpc.v4.testnet.pulsechain.com",
			chainId: 943, // PulseChain Testnet v4 chain ID
			accounts: [`0x${process.env.PRIVATE_KEY_PULSECHAIN_TESTNET}`]
		},
		pulsechainMainnet: {
			url: "https://rpc.mainnet.pulsechain.com",
			chainId: 369, // PulseChain Mainnet chain ID
			accounts: [`0x${process.env.PRIVATE_KEY_PULSECHAIN_MAINNET}`]
		},
		sepolia: {
			url: `https://sepolia.infura.io/v3/${process.env.ALCHEMY_API_KEY}`,
			chainId: 11155111, // Sepolia testnet chain ID
			accounts: [`0x${process.env.PRIVATE_KEY_ETHEREUM_TESTNET}`]
		}
	},
	solidity: "0.8.20"
};
