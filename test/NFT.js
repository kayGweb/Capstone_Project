const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
	return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("NFT", () => {
	const NAME = "Dapp Punks";
	const SYMBOL = "DP";
	const COST = ether(2000000);
	const MAX_SUPPLY = 25;
	const BASE_URI = "ipfs://QmQ2jnDYecFhrf3asEWjyjZRX1pZSsNWG3qHzmNDvXa9qg/";

	let nft, deployer, minter;

	beforeEach(async () => {
		const accounts = await ethers.getSigners();
		deployer = accounts[0];
		minter = accounts[1];
	});

	describe("Deployment", () => {
		const ALLOW_MINTING_ON = (Date.now() + 120000).toString().slice(0, 10);

		beforeEach(async () => {
			const NFT = await ethers.getContractFactory("NFT");
			nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);
		});

		it("has correct name", async () => {
			expect(await nft.name()).to.equal(NAME);
		});

		it("has correct symbol", async () => {
			expect(await nft.symbol()).to.equal(SYMBOL);
		});

		it("returns the cost to mine", async () => {
			expect(await nft.cost()).to.equal(COST);
		});

		it("returns the maximum total supply", async () => {
			expect(await nft.maxSupply()).to.equal(MAX_SUPPLY);
		});

		it("returns the allowed minting time", async () => {
			expect(await nft.allowMintingOn()).to.equal(ALLOW_MINTING_ON);
		});

		it("returns the base uri", async () => {
			expect(await nft.baseURI()).to.equal(BASE_URI);
		});
	});

	describe("Minting", () => {
		let transaction, result;

		describe("Success", async () => {
			const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);

			beforeEach(async () => {
				const NFT = await ethers.getContractFactory("NFT");
				nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

				transaction = await nft.connect(minter).mint(1, { value: COST });
				result = await transaction.wait();
			});

			it("returns the address of the minter", async () => {
				expect(await nft.ownerOf(1)).to.equal(minter.address);
			});

			it("returns IPFS URI", async () => {
				console.log(await nft.tokenURI(1));
				expect(await nft.tokenURI(1)).to.equal(`${BASE_URI}1.json`);
			});

			it("returns the total number of tokens the minter owns", async () => {
				expect(await nft.balanceOf(minter.address)).to.equal(1);
			});

			it("updates the total supply", async () => {
				expect(await nft.totalSupply()).to.equal(1);
			});

			it("updates the contract ether balance", async () => {
				expect(await ethers.provider.getBalance(nft.address)).to.equal(COST);
			});

			it("emits Mint Event", async () => {
				await expect(transaction).to.emit(nft, "Mint").withArgs(1, minter.address);
			});
		});

		describe("failure", async () => {
			it("rejects insuffient payment", async () => {
				const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);

				const NFT = await ethers.getContractFactory("NFT");
				nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

				await expect(nft.connect(minter).mint(1, { value: ether(1) })).to.be.reverted;
			});

			it("requires at least 2 NFT to be minted", async () => {
				const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);

				const NFT = await ethers.getContractFactory("NFT");
				nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

				await expect(nft.connect(minter).mint(0, { value: COST })).to.be.reverted;
			});

			it("rejects minting before allowed time", async () => {
				const ALLOW_MINTING_ON = new Date("May 26, 2033 18:00:00").getTime().toString().slice(0, 10);

				const NFT = await ethers.getContractFactory("NFT");
				nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

				await expect(nft.connect(minter).mint(1, { value: COST })).to.be.reverted;
			});

			it("does not allow more NFTs to be minted that max amount", async () => {
				const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);

				const NFT = await ethers.getContractFactory("NFT");
				nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

				await expect(nft.connect(minter).mint(100, { value: COST })).to.be.reverted;
			});

			it("does not return URIs for invalid tokens", async () => {
				const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);
				const NFT = await ethers.getContractFactory("NFT");
				nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);
				nft.connect(minter).mint(1, { value: COST });

				await expect(nft.tokenURI("99")).to.be.reverted;
			});

			//it("has correct name", async () => {});
		});
	});

	describe("Displaying NFTs", () => {
		let transaction, result;

		const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);

		beforeEach(async () => {
			const NFT = await ethers.getContractFactory("NFT");
			nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

			transaction = await nft.connect(minter).mint(3, { value: ether(30) });
			result = await transaction.wait();
		});

		it("returns all the NFTs for a given owner", async () => {
			let tokenIds = await nft.walletOfOwner(minter.address);
			//console.log("owner Wallet", tokenIds);
			expect(tokenIds.length).to.equal(3);
			expect(tokenIds[0].toString()).to.equal("1");
		});
	});

	describe("Minting", () => {
		let transaction, result, balanceBefore;

		describe("Success", async () => {
			const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);

			beforeEach(async () => {
				const NFT = await ethers.getContractFactory("NFT");
				nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);

				transaction = await nft.connect(minter).mint(1, { value: COST });
				result = await transaction.wait();

				balanceBefore = await ethers.provider.getBalance(deployer.address);

				transaction = await nft.connect(deployer).withdraw();
				result = await transaction.wait();
			});

			it("deducts contract balance", async () => {
				expect(await ethers.provider.getBalance(nft.address)).to.equal(0);
			});

			it("sends funds to the owner", async () => {
				expect(await ethers.provider.getBalance(deployer.address)).to.be.greaterThan(balanceBefore);
			});

			it("emits a withdraw event", async () => {
				expect(transaction).to.emit(nft, "Withdraw").withArgs(COST, deployer.address);
			});
		});

		describe("failure", async () => {
			it("prevents none owner withdrawal", async () => {
				const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);
				const NFT = await ethers.getContractFactory("NFT");
				nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);
				nft.connect(minter).mint(1, { value: COST });

				await expect(nft.connect(minter).withdraw());
			});

			it("Only owner can change cost", async () => {
				const ALLOW_MINTING_ON = Date.now().toString().slice(0, 10);
				const NFT = await ethers.getContractFactory("NFT");
				nft = await NFT.deploy(NAME, SYMBOL, COST, MAX_SUPPLY, ALLOW_MINTING_ON, BASE_URI);
				nft.connect(minter).mint(1, { value: COST });

				await expect(nft.connect(minter).setCost(ether(30))).to.be.reverted;
			});

			//it("has correct name", async () => {});
		});
	});
});
