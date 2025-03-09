const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('JayBird', () => {
  let jaybird, accounts, deployer, receiver, exchange

  beforeEach(async () => {
    // Deploy the contract
    const JayBird = await ethers.getContractFactory('JayBird')
    jaybird = await JayBird.deploy('JayBird Token', 'JBT', '1000000')

    accounts = await ethers.getSigners()
    deployer = accounts[0]
    receiver = accounts[1]
    exchange = accounts[2]
  })

  describe('Deployment', () => {
    const name = 'JayBird Token'
    const symbol = 'JBT'
    const decimals = 18
    const totalSupply = tokens('1000000')

    it('has correct name', async () => {
      expect(await jaybird.name()).to.equal(name)
    })

    it('has correct symbol', async () => {
      expect(await jaybird.symbol()).to.equal(symbol)
    })

    it('has correct decimals', async () => {
      expect(await jaybird.decimals()).to.equal(decimals)
    })

    it('has correct total supply', async () => {
      expect(await jaybird.totalSupply()).to.equal(totalSupply)
    })

    it('assigns total supply to deployer', async () => {
      expect(await jaybird.balanceOf(deployer.address)).to.equal(totalSupply)
    })
  })

  describe('Sending Tokens', () => {
    let amount, transaction, result

    describe('Success', () => {
      beforeEach(async () => {
        amount = tokens(100)
        transaction = await jaybird.connect(deployer).transfer(receiver.address, amount)
        result = await transaction.wait()
      })

      it('transfers token balances', async () => {
        expect(await jaybird.balanceOf(deployer.address)).to.equal(tokens(999900))
        expect(await jaybird.balanceOf(receiver.address)).to.equal(amount)
      })

      it('emits a Transfer event', async () => {
        await expect(transaction).to.emit(jaybird, 'Transfer')
          .withArgs(deployer.address, receiver.address, amount)
      })
    })

    describe('Failure', () => {
      it('rejects insufficient balances', async () => {
        const invalidAmount = tokens(100000000)
        await expect(jaybird.connect(deployer).transfer(receiver.address, invalidAmount)).to.be.reverted
      })

      it('rejects invalid recipient', async () => {
        const amount = tokens(100)
        await expect(jaybird.connect(deployer).transfer('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
      })
    })
  })

  describe('Approving Tokens', () => {
    let amount, transaction, result

    beforeEach(async () => {
      amount = tokens(100)
      transaction = await jaybird.connect(deployer).approve(exchange.address, amount)
      result = await transaction.wait()
    })

    describe('Success', () => {
      it('allocates an allowance for delegated token spending', async () => {
        expect(await jaybird.allowance(deployer.address, exchange.address)).to.equal(amount)
      })

      it('emits an Approval event', async () => {
        await expect(transaction).to.emit(jaybird, 'Approval')
          .withArgs(deployer.address, exchange.address, amount)
      })
    })

    describe('Failure', () => {
      it('rejects invalid spenders', async () => {
        await expect(jaybird.connect(deployer).approve('0x0000000000000000000000000000000000000000', amount)).to.be.reverted
      })
    })
  })

  describe('Delegated Token Transfers', () => {
    let amount, transaction, result

    beforeEach(async () => {
      amount = tokens(100)
      transaction = await jaybird.connect(deployer).approve(exchange.address, amount)
      result = await transaction.wait()
    })

    describe('Success', () => {
      beforeEach(async () => {
        transaction = await jaybird.connect(exchange).transferFrom(deployer.address, receiver.address, amount)
        result = await transaction.wait()
      })

      it('transfers token balances', async () => {
        expect(await jaybird.balanceOf(deployer.address)).to.be.equal(ethers.utils.parseUnits('999900', 'ether'))
        expect(await jaybird.balanceOf(receiver.address)).to.be.equal(amount)
      })

      it('resets the allowance', async () => {
        expect(await jaybird.allowance(deployer.address, exchange.address)).to.be.equal(0)
      })

      it('emits a Transfer event', async () => {
        await expect(transaction).to.emit(jaybird, 'Transfer')
          .withArgs(deployer.address, receiver.address, amount)
      })
    })

    describe('Failure', () => {
      it('rejects transfers with insufficient allowance', async () => {
        // Attempt to transfer more than allowed
        const invalidAmount = tokens(101) // More than the 100 tokens approved
        await expect(jaybird.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted
      })

      it('rejects transfers with insufficient balance', async () => {
        // First approve a large amount
        await jaybird.connect(deployer).approve(exchange.address, tokens(1000000))
        
        // Attempt to transfer too many tokens
        const invalidAmount = tokens(1000001) // Greater than total supply
        await expect(jaybird.connect(exchange).transferFrom(deployer.address, receiver.address, invalidAmount)).to.be.reverted
      })
    })
  })
})