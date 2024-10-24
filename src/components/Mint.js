import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { ethers } from "ethers";

const Mint = ({ provider, nft, cost, setIsLoading, amm }) => {
	const [isWaiting, setIsWaiting] = useState(false);
	const [selectedValue, setSelectedValue] = useState(0);

	const mintHandler = async (e, selectedValue) => {
		e.preventDefault();
		setIsWaiting(true);
		let tokenId = 0;
		try {
			const signer = await provider.getSigner();

			// Subscribe to the mint event, save result to SQLLite DB or Redux
			nft.on("Mint", (amount, from, event) => {
				console.log("from ", from);
				console.log("Mint event ", event);
				console.log("Amount ", amount.toNumber());
			});

			// Debug logs
			console.log("Selected Value: ", selectedValue);
			const balance = await signer.getBalance();
			console.log("User Balance: ", balance.toString());
			console.log("Cost: ", cost.toString());

			// Mint NFT
			const transaction = await nft.connect(signer).mint(selectedValue, {
				value: cost.mul(selectedValue),
				gasLimit: 300000,
				gasPrice: ethers.utils.parseUnits("10", "gwei")
			});
			await transaction.wait();

			// Get the token ID
			let bigNumber = await nft.tokenOfOwnerByIndex(await signer.getAddress(), 0);
			tokenId = bigNumber.toNumber();
			console.log("Token ID: ", tokenId);

			// Get the token URI
			const link = await nft.tokenURI(tokenId);
			console.log("Link: ", link);

			// Save link into redux store and Local DB
			// Manage the Liquidity pool
			// const transaction2 = await amm.connect(signer).addLiquidity();
		} catch (error) {
			window.alert("Transaction failed: " + error.message);
			console.log("Transaction failed: ", error);
		}
		setIsWaiting(false);
	};

	return (
		<Form onSubmit={(e) => mintHandler(e, selectedValue)} style={{ maxWidth: "450px", margin: "50px auto" }}>
			{isWaiting ? (
				<Spinner animation="border" role="status" style={{ display: "block", margin: "0 auto" }} />
			) : (
				<Form.Group>
					<Form.Select aria-label="Default select example" onChange={(e) => setSelectedValue(e.target.value)}>
						<option>How Many do you want to Mint?</option>
						<option>1</option>
						<option>2</option>
						<option>3</option>
						<option>4</option>
						<option>5</option>
						<option>6</option>
						<option>7</option>
						<option>8</option>
						<option>9</option>
						<option>10</option>
						<option>11</option>
						<option>12</option>
						<option>13</option>
						<option>14</option>
						<option>15</option>
						<option>16</option>
						<option>17</option>
						<option>18</option>
						<option>19</option>
					</Form.Select>
					<Button style={{ width: "100%" }} variant="primary" type="submit">
						Mint & Create Liqudity
					</Button>
				</Form.Group>
			)}
		</Form>
	);
};

export default Mint;
