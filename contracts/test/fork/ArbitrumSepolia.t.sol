// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Base} from "../utils/Base.t.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {CreatorRegistry} from "../../src/CreatorRegistry.sol";
import {LicenseRegistry} from "../../src/LicenseRegistry.sol";
import {LicenseEscrow} from "../../src/LicenseEscrow.sol";
import {ReceiptAnchor} from "../../src/ReceiptAnchor.sol";
import {ArbitrumSepolia} from "../../script/ArbitrumSepolia.sol";
import {MockUSDC} from "../utils/MockUSDC.sol";

/// @notice Runs against an Arbitrum Sepolia fork with Circle's real USDC. Skipped unless RPC_URL is set.
contract ArbitrumSepoliaForkTest is Base {
    function setUp() public override {
        string memory rpc = vm.envOr("RPC_URL", string(""));
        if (bytes(rpc).length == 0) {
            vm.skip(true);
            return;
        }
        vm.createSelectFork(rpc);
        super.setUp();
        // Swap the mock for Circle's token. setEscrow is once-only, so the licence registry and
        // receipt anchor are redeployed alongside the new escrow.
        usdc = MockUSDC(ArbitrumSepolia.USDC);
        licences = new LicenseRegistry(platform, creators);
        receipts = new ReceiptAnchor(platform);
        escrow = new LicenseEscrow(platform, usdc, licences, receipts, treasury, FEE_BPS);
        vm.startPrank(platform);
        licences.setEscrow(address(escrow));
        receipts.setEscrow(address(escrow));
        escrow.setRenderAgent(agent, true);
        vm.stopPrank();
    }

    function test_chainAndUsdc() public view {
        assertEq(block.chainid, ArbitrumSepolia.CHAIN_ID);
        IERC20Metadata t = IERC20Metadata(ArbitrumSepolia.USDC);
        assertGt(ArbitrumSepolia.USDC.code.length, 0);
        assertEq(t.decimals(), 6);
        assertEq(t.symbol(), "USDC");
    }

    function test_renderAndRefund_withCircleUsdc() public {
        _register(creator);
        uint256 id = _license(brand, 3);
        deal(ArbitrumSepolia.USDC, brand, 3 * PRICE);
        vm.startPrank(brand);
        usdc.approve(address(escrow), 3 * PRICE);
        escrow.deposit(id, 3 * PRICE);
        vm.stopPrank();

        _render(id, brand, keccak256("fork-file"));
        uint256 fee = uint256(PRICE) * FEE_BPS / 10_000;
        assertEq(usdc.balanceOf(payout), PRICE - fee);
        assertEq(usdc.balanceOf(treasury), fee);

        vm.prank(creator);
        licences.revoke(id);
        escrow.refund(id);
        assertEq(usdc.balanceOf(brand), 2 * uint256(PRICE));
        assertEq(usdc.balanceOf(address(escrow)), 0);
    }
}
