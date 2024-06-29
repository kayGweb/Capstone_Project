import { useEffect, useState } from "react";
import { Nav, Navbar, Container, Button } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { ethers } from "ethers";
import logo from "../logo.png";

import Tabs from "./Tabs";

const Navigation = () => {
	const [account, setAccount] = useState(null);

	const getAccount = async () => {
		const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
		const account = ethers.utils.getAddress(accounts[0]);
		setAccount(account);
	};

	return (
		<Container>
			<Navbar className="my-3">
				<img alt="logo" src={logo} width="40" height="40" className="d-inline-block align-top mx-3" />
				<LinkContainer to="/">
					<Navbar.Brand href="#">JayBird Collection</Navbar.Brand>
				</LinkContainer>
				<Navbar.Toggle aria-controls="nav" />
				<div className="">
					<Tabs />
				</div>
				<Navbar.Collapse className="justify-content-end">
					{account ? (
						<Navbar.Text>{account ? account.slice(0, 5) + "..." + account.slice(38, 42) : "No Account avaiable"}</Navbar.Text>
					) : (
						<Button variant="primary" onClick={getAccount}>
							Connect Wallet
						</Button>
					)}
				</Navbar.Collapse>
			</Navbar>
		</Container>
	);
};

export default Navigation;
