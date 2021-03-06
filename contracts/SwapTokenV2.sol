// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract SwapTokenV2 is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    struct Rate {
        uint256 rate;
        uint32 rateDecimal;
    }

    mapping(address => mapping(address => Rate)) private tokensToRate;

    event ChangeRate(
        address _tokenIn,
        address _tokenOut,
        uint256 _rate,
        uint32 _rateDecimal
    );

    event Swap(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 amountOut
    );

    function __Swap_init() public initializer {
        __Ownable_init();
    }

    receive() external payable {}

    function setTokenRate(
        address _tokenIn,
        address _tokenOut,
        uint256 _rate,
        uint32 _rateDecimal
    ) external onlyOwner {
        tokensToRate[_tokenIn][_tokenOut].rate = _rate;
        tokensToRate[_tokenIn][_tokenOut].rateDecimal = _rateDecimal;

        emit ChangeRate(_tokenIn, _tokenOut, _rate, _rateDecimal);
    }

    function getTokenRate(address _tokenIn, address _tokenOut)
        external
        view
        returns (uint256, uint32)
    {
        Rate memory tokenRate = tokensToRate[_tokenIn][_tokenOut];
        require(tokenRate.rate > 0, "Token rate must be greater than zero");

        return (tokenRate.rate, tokenRate.rateDecimal);
    }

    // function swap(
    //     address _tokenIn,
    //     address _tokenOut,
    //     uint256 _amountIn
    // ) external payable {
    //     uint256 amountOut;
    //     uint256 amountIn;
    //     require(_tokenIn != _tokenOut, "Two exchange token must be different");

    //     if (_tokenIn == address(0x0)) {
    //         require(msg.value > 0, "Ether amount must be greater than zero");

    //         amountIn = msg.value;
    //     } else {
    //         require(_amountIn > 0, "Token amount must be greater than zero");

    //         amountIn = _amountIn;
    //     }

    //     Rate memory tokenRate = tokensToRate[_tokenIn][_tokenOut];
    //     require(tokenRate.rate > 0, "Token rate must be greater than zero");

    //     amountOut = (amountIn * tokenRate.rate) / 10**tokenRate.rateDecimal;

    //     _handleInCome(_tokenIn, msg.sender, amountIn);
    //     _handleOutcome(_tokenOut, msg.sender, amountOut);

    //     emit Swap(_tokenIn, _tokenOut, amountIn, amountOut);
    // }

    function _handleInCome(
        address _tokenIn,
        address _sender,
        uint256 _amountIn
    ) internal {
        if (_tokenIn == address(0x0)) {
            return;
        }

        IERC20Upgradeable tokenIn = IERC20Upgradeable(_tokenIn);
        tokenIn.safeTransferFrom(_sender, address(this), _amountIn);
    }

    function _handleOutcome(
        address _tokenOut,
        address _receiver,
        uint256 _amountOut
    ) internal {
        if (_tokenOut == address(0x0)) {
            (bool sent, ) = _receiver.call{value: _amountOut}("");
            require(sent, "Transfer outcome token failed");
            return;
        }

        IERC20Upgradeable tokenOut = IERC20Upgradeable(_tokenOut);
        tokenOut.safeTransfer(_receiver, _amountOut);
    }
}
