import { ethers } from "ethers";

import { setAccount, setProvider, setNetwork } from "./reducers/provider";
import { setContracts, setSymbols, setBalances } from "./reducers/tokens";
import { setNft, setNftMintDate, setBaseUri } from "./reducers/nft";
import config from "../config.json";

// ABI imports
import NFT_ABI from "../abis/NFT.json";
import JAYBIRD_ABI from "../abis/JayBird.json";
import AMM_ABI from "../abis/AMM.json";

export const loadContracts = async (provider, dispatch, chainId) => {
	//console.log(chainId);
	const nft = new ethers.Contract(config[chainId].nft.address, NFT_ABI, provider);
	const jaybird = new ethers.Contract(config[chainId].jaybird.address, JAYBIRD_ABI, provider);
	const amm = new ethers.Contract(config[chainId].amm.address, AMM_ABI, provider);

	dispatch(setContracts([nft, jaybird, amm]));
	//dispatch(setSymbols([await nft.symbol(), await jaybird.symbol()]));
};

export const loadBalances = async (contracts, account, dispatch) => {
	const balances = await Promise.all(
		contracts.map(async (contract) => {
			return await contract.balanceOf(account);
		})
	);

	dispatch(setBalances(balances));
};

export const loadProvider = (dispatch) => {
	const provider = new ethers.providers.Web3Provider(window.ethereum);
	dispatch(setProvider(provider));

	return provider;
};

export const loadNetwork = async (provider, dispatch) => {
	const { chainId } = await provider.getNetwork();
	dispatch(setNetwork(chainId));

	return chainId;
};

export const loadAccount = async (dispatch) => {
	const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
	const account = ethers.utils.getAddress(accounts[0]);
	dispatch(setAccount(account));

	return account;
};

export const loadNft = (provider, chainId) => {
	return async (dispatch) => {
		try {
			const nft = new ethers.Contract(config[chainId].nft.address, NFT_ABI, provider);
			const baseUri = await nft.baseURI();
			
			dispatch({
				type: 'nfts/setNft',
				payload: nft
			});
			
			dispatch({
				type: 'nfts/setBaseUri',
				payload: baseUri
			});
		} catch (error) {
			console.error('Error loading NFT:', error);
		}
	};
};

export const addLiquidity = async (provider, amm, token1Amount, token2Amount) => {
	try {
		const signer = await provider.getSigner();
		
		// Get token addresses from AMM contract
		const token1Address = await amm.token1();
		const token2Address = await amm.token2();
		
		// Create token instances
		const token1 = new ethers.Contract(
			token1Address,
			[
				"function approve(address spender, uint256 amount) public returns (bool)",
				"function balanceOf(address account) public view returns (uint256)"
			],
			signer
		);
		
		const token2 = new ethers.Contract(
			token2Address,
			[
				"function approve(address spender, uint256 amount) public returns (bool)",
				"function balanceOf(address account) public view returns (uint256)"
			],
			signer
		);
		
		// Approve AMM to spend tokens
		let tx = await token1.approve(amm.address, token1Amount);
		await tx.wait();
		
		tx = await token2.approve(amm.address, token2Amount);
		await tx.wait();
		
		// Add liquidity
		tx = await amm.connect(signer).addLiquidity(token1Amount, token2Amount);
		const receipt = await tx.wait();
		
		return {
			success: true,
			transaction: receipt
		};
	} catch (error) {
		console.error('Error adding liquidity:', error);
		return {
			success: false,
			error: error.message
		};
	}
};

export const calculateToken2DepositAmount = async (amm, token1Amount) => {
	try {
		// Try to calculate based on pool ratio
		const token2Amount = await amm.calculateToken2Deposit(token1Amount);
		return {
			success: true,
			amount: token2Amount
		};
	} catch (error) {
		// If the pool doesn't exist yet or there's an error, use 1:1 ratio
		console.error('Error calculating token2 amount:', error);
		return {
			success: false,
			amount: token1Amount, // Default to 1:1 ratio
			error: error.message
		};
	}
};

export const getLiquidityPoolInfo = async (amm, accountAddress) => {
	try {
		const token1Balance = await amm.token1Balance();
		const token2Balance = await amm.token2Balance();
		const totalShares = await amm.totalShares();
		const userShares = await amm.shares(accountAddress);
		
		return {
			success: true,
			token1Balance,
			token2Balance,
			totalShares,
			userShares,
			userSharePercent: totalShares.gt(0) 
				? userShares.mul(ethers.BigNumber.from(100)).div(totalShares)
				: ethers.BigNumber.from(0)
		};
	} catch (error) {
		console.error('Error getting liquidity pool info:', error);
		return {
			success: false,
			error: error.message
		};
	}
};
