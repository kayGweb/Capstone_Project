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
				&nbsp;{ethers.utils.formatUnits(cost, "ether")} tPLS
			</p>
			<p>
				<strong>You own:</strong>
				&nbsp;{balance.toString()} tPLS
			</p>
		</div>
	);
};

export default Data;
