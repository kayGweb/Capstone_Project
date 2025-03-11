import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { useDispatch } from "react-redux";
import { ethers } from "ethers";
import { loadNft } from "../store/interactions";

const Mint = ({ provider, nft, cost, setIsLoading, amm }) => {
	const [isWaiting, setIsWaiting] = useState(false);
	const [selectedValue, setSelectedValue] = useState("1"); // Initialize with "1" as string

	const dispatch = useDispatch();

	const mintHandler = async (e, selectedValue) => {
		e.preventDefault();
		const signer = await provider.getSigner();
		setIsWaiting(true);

		try {
			// Ensure selectedValue is a number
			const mintAmount = parseInt(selectedValue, 10);
			
			// Check if valid selection
			if (isNaN(mintAmount) || mintAmount <= 0) {
				throw new Error("Please select a valid number of NFTs to mint");
			}
			
			// Calculate total cost
			const totalCost = cost.mul(mintAmount);
			console.log(`Minting ${mintAmount} NFTs for ${ethers.utils.formatEther(totalCost)} PLS`);
			
			// Check if user has enough balance
			const balance = await signer.getBalance();
			const gasEstimate = ethers.utils.parseEther("0.1"); // Allow 0.1 PLS for gas
			
			if (balance.lt(totalCost.add(gasEstimate))) {
				throw new Error(`Insufficient balance. You need at least ${ethers.utils.formatEther(totalCost.add(gasEstimate))} PLS`);
			}

			// Mint NFT - the contract will handle token rewards and liquidity internally
			const transaction = await nft.connect(signer).mint(mintAmount, {
				value: totalCost,
				gasLimit: 1500000, // Increased gas limit
				gasPrice: ethers.utils.parseUnits("10", "gwei")
			});
			
			console.log("Transaction hash:", transaction.hash);
			setIsWaiting(true);
			await transaction.wait();
			console.log("Mint transaction confirmed!");

			// Get network chain ID
			const network = await provider.getNetwork();
			const chainId = network.chainId;

			// Get user's NFT balance after minting
			const nftBalance = await nft.balanceOf(await signer.getAddress());
			console.log(`User has ${nftBalance.toString()} NFTs`);
			
			// Dispatch NFT data to Redux store
			dispatch(loadNft(provider, chainId, dispatch));
			
			// Show success message
			window.alert(`Successfully minted ${mintAmount} NFTs with automatic liquidity creation! You've also received JayBird tokens as a reward.`);
		} catch (error) {
			window.alert("Transaction failed: " + error.message);
			console.error("Transaction failed: ", error);
		}
		setIsWaiting(false);
	};

	return (
		<Form onSubmit={(e) => mintHandler(e, selectedValue)} style={{ maxWidth: "450px", margin: "50px auto" }}>
			{isWaiting ? (
				<Spinner animation="border" role="status" style={{ display: "block", margin: "0 auto" }} />
			) : (
				<Form.Group>
					<Form.Select 
						className="mb-3" 
						aria-label="Select mint amount"
						value={selectedValue}
						onChange={(e) => setSelectedValue(e.target.value)}
					>
						<option value="">How Many do you want to Mint?</option>
						<option value="1">1</option>
						<option value="2">2</option>
						<option value="3">3</option>
						<option value="4">4</option>
						<option value="5">5</option>
						<option value="6">6</option>
						<option value="7">7</option>
						<option value="8">8</option>
						<option value="9">9</option>
						<option value="10">10</option>
						<option value="11">11</option>
						<option value="12">12</option>
						<option value="13">13</option>
						<option value="14">14</option>
						<option value="15">15</option>
						<option value="16">16</option>
						<option value="17">17</option>
						<option value="18">18</option>
						<option value="19">19</option>
					</Form.Select>
					
					<Form.Text className="text-muted mb-3 d-block">
						When you mint, 70% of your PLS will automatically be added to the liquidity pool with JayBird tokens.
						You'll also receive 30% of the JayBird tokens as a reward.
					</Form.Text>
					
					<Button style={{ width: "100%" }} variant="primary" type="submit">
						Mint NFT
					</Button>
				</Form.Group>
			)}
		</Form>
	);
};

export default Mint;