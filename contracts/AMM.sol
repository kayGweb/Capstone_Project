// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import "hardhat/console.sol";
import "./JayBird.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IWETH {
    function deposit() external payable;
    function transfer(address to, uint value) external returns (bool);
    function withdraw(uint) external;
}

contract AMM {
    JayBird public token1;
    IERC20 public token2;
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
    
    event LiquidityAdded(
        address provider,
        uint256 token1Amount,
        uint256 token2Amount,
        uint256 newShares,
        uint256 timestamp
    );

    constructor(JayBird _token1, IERC20 _token2) {
        token1 = _token1;
        token2 = IERC20(_token2);
    }
    
    // Allow this contract to receive PLS (useful for direct liquidity addition)
    receive() external payable {
        // Handle received ETH if needed
        // This enables users to send ETH directly to this contract
        emit LiquidityAdded(msg.sender, 0, msg.value, 0, block.timestamp);
    }
    
    // Function to add liquidity with native token
    function addLiquidityETH(uint256 _token1Amount) external payable {
        require(msg.value > 0, "Must send ETH for liquidity");
        
        // Convert ETH to WETH if token2 is WETH
        try IWETH(address(token2)).deposit{value: msg.value}() {
            // Successfully converted ETH to WETH
            
            // Transfer token1 from the user
            require(
                token1.transferFrom(msg.sender, address(this), _token1Amount),
                "failed to transfer token 1"
            );
            
            // Now add the liquidity using the wrapped ETH
            _addLiquidity(_token1Amount, msg.value);
        } catch {
            // If token2 is not WETH or the conversion failed, revert
            revert("Failed to wrap ETH. Token2 might not be WETH");
        }
    }

    // Public function to add liquidity using ERC20 tokens
    function addLiquidity(
        uint256 _token1Amount,
        uint256 _token2Amount
    ) external payable {
        // If msg.value is provided, handle it directly
        if (msg.value > 0) {
            // ETH is sent directly with this call
            require(msg.value == _token2Amount, "Value must match token2 amount");
            
            // Convert ETH to WETH if token2 is WETH
            try IWETH(address(token2)).deposit{value: msg.value}() {
                // Successfully converted ETH to WETH
                
                // Transfer token1 from the user
                require(
                    token1.transferFrom(msg.sender, address(this), _token1Amount),
                    "failed to transfer token 1"
                );
                
                // Now add the liquidity using the wrapped ETH
                _addLiquidity(_token1Amount, msg.value);
                return;
            } catch {
                // If token2 is not WETH or the conversion failed, revert
                revert("Failed to wrap ETH. Token2 might not be WETH");
            }
        }
        
        // Standard ERC20 liquidity addition
        require(
            token1.transferFrom(msg.sender, address(this), _token1Amount),
            "failed to transfer token 1"
        );
        require(
            token2.transferFrom(msg.sender, address(this), _token2Amount),
            "failed to transfer token 2"
        );

        // Add liquidity using internal function
        _addLiquidity(_token1Amount, _token2Amount);
    }
    
    // Internal function to handle liquidity addition logic
    function _addLiquidity(
        uint256 _token1Amount,
        uint256 _token2Amount
    ) internal {
        uint256 share;
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

        token1Balance += _token1Amount;
        token2Balance += _token2Amount;
        K = token1Balance * token2Balance;

        totalShares += share;
        shares[msg.sender] += share;
        
        emit LiquidityAdded(
            msg.sender,
            _token1Amount,
            _token2Amount,
            share,
            block.timestamp
        );
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
        token2Amount = calculateToken1Swap(_token1Amount);

        token1.transferFrom(msg.sender, address(this), _token1Amount);
        token1Balance += _token1Amount;
        token2Balance -= token2Amount;
        token2.transfer(msg.sender, token2Amount);

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

    function calculateToken2Swap(
        uint256 _token2Amount
    ) public view returns (uint256 token1Amount) {
        uint256 token2After = token2Balance + _token2Amount;
        uint256 token1After = K / token2After;
        token1Amount = token1Balance - token1After;

        if (token1Amount == token1Balance) {
            token1Amount--;
        }

        require(token1Amount < token1Balance, "swap amount too large");
    }

    function swapToken2(
        uint256 _token2Amount
    ) external returns (uint256 token1Amount) {
        token1Amount = calculateToken2Swap(_token2Amount);

        token2.transferFrom(msg.sender, address(this), _token2Amount);
        token2Balance += _token2Amount;
        token1Balance -= token1Amount;
        token1.transfer(msg.sender, token1Amount);

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

    function removeLiquidity(
        uint256 _share
    ) external returns (uint256 token1Amount, uint256 token2Amount) {
        require(
            _share <= shares[msg.sender],
            "cannot withdraw more share than you have"
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
