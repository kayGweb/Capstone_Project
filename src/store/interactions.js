import { ethers } from "ethers";

import { setAccount, setProvider, setNetwork } from "./reducers/provider";
import { setContracts, setSymbols, setBalances } from "./reducers/tokens";
import config from "../config.json";

// ABI imports
import NFT_ABI from "../abis/NFT.json";
import JAYBIRD_ABI from "../abis/JayBird.json";
import AMM_ABI from "../abis/AMM.json";

export const loadContracts = async (provider, dispatch, chainId) => {
	console.log(chainId);
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
