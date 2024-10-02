import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import config from "../config.json";

const Mint = ({ provider, nft, cost, setIsLoading, amm }) => {
	const [isWaiting, setIsWaiting] = useState(false);

	const mintHandler = async (e) => {
		e.preventDefault();
		setIsWaiting(true);

		try {
			const signer = await provider.getSigner();

			//Subscribe to the mint event, save result to SQlLite DB

			//Mint NFT
			const transaction = await nft.connect(signer).mint(1, { value: cost });
			await transaction.wait();

			//Get NFT Link
			//todo: Get the tokenID's from the mint event
			let tokenID = 1;
			const link = await nft.tokenURL(tokenID);
			//Save link into redux store

			//Manage the LIquidity pool
			//const transaction2 = await amm.connect(signer).addLiquidity();
		} catch {
			window.alert("User Rejected or transaction reverted");
			console.log("User Rejected or transaction reverted");
		}

		setIsLoading(true);
	};

	return (
		<Form onSubmit={mintHandler} style={{ maxWidth: "450px", margin: "50px auto" }}>
			{isWaiting ? (
				<Spinner animation="border" role="status" style={{ display: "block", margin: "0 auto" }} />
			) : (
				<Form.Group>
					<Button style={{ width: "100%" }} variant="primary" type="submit">
						Mint & Create Liqudity
					</Button>
				</Form.Group>
			)}
		</Form>
	);
};

export default Mint;
