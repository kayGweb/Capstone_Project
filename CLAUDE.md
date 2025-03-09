# CLAUDE.md - Guidance for Code Assistants

## Overview
- This is a NFT collection that you have to pay a fee to mint a NFT.  
- In addition each time an NFT is minted.  There is Another token the JAYBIRD Token that is also minted and used to create Liquidity.
- The NFT Fee is used to create a liquidity pair with the JayBird token.  So each minting create more stability for the token.

## Build/Test/Deploy Commands
- Development server: `npm start`
- Build: `npm run build`
- Run all tests: `npm test`
- Run specific test: `npx hardhat test test/[filename].js`
- Deploy contracts: `npx hardhat run scripts/deploy.js --network [network-name]`
- Run local node: `npx hardhat node`
- Blockchain explorer: `REPORT_GAS=true npx hardhat test`

## Code Style Guidelines
- **React**: Follow React functional component patterns with hooks
- **Solidity**: Use 0.8.20 compiler, follow OpenZeppelin contract patterns
- **Imports**: Group imports by external packages first, then internal
- **Naming**: camelCase for variables/functions, PascalCase for components/contracts
- **Error Handling**: Use try/catch for async operations and contract interactions
- **State Management**: Use Redux for global state, React hooks for component state
- **Comments**: Document complex logic and contract functions with NatSpec format
- **Testing**: Write comprehensive tests for contracts using Hardhat/Chai

## Project Structure
- `/contracts`: Solidity smart contracts
- `/src/components`: React UI components
- `/src/store`: Redux state management
- `/src/abis`: Contract ABIs
- `/test`: Contract test files