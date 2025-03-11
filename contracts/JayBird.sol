// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract JayBird {
    string public name;
    string public symbol;
    uint256 public decimals = 18;
    uint256 public totalSupply;
    address public owner;

    //track balances
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public minters;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner, "Caller is not a minter or owner");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        totalSupply = _totalSupply * 10 ** decimals;
        balanceOf[msg.sender] = totalSupply;
        owner = msg.sender;
        minters[msg.sender] = true; // Owner is a minter by default
    }
    
    // Add a new minter
    function addMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter address");
        minters[_minter] = true;
        emit MinterAdded(_minter);
    }
    
    // Remove a minter
    function removeMinter(address _minter) external onlyOwner {
        require(minters[_minter], "Address is not a minter");
        minters[_minter] = false;
        emit MinterRemoved(_minter);
    }
    
    // Mint tokens to a specified address (only callable by minters)
    function mint(address _to, uint256 _amount) external onlyMinter returns (bool) {
        require(_to != address(0), "Cannot mint to zero address");
        
        balanceOf[_to] += _amount;
        totalSupply += _amount;
        
        emit Transfer(address(0), _to, _amount);
        return true;
    }

    function transfer(
        address _to,
        uint256 _value
    ) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value);
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(
        address _spender,
        uint256 _value
    ) public returns (bool success) {
        require(_spender != address(0));
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        //Balance is enough for successful transfer
        require(_value <= balanceOf[_from]);
        require(_value <= allowance[_from][msg.sender]);
        //Reset the allowance
        allowance[_from][msg.sender] -= _value;
        //Transfer the amount
        _transfer(_from, _to, _value);
        return true;
    }

    function _transfer(address _from, address _to, uint256 _value) internal {
        //require(_value <= balanceOf[_from]);
        require(_to != address(0));

        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(_from, _to, _value);
    }
}
