// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Arbitrum Sepolia constants. Each is checked against the chain by test/fork/ArbitrumSepolia.t.sol.
library ArbitrumSepolia {
    /// @dev https://docs.arbitrum.io/for-devs/dev-tools-and-resources/chain-info
    uint256 internal constant CHAIN_ID = 421614;

    /// @dev Circle USDC, 6 decimals.
    ///      https://developers.circle.com/stablecoins/usdc-contract-addresses (Arbitrum Sepolia)
    ///      Faucet: https://faucet.circle.com
    address internal constant USDC = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
}
