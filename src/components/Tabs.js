import Nav from "react-bootstrap/Nav";
import { LinkContainer } from "react-router-bootstrap";

const Tabs = () => {
	return (
		<Nav variant="pills" defaultActiveKey="/" className="justify-content-center">
			<LinkContainer to="/">
				<Nav.Link>Home</Nav.Link>
			</LinkContainer>
			<LinkContainer to="/info">
				<Nav.Link>Information</Nav.Link>
			</LinkContainer>
			<LinkContainer to="/collection">
				<Nav.Link>My Collection</Nav.Link>
			</LinkContainer>
		</Nav>
	);
};

export default Tabs;
