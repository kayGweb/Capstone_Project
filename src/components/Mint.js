import { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";
import { useDispatch } from "react-redux";
import { ethers } from "ethers";
import { loadNft } from "../store/interactions";
import { useAsyncValue } from "react-router-dom";

const Mint = ({ provider, nft, cost, setIsLoading, amm }) => {
	const [isWaiting, setIsWaiting] = useState(false);
	const [selectedValue, setSelectedValue] = useState("1"); // Initialize with "1" as string
	const [addLiquidity, setAddLiquidity] = useState(true);
	const [liquidityAmount, setLiquidityAmount] = useState(1);

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
			
			console.log("Minting amount:", mintAmount);
			console.log("Cost per NFT:", ethers.utils.formatEther(cost));
			console.log("Total cost:", ethers.utils.formatEther(cost.mul(mintAmount)));
			
			// Subscribe to the mint event, save result to SQLLite DB or Redux
			nft.on("Mint", async (amount, from, event) => {
				try {
					const address = await signer.getAddress();
					const balance = await nft.balanceOf(address);

					console.log("from:", from);
					console.log("Mint event:", event);
					console.log("Amount:", amount.toNumber());
					console.log("User NFT balance:", balance.toNumber());
				} catch (error) {
					console.error("Error processing Mint event:", error);
				}
			});

			// Debug logs
			console.log("Selected Value: ", mintAmount);
			const balance = await signer.getBalance();
			console.log("User Balance: ", ethers.utils.formatEther(balance));
			console.log("Cost: ", ethers.utils.formatEther(cost));

			// Mint NFT
			const transaction = await nft.connect(signer).mint(mintAmount, {
				value: cost.mul(mintAmount),
				gasLimit: 500000, // Increased gas limit
				gasPrice: ethers.utils.parseUnits("10", "gwei")
			});
			
			console.log("Transaction hash:", transaction.hash);
			await transaction.wait();
			console.log("Transaction confirmed!");

			// Get network chain ID
			const network = await provider.getNetwork();
			const chainId = network.chainId;

			// Get user's NFT balance after minting
			const nftBalance = await nft.balanceOf(await signer.getAddress());
			console.log(`User has ${nftBalance.toString()} NFTs after minting`);
			
			// Loop through NFTs to get tokenURIs
			try {
				for (let i = 0; i < nftBalance.toNumber(); i++) {
					const tokenId = await nft.tokenOfOwnerByIndex(await signer.getAddress(), i);
					const link = await nft.tokenURI(tokenId);
					console.log(`NFT #${i} - tokenId: ${tokenId.toString()}, URI: ${link}`);
				}
			} catch (error) {
				console.error("Error fetching NFT details:", error);
			}
			
			// Dispatch NFT data to Redux store
			const action = await loadNft(provider, chainId);
			if (action) {
				dispatch(action);
			}

			// If add liquidity is checked, proceed with liquidity creation
			if (addLiquidity && liquidityAmount > 0) {
				await addLiquidityWithTokens(signer);
			}
		} catch (error) {
			window.alert("Transaction failed: " + error.message);
			console.error("Transaction failed: ", error);
		}
		setIsWaiting(false);
	};

	const addLiquidityWithTokens = async (signer) => {
		try {
			console.log("Adding liquidity to the pool...");
			
			// Get token addresses
			const token1Address = await amm.token1();
			const token2Address = await amm.token2();
			
			console.log("Token1 (JayBird) address:", token1Address);
			console.log("Token2 (PLS) address:", token2Address);
			
			// Create token contracts
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
			
			// Convert liquidityAmount to Wei
			const token1Amount = ethers.utils.parseEther(liquidityAmount.toString());
			
			// Calculate required amount of token2 based on the pool's current ratio
			let token2Amount;
			try {
				// If pool exists, use the calculated amount
				token2Amount = await amm.calculateToken2Deposit(token1Amount);
				console.log(`Required token2 amount: ${ethers.utils.formatEther(token2Amount)} based on pool ratio`);
			} catch (error) {
				// If this is the first liquidity provision or there's an error, use 1:1 ratio
				token2Amount = token1Amount;
				console.log(`Using 1:1 ratio for initial liquidity: ${ethers.utils.formatEther(token2Amount)}`);
			}
			
			// Check user balances
			const token1Balance = await token1.balanceOf(await signer.getAddress());
			const token2Balance = await token2.balanceOf(await signer.getAddress());
			
			console.log(`User token1 balance: ${ethers.utils.formatEther(token1Balance)}`);
			console.log(`User token2 balance: ${ethers.utils.formatEther(token2Balance)}`);
			
			// Ensure user has enough tokens
			if (token1Balance.lt(token1Amount)) {
				throw new Error("Insufficient token1 balance for liquidity");
			}
			
			if (token2Balance.lt(token2Amount)) {
				throw new Error("Insufficient token2 balance for liquidity");
			}
			
			// Approve AMM to spend tokens
			console.log("Approving token1 for AMM contract...");
			let tx = await token1.approve(amm.address, token1Amount);
			await tx.wait();
			
			console.log("Approving token2 for AMM contract...");
			tx = await token2.approve(amm.address, token2Amount);
			await tx.wait();
			
			// Add liquidity to the pool
			console.log(`Adding liquidity: ${ethers.utils.formatEther(token1Amount)} token1 and ${ethers.utils.formatEther(token2Amount)} token2`);
			tx = await amm.connect(signer).addLiquidity(token1Amount, token2Amount);
			await tx.wait();
			
			console.log("Liquidity added successfully!");
			
			// Get user's share of the pool
			const userShares = await amm.shares(await signer.getAddress());
			console.log(`User's liquidity pool shares: ${ethers.utils.formatEther(userShares)}`);
			
			// Get total shares
			const totalShares = await amm.totalShares();
			console.log(`Total liquidity pool shares: ${ethers.utils.formatEther(totalShares)}`);
			
		} catch (error) {
			console.error("Error adding liquidity:", error);
			window.alert(`Failed to add liquidity: ${error.message}`);
		}
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
					
					<Form.Check 
						className="mb-3"
						type="checkbox" 
						label="Add liquidity with PLS and JayBird tokens" 
						checked={addLiquidity} 
						onChange={(e) => setAddLiquidity(e.target.checked)} 
					/>
					
					{addLiquidity && (
						<Form.Group className="mb-3">
							<Form.Label>Amount of JayBird tokens to add to liquidity pool</Form.Label>
							<Form.Control 
								type="number" 
								min="0.1" 
								step="0.1" 
								value={liquidityAmount} 
								onChange={(e) => setLiquidityAmount(e.target.value)} 
							/>
							<Form.Text className="text-muted">
								This will add liquidity to the PLS-JayBird pool
							</Form.Text>
						</Form.Group>
					)}
					
					<Button style={{ width: "100%" }} variant="primary" type="submit">
						{addLiquidity ? "Mint & Create Liquidity" : "Mint NFT"}
					</Button>
				</Form.Group>
			)}
		</Form>
	);
};

export default Mint;