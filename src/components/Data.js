import { ethers } from "ethers";

const Data = ({ maxSupply, totalSupply, cost, balance }) => {
	return (
		<div className="text-center">
			<p>
				<strong>Available to Mine:</strong>
				&nbsp;{maxSupply - totalSupply}
			</p>
			<p>
				<strong>Cost to Mint:</strong>
				&nbsp;{ethers.utils.formatUnits(cost, "ether")} ETH
			</p>
			<p>
				<strong>You own:</strong>
				&nbsp;{balance.toString()} ETH
			</p>
		</div>
	);
};

export default Data;
