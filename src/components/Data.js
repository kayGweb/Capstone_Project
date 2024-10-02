import { ethers } from "ethers";

const Data = ({ maxSupply, totalSupply, cost, balance, chainId }) => {
	function returnBlockchain() {
		//console.log(chainId);
		switch (chainId) {
			case 369:
				return "PLS";
			case 943:
				return "tPLS";
			case 31337:
				return "HHETH";
			default:
				return "testing";
		}
	}

	return (
		<div className="text-center">
			<p>
				<strong>Available to Mine:</strong>
				&nbsp;{maxSupply - totalSupply}
			</p>
			<p>
				<strong>Cost to Mint:</strong>
				&nbsp; <span id="cost">{ethers.utils.formatUnits(cost, "ether")}</span>
				<span> {returnBlockchain()}</span>
			</p>
			<p>
				<strong>You own:</strong>
				&nbsp; <span>{balance.toString()}</span> <span> {returnBlockchain()}</span>
			</p>
		</div>
	);
};

export default Data;
