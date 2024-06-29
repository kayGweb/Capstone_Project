//import { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Container } from "react-bootstrap";
//import { ethers } from "ethers";

// Components
import Navigation from "./Navigation";
import Collection from "./Collection";
import Info from "./Info";
import Home from "./Home";

function App() {
	return (
		<Container>
			<Router>
				<Navigation />
				<h1 className="my-4 text-center">JayBird Collection</h1>
				<Routes>
					<Route exact path="/" element={<Home />} />
					<Route path="/collection" element={<Collection />} />
					<Route path="/info" element={<Info />} />
				</Routes>
			</Router>
		</Container>
	);
}

export default App;
