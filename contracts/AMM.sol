//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";

contract AMM {
    Token public token1;
    Token public token2;
    uint256 public token1Balance;
    uint256 public token2Balance;
    uint256 public K;
    uint256 public totalShares;
    uint256 constant PRECISION = 10 ** 18;

    mapping(address => uint256) public shares;

    event Swap(
        address user,
        address tokenGive,
        uint256 tokenGiveAmount,
        address tokenGet,
        uint256 tokenGetAmount,
        uint256 token1Balance,
        uint256 token2Balance,
        uint256 timestamp
    );

    constructor(Token _token1, Token _token2) {
        token1 = _token1;
        token2 = _token2;
    }

    function addLiquidity(
        uint256 _token1Amount,
        uint256 _token2Amount
    ) external {
        // Deposit Tokens
        // Checks that token1 tranfer passed
        require(
            token1.transferFrom(msg.sender, address(this), _token1Amount),
            "failed to transfer token 1"
        );

        // Checks that token1 tranfer passed
        require(
            token2.transferFrom(msg.sender, address(this), _token2Amount),
            "failed to transfer token 2"
        );

        // Issue Shares
        uint256 share;

        // Issue Shares
        if (totalShares == 0) {
            share = 100 * PRECISION;
        } else {
            uint256 share1 = (totalShares * _token1Amount) / token1Balance;
            uint256 share2 = (totalShares * _token2Amount) / token2Balance;
            require(
                (share1 / 10 ** 3) == (share2 / 10 ** 3),
                "must provide equal token amounts"
            );
            share = share1;
        }

        // Manger Pool
        token1Balance += _token1Amount;
        token2Balance += _token2Amount;
        K = token1Balance * token2Balance;

        // Update Shares
        totalShares += share;
        shares[msg.sender] += share;
    }

    function calculateToken2Deposit(
        uint256 _token1Amount
    ) public view returns (uint256 token2Amount) {
        token2Amount = (token2Balance * _token1Amount) / token1Balance;
    }

    function calculateToken1Deposit(
        uint256 _token2Amount
    ) public view returns (uint256 token1Amount) {
        token1Amount = (token1Balance * _token2Amount) / token2Balance;
    }

    // Returns amount of token2 received when swapping token1
    function calculateToken1Swap(
        uint256 _token1Amount
    ) public view returns (uint256 token2Amount) {
        uint256 token1After = token1Balance + _token1Amount;
        uint256 token2After = K / token1After;
        token2Amount = token2Balance - token2After;

        if (token2Amount == token2Balance) {
            token2Amount--;
        }

        require(token2Amount < token2Balance, "swap amount too large");
    }

    function swapToken1(
        uint256 _token1Amount
    ) external returns (uint256 token2Amount) {
        //Calculate Token 2 Amount
        token2Amount = calculateToken1Swap(_token1Amount);

        //Do Swap
        //1.Transfer token1 tokens out of user wallet to contract
        token1.transferFrom(msg.sender, address(this), _token1Amount);
        //2. Update the token1 balance in the contract
        token1Balance += _token1Amount;
        //3. Update the token2 balance in the contract
        token2Balance -= token2Amount;
        //4. Transfer token2 tokens from the contract to user wallet
        token2.transfer(msg.sender, token2Amount);

        //Emit an Event
        emit Swap(
            msg.sender,
            address(token1),
            _token1Amount,
            address(token2),
            token2Amount,
            token1Balance,
            token2Balance,
            block.timestamp
        );
    }

    // Returns amount of token1 received when swapping token2
    function calculateToken2Swap(
        uint256 _token2Amount
    ) public view returns (uint256 token1Amount) {
        uint256 token2After = token2Balance + _token2Amount;
        uint256 token1After = K / token2After;
        token1Amount = token1Balance - token1After;

        if (token1Amount == token1Balance) {
            token1Amount--;
        }

        require(token1Amount < token1Balance, "swap amount to large");
    }

    function swapToken2(
        uint256 _token2Amount
    ) external returns (uint256 token1Amount) {
        //Calculate Token 2 Amount
        token1Amount = calculateToken2Swap(_token2Amount);

        //Do Swap
        //1.Transfer token1 tokens out of user wallet to contract
        token2.transferFrom(msg.sender, address(this), _token2Amount);
        //2. Update the token1 balance in the contract
        token2Balance += _token2Amount;
        //3. Update the token2 balance in the contract
        token1Balance -= token1Amount;
        //4. Transfer token2 tokens from the contract to user wallet
        token1.transfer(msg.sender, token1Amount);

        //Emit an Event
        emit Swap(
            msg.sender,
            address(token2),
            _token2Amount,
            address(token1),
            token1Amount,
            token1Balance,
            token2Balance,
            block.timestamp
        );
    }

    function calculateWithdrawAmount(
        uint256 _share
    ) public view returns (uint256 token1Amount, uint256 token2Amount) {
        require(_share <= totalShares, "must be less than total shares");
        token1Amount = (_share * token1Balance) / totalShares;
        token2Amount = (_share * token2Balance) / totalShares;
    }

    //Removes Liquidity from the pool
    function removeLiquidity(
        uint256 _share
    ) external returns (uint256 token1Amount, uint256 token2Amount) {
        require(
            _share <= shares[msg.sender],
            "cannot withdraw more share that you have"
        );
        (token1Amount, token2Amount) = calculateWithdrawAmount(_share);

        shares[msg.sender] -= _share;
        totalShares -= _share;

        token1Balance -= token1Amount;
        token2Balance -= token2Amount;
        K = token1Balance * token2Balance;

        token1.transfer(msg.sender, token1Amount);
        token2.transfer(msg.sender, token2Amount);
    }
}
