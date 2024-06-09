import { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { ethers } from "ethers";
import Countdown from "react-countdown";

//IMG
import preview from "../preview.png";

// Components
import Navigation from "./Navigation";
import Loading from "./Loading";
import Data from "./Data";
import Mint from "./Mint";

// ABIs: Import your contract ABIs here
import NFT_ABI from "../abis/NFT.json";

// Config: Import your network config here
//import { set } from "lodash";
import config from "../config.json";

function App() {
	const [provider, setProvider] = useState(null);
	const [nft, setNFT] = useState(null);
	const [account, setAccount] = useState(null);
	const [revealTime, setRevealTime] = useState(0);
	const [maxSupply, setMaxSupply] = useState(0);
	const [totalSupply, setTotalSupply] = useState(0);
	const [cost, setCost] = useState(0);
	const [balance, setBalance] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	const loadBlockchainData = async () => {
		// Initiate provider
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		setProvider(provider);

		// Initiate NFT contract
		const nft = new ethers.Contract(config[31337].nft.address, NFT_ABI, provider);
		setNFT(nft);

		// Fetch accounts
		const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
		const account = ethers.utils.getAddress(accounts[0]);
		setAccount(account);

		// fetch countdown
		const allowMintingOn = await nft.allowMintingOn();
		setRevealTime(allowMintingOn.toString() + "000");

		setMaxSupply(await nft.maxSupply());
		setTotalSupply(await nft.totalSupply());
		setCost(await nft.cost());
		setBalance(await nft.balanceOf(account));

		setIsLoading(false);
	};

	useEffect(() => {
		if (isLoading) {
			loadBlockchainData();
		}
	}, [isLoading]);

	return (
		<Container>
			<Navigation account={account} />

			<h1 className="my-4 text-center">Dapp Punks</h1>

			{isLoading ? (
				<Loading />
			) : (
				<>
					<Row>
						<Col>
							{balance > 0 ? (
								<div className="text-center">
									<img
										src={`https://gateway.pinata.cloud/ipfs/QmQPEMsfd1tJnqYPbnTQCjoa8vczfsV1FmqZWgRdNQ7z3g/${balance.toString()}.png`}
										alt="Open Punk"
										width="400px"
										height="400px"
									/>
								</div>
							) : (
								<img src={preview} alt="preview" />
							)}
						</Col>
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
}

export default App;
