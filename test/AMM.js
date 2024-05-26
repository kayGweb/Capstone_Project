const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('AMM', () => {
  let accounts, 
      deployer,
      liqudityProvider,
      investor1,
      investor2;

  let token1,
      token2,
      amm;

  beforeEach(async () => {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    liqudityProvider = accounts[1]
    investor1 = accounts[2]
    investor2 = accounts[3]

    //Deploy Token
    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy('Dapp University', 'DAPP', '1000000')
    token2 = await Token.deploy('USD Token', 'USD', '1000000')

    //Send Token1 to liquidity Provider
    let transaction = await token1.connect(deployer)
          .transfer(liqudityProvider.address, tokens(100000))
        await transaction.wait()

    //Send Token2 to liquidity Provider    
    transaction = await token2.connect(deployer)
        .transfer(liqudityProvider.address, tokens(100000))
      await transaction.wait()

    //Send Investor1 token1
    transaction = await token1.connect(deployer).transfer(investor1.address, tokens(100000))
    await transaction.wait()

    //Send Investor2 tokens2
    transaction = await token2.connect(deployer).transfer(investor2.address, tokens(100000))
    await transaction.wait()

    const AMM = await ethers.getContractFactory('AMM')
    amm = await AMM.deploy(token1.address, token2.address)
    
  })

    describe('Deployment', () => {

      it('has correct name', async () => {
        expect(amm.address).to.not.equal(0x0)
      })

      it('returns token1 address', async () => {
        expect(await amm.token1()).to.equal(token1.address)
      })

      it('returns token2 address', async () => {
        expect(await amm.token2()).to.equal(token2.address)
      })

    })

    describe('Swaping tokens', () => {
      let amount, transaction, result, balance, estimate;

      it('faciliates Swaps', async () => {
        amount = tokens(100000)
        transaction = await token1.connect(deployer).approve(amm.address, amount)
        await transaction.wait()

        transaction = await token2.connect(deployer).approve(amm.address, amount)
        await transaction.wait()

        transaction = await amm.connect(deployer).addLiquidity(amount, amount)
        await transaction.wait()

        expect(await token1.balanceOf(amm.address)).to.equal(amount)
        expect(await token2.balanceOf(amm.address)).to.equal(amount)

        expect(await amm.token1Balance()).to.equal(amount)
        expect(await amm.token2Balance()).to.equal(amount)

        //expect(await amm.K()).to.equal(tokens(1000000))

        //check deployer has 100 shares;
        expect(await amm.shares(deployer.address)).to.equal(tokens(100))
        expect(await amm.totalShares()).to.equal(tokens(100))

        //LP adds More Liquidity
        //LP approves 50k tokens
        amount = tokens(50000)
        tranaction = await token1.connect(liqudityProvider).approve(amm.address, amount)
        await transaction.wait()

        transaction = await token2.connect(liqudityProvider).approve(amm.address, amount)
        await transaction.wait()

        //console.log(`calToken1Swap = ${await amm.calculateToken2Deposit(amount)}`)

        let token2Deposit = await amm.calculateToken2Deposit(amount)

        transaction = await amm.connect(liqudityProvider).addLiquidity(amount, token2Deposit)
        await transaction.wait()

        expect(await amm.shares(liqudityProvider.address)).to.equal(tokens(50))

        expect(await amm.shares(deployer.address)).to.equal(tokens(100))

        expect(await amm.totalShares()).to.equal(tokens(150))

        //Investor 1 swaps

        // Check swaps before swapping
        console.log(`Price1 =  ${await amm.token2Balance() / await amm.token1Balance()}`)

        //Investor approves all tokens
        transaction = await token1.connect(investor1).approve(amm.address, tokens(100000))
        await transaction.wait()

        // Check investor1 balance before swap
        balance = await token2.balanceOf(investor1.address)
        console.log(`Investor1 Token2 balance before swap: ${ethers.utils.formatEther(balance)}`)

        // Estimate amount of tokens investo1 will receive after sapping token1: include slippage
        estimate = await amm.calculateToken1Swap(tokens(1))
        console.log(`Token2 amount in Investor1 will receive after swap: ${ethers.utils.formatEther(estimate)}`)

        // investor1 swaps 1 token1
        transaction = await amm.connect(investor1).swapToken1(tokens(1))
        result = await transaction.wait()

        // Check for Swap event
        await expect(transaction).to.emit(amm, 'Swap')
          .withArgs(
            investor1.address,
            token1.address,
            tokens(1),
            token2.address,
            estimate,
            await amm.token1Balance(),
            await amm.token2Balance(),
            (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
          )

        // Check investor1 balance after swap
        balance = await token2.balanceOf(investor1.address)
        console.log(`Investor1 Token2 balance after swap: ${ethers.utils.formatEther(balance)}`)
        expect(estimate).to.equal(balance)

        // Check AMM token balances are in sync
        expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
        expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

        // Check Price after swap
        console.log(`Price ${await amm.token2Balance() / await amm.token1Balance()}`)

        // Investor 1 Swaps Again

        //Swap some more tokens to see what happens
        balance = await token2.balanceOf(investor1.address)
        console.log(`Investor1 Token2 balance before swap: ${ethers.utils.formatEther(balance)}`)

        estimate = await amm.calculateToken1Swap(tokens(1))
        console.log(`Token2 amount in Investor1 will receive after swap: ${ethers.utils.formatEther(estimate)}`)

        transaction = await amm.connect(investor1).swapToken1(tokens(1))
        await transaction.wait()

        balance = await token2.balanceOf(investor1.address)
        console.log(`Investor1 Token2 balance after swap: ${ethers.utils.formatEther(balance)}`)

        // Check AMM token balances are in sync
        expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
        expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

        // Check Price after swap
        console.log(`Price ${await amm.token2Balance() / await amm.token1Balance()}`)


        //Investor Swaps a large amount

        //Swap some more tokens to see what happens
        balance = await token2.balanceOf(investor1.address)
        console.log(`Investor1 Token2 balance before swap: ${ethers.utils.formatEther(balance)}`)

        estimate = await amm.calculateToken1Swap(tokens(10000))
        console.log(`Token2 amount in Investor1 will receive after swap: ${ethers.utils.formatEther(estimate)}`)

        transaction = await amm.connect(investor1).swapToken1(tokens(10000))
        await transaction.wait()

        balance = await token2.balanceOf(investor1.address)
        console.log(`Investor1 Token2 balance after swap: ${ethers.utils.formatEther(balance)}`)
        //expect(estimate).to.equal(balance)

        // Check AMM token balances are in sync
        expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
        expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

        // Check Price after swap
        console.log(`Price ${await amm.token2Balance() / await amm.token1Balance()}`)

        // Investor2 swaps

        transaction = await token2.connect(investor2).approve(amm.address, tokens(100000))
        await transaction.wait()

        balance = await token1.balanceOf(investor2.address)
        console.log(`Investor2 Token1 balance after swap: ${ethers.utils.formatEther(balance)}`)

        // Estimate amount od tokens investor2 will receive after swapping token2: includes slippage
        estimate = await amm.calculateToken2Swap(tokens(1))
        console.log(`token2 Amount investor2 will receive after swap: ${ethers.utils.formatEther(estimate)}`)

        //Investor2 swaps Token2
        transaction = await amm.connect(investor2).swapToken2(tokens(1))
        await transaction.wait()

        // Check for Swap event
        await expect(transaction).to.emit(amm, 'Swap')
          .withArgs(
            investor2.address,
            token2.address,
            tokens(1),
            token1.address,
            estimate,
            await amm.token1Balance(),
            await amm.token2Balance(),
            (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
          )

        // Check investor2 balance
        balance = await token1.balanceOf(investor2.address)
        console.log(`Investor2 Token1 balance after swap: ${ethers.utils.formatEther(balance)}`)
        expect(estimate).to.eq(balance)

        // Check AMM token balances are in sync
        expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
        expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

        // Check Price after swap
        console.log(`Price ${await amm.token2Balance() / await amm.token1Balance()}`)

        // Removing liquidity

        console.log(`AMM Token1 Balance: ${ethers.utils.formatEther(await amm.token1Balance())}`)
        console.log(`AMM Token2 Balance: ${ethers.utils.formatEther(await amm.token2Balance())}`)

        // Check LP balance before removing tokens
        balance = await token1.balanceOf(liqudityProvider.address)
        console.log(`liqudity Provider token1 balance before removing funds: ${ethers.utils.formatEther(balance)}`)

        balance = await token2.balanceOf(liqudityProvider.address)
        console.log(`liqudity Provider token2 balance before removing funds: ${ethers.utils.formatEther(balance)}`)

        // LP removes tokens from pool
        transaction = await amm.connect(liqudityProvider).removeLiquidity(tokens(50)) //50 Shares
        await transaction.wait()

        // LP check after removing Liquidity
        balance = await token1.balanceOf(liqudityProvider.address)
        console.log(`Liquidity Provider Token1 balance after removing funds: ${ethers.utils.formatEther(balance)}`)

        balance = await token2.balanceOf(liqudityProvider.address)
        console.log(`Liquidity Provider Token2 balance after removing funds: ${ethers.utils.formatEther(balance)}`)

        //LP should have 0 shares
        expect(await amm.shares(liqudityProvider.address)).to.equal(0)

        // Deployer should have 100 shares
        expect(await amm.shares(deployer.address)).to.equal(tokens(100))

        // AMM Pool has 100 total shares
        expect(await amm.totalShares()).to.equal(tokens(100))

      })

    })

})
