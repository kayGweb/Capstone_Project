import React from "react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Container, Row, Col } from "react-bootstrap";
import { ethers } from "ethers";
import Countdown from "react-countdown";

// Custom React Components
import Loading from "./Loading";
import Data from "./Data";
import Mint from "./Mint";

//IMG
import preview from "../preview.png";

// Redux: Import your store interactions here
import { loadAccount, loadProvider, loadNetwork, loadContracts } from "../store/interactions";

// ABIs: Import your contract ABIs here
import NFT_ABI from "../abis/NFT.json";

// Config: Import your network config here
import config from "../config.json";

const Home = () => {
	let provider;
	//const [account, setAccount] = useState("");
	const [nft, setNFT] = useState(null);
	const [revealTime, setRevealTime] = useState(0);
	const [maxSupply, setMaxSupply] = useState(0);
	const [totalSupply, setTotalSupply] = useState(0);
	const [cost, setCost] = useState(0);
	const [balance, setBalance] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [ownerid, setOwnerid] = useState(0);

	const dispatch = useDispatch();

	// fetch random bird
	function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}

	const loadBlockchainData = async () => {
		let account = "";
		//Initiate provider
		const provider = await loadProvider(dispatch);

		// Fetch Account
		account = await loadAccount(dispatch);

		// fetch ChainId/Network
		await loadNetwork(provider, dispatch);

		// Load Contracts
		await loadContracts(provider, dispatch);

		// Initiate NFT contract
		const nft = new ethers.Contract(config[31337].nft.address, NFT_ABI, provider);
		setNFT(nft);

		// fetch countdown
		const allowMintingOn = await nft.allowMintingOn();
		setRevealTime(allowMintingOn.toString() + "000");

		// Wallet of Owner
		const owner = await nft.walletOfOwner(account);
		setOwnerid(owner);

		const base_uri = await nft.baseURI();
		for (let i = 0; i < ownerid.length; i++) {
			console.log(`https://ipfs.io/${base_uri}${config[31337].metadata[owner[0]]}`);
		}
		//console.log(`https://ipfs.io/${base_uri}${config[31337].metadata[owner[0]]}`);

		setMaxSupply(await nft.maxSupply());
		setTotalSupply(await nft.totalSupply());
		setCost(await nft.cost());
		setBalance(await nft.balanceOf(account));

		setIsLoading(false);
	};

	//eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => {
		if (isLoading) {
			loadBlockchainData();
		}
	}, [isLoading]);

	return (
		<Container>
			{isLoading ? (
				<Loading />
			) : (
				<>
					<Row>
						<Col>
							{balance > 0 ? (
								<div className="text-center">
									<img
										src={`https://gateway.pinata.cloud/ipfs/QmfPZcNLSeopitShcTYtQDvrTzXc5Y6mCX5trJ5QBavgNY/bird${randomInt(10, 14)}.png`}
										alt="Open JayBird NFT"
										width="400px"
										height="400px"
									/>
									<img
										src={`https://gateway.pinata.cloud/ipfs/QmfPZcNLSeopitShcTYtQDvrTzXc5Y6mCX5trJ5QBavgNY/bird${randomInt(15, 19)}.jpeg`}
										alt="Open JayBird NFT"
										width="400px"
										height="400px"
									/>
									<img
										src={`https://gateway.pinata.cloud/ipfs/QmfPZcNLSeopitShcTYtQDvrTzXc5Y6mCX5trJ5QBavgNY/bird${randomInt(5, 9)}.png`}
										alt="Open JayBird NFT"
										width="400px"
										height="400px"
									/>
								</div>
							) : (
								<div className="text-center">
									<img src={preview} alt="preview" />
								</div>
							)}
						</Col>
					</Row>
					<Row>
						<Col>
							<div className="my-4 text-center">
								<Countdown date={parseInt(revealTime)} className="h2" />
							</div>
							<Data maxSupply={maxSupply} totalSupply={totalSupply} cost={cost} balance={balance} />
							<Mint provider={provider} nft={nft} cost={cost} setIsLoading={setIsLoading} />
						</Col>
					</Row>
				</>
			)}
		</Container>
	);
};

export default Home;
