import React, {useCallback, useEffect, useState} from "react";
import "./styles.scss";
import {Row, Button, Col, InputGroup, FormControl} from "react-bootstrap";
import Select from "react-select";
import {FaEthereum} from "react-icons/fa";
import {GiToken} from "react-icons/gi";
import {useDispatch, useSelector} from "react-redux";
import {
  addTokenToList,
  globalState,
  resetState,
  setAddress,
} from "../../features/global/globalSlice";
import ERC20TokenArtifact from "../../artifacts/contracts/ERC20Token.sol/ERC20Token.json";
import SwapTokenArtifact from "../../artifacts/contracts/SwapToken.sol/SwapToken.json";
import {ethers} from "ethers";
import {useMemo} from "react";
import {tokenAAddress, tokenBAddress, tokenPoolAddress} from "../../config";

const HARDHAT_NETWORK_ID = "1337";
const zeroAddress = "0x0000000000000000000000000000000000000000";
const {utils} = ethers;

function HomePage() {
  const dispatch = useDispatch();
  const {selectedAddress, tokenList} = useSelector(globalState);
  const [tokenInOptionList, setTokenInOptionList] = useState([]);
  const [tokenOutOptionList, setTokenOutOptionList] = useState([]);
  const [tokenInOption, setTokenInOption] = useState(null);
  const [tokenOutOption, setTokenOutOption] = useState(null);
  const [tokenInAmount, setTokenInAmount] = useState(0);
  const [tokenOutAmount, setTokenOutAmount] = useState(0);
  const [tokenRate, setTokenRate] = useState(0);
  const [errorMessages, setErrorMessages] = useState([]);

  const provider = useMemo(
    () => new ethers.providers.Web3Provider(window.ethereum),
    []
  );
  const signer = provider.getSigner(0);

  const getERC20Token = useCallback(
    (tokenAddress) => {
      const token = new ethers.Contract(
        tokenAddress,
        ERC20TokenArtifact.abi,
        signer
      );
      return token;
    },
    [signer]
  );

  const getTokenPool = (tokenPoolAddress) => {
    const tokenPool = new ethers.Contract(
      tokenPoolAddress,
      SwapTokenArtifact.abi,
      signer
    );

    return tokenPool;
  };

  const tokenPool = getTokenPool(tokenPoolAddress);

  const getERC20TokenInfo = useCallback(
    async (tokenAddress, userAddress) => {
      const token = getERC20Token(tokenAddress);
      const value = await token.symbol();
      const decimal = await token.decimals();
      const balance = (
        (await token.balanceOf(userAddress)) /
        10 ** decimal
      ).toString();
      const poolBalance = (
        (await token.balanceOf(tokenPool.address)) /
        10 ** decimal
      ).toString();
      const address = token.address;
      return {value, address, balance, poolBalance, decimal};
    },
    [getERC20Token, tokenPool.address]
  );

  useEffect(() => {
    const inititalTokenList = async (userAddress, poolAddress) => {
      const tokenA = await getERC20TokenInfo(tokenAAddress, userAddress);
      const tokenB = await getERC20TokenInfo(tokenBAddress, userAddress);
      const nativeToken = {
        value: "ETH",
        address: zeroAddress,
        balance: ((await provider.getBalance(userAddress)) / 1e18).toString(),
        poolBalance: (
          (await provider.getBalance(poolAddress)) / 1e18
        ).toString(),
        decimal: 18,
      };

      dispatch(addTokenToList(tokenA));
      dispatch(addTokenToList(tokenB));
      dispatch(addTokenToList(nativeToken));
    };

    if (selectedAddress && tokenPool) {
      inititalTokenList(selectedAddress, tokenPool.address);
    }
  }, [dispatch, getERC20TokenInfo, provider, selectedAddress, tokenPool]);

  useEffect(() => {
    if (tokenList.length > 0) {
      setTokenInOptionList(tokenList);
      setTokenOutOptionList(tokenList);
    }
  }, [tokenList]);

  const connectWallet = async (e) => {
    e.preventDefault();

    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      alert("Please connect Metamask to Localhost:8545");
      return;
    }

    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    dispatch(setAddress(selectedAddress));
  };

  window.ethereum.on("accountsChanged", ([newAddress]) => {
    if (newAddress) {
      dispatch(resetState());
      dispatch(setAddress(newAddress));
    }
  });

  window.ethereum.on("chainChanged", ([networkId]) => {
    dispatch(resetState());
    window.location.reload();
  });

  window.ethereum.on("disconnect", ([networkId]) => {
    dispatch(resetState());
    window.location.reload();
  });

  const disconnectWallet = async (e) => {
    e.preventDefault();

    dispatch(resetState());
    window.location.reload();
  };

  const showOptionLabel = (e) => {
    return (
      <div className="token-option-label">
        {e.value === "ETH" ? <FaEthereum /> : <GiToken />}
        <span>{e.value}</span>
      </div>
    );
  };

  const renderConnectToWallet = () => {
    return (
      <div className="header__wrapper">
        {selectedAddress ? (
          <div className="header-content">
            <p className="user-address">{selectedAddress}</p>
            <Button
              className="btn btn-secondary button-logout"
              onClick={disconnectWallet}
            >
              Log out
            </Button>
          </div>
        ) : (
          <Button
            className="btn btn-secondary button-connect"
            onClick={connectWallet}
          >
            Connect to Wallet
          </Button>
        )}
      </div>
    );
  };

  const handleSetRate = async (tokenInAddress, tokenOutAddress) => {
    const rateData = await tokenPool.getTokenRate(
      tokenInAddress,
      tokenOutAddress
    );
    const rate = rateData[0].toNumber() / 10 ** rateData[1];
    setTokenRate(rate);
    return rate;
  };

  const handleSetTokenOutAmount = (tokenInAmount, rate) => {
    if (tokenOutOption && rate) {
      const tokenOutAmount = tokenInAmount * rate;
      setTokenOutAmount(tokenOutAmount || 0);
    }
  };

  const handleSelectTokenIn = async (token) => {
    if (token.address !== tokenOutOption?.address) {
      setTokenInOption(token);
      setTokenOutOptionList(
        tokenList.filter((t) => t.address !== token.address)
      );
      if (tokenOutOption) {
        const rate = await handleSetRate(token.address, tokenOutOption.address);
        handleSetTokenOutAmount(tokenInAmount, rate);
      }

      setErrorMessages([]);
    }
  };

  const handleSelectTokenOut = async (token) => {
    if (token.address !== tokenInOption?.address) {
      setTokenOutOption(token);
      setTokenInOptionList(
        tokenList.filter((t) => t.address !== token.address)
      );

      if (tokenInOption) {
        const rate = await handleSetRate(tokenInOption.address, token.address);
        handleSetTokenOutAmount(tokenInAmount, rate);
      }

      setErrorMessages([]);
    }
  };

  const handleChangeTokenInAmount = (e) => {
    if (tokenInOption) {
      const tokenInAmount = parseFloat(e.target.value);
      setTokenInAmount(tokenInAmount);
      handleSetTokenOutAmount(tokenInAmount, tokenRate);
      setErrorMessages([]);
    }
  };

  const handleSwapToken = async (e) => {
    e.preventDefault();
    const errors = [];

    if (!selectedAddress) return;

    if (!tokenInOption || !tokenOutOption) return;

    if (tokenInAmount === 0) {
      errors.push("Token in amount must be greater than zero");
    }

    if (tokenOutAmount === 0) {
      errors.push("Token out amount must be greater than zero");
    }

    if (tokenInAmount > parseFloat(tokenInOption.balance)) {
      errors.push("Token in amount must be less than token in balance of user");
    }

    if (tokenOutAmount > parseFloat(tokenOutOption.poolBalance)) {
      errors.push(
        "Token out amount must be less than token out balance of token pool"
      );
    }

    if (errors.length > 0) {
      setErrorMessages(errors);
      return;
    }

    try {
      let transaction;
      let tx;
      if (tokenInOption.address === zeroAddress) {
        transaction = await tokenPool.swap(
          tokenInOption.address,
          tokenOutOption.address,
          0,
          {
            value: utils.parseEther(tokenInAmount.toString()),
          }
        );
        tx = await transaction.wait();
      } else {
        const tokenIn = getERC20Token(tokenInOption.address);
        if (tokenIn) {
          await tokenIn.approve(
            tokenPool.address,
            utils.parseEther(tokenInAmount.toString())
          );

          transaction = await tokenPool.swap(
            tokenInOption.address,
            tokenOutOption.address,
            utils.parseEther(tokenInAmount.toString())
          );
          tx = await transaction.wait();
        }
      }

      if (tx?.status) {
        const event = (tx.events?.filter((x) => x.event === "Swap"))[0];
        let [, , amountIn, amountOut] = event.args;
        alert(
          `Swap ${amountIn / 10 ** tokenInOption.decimal} ${
            tokenInOption.value
          } to ${amountOut / 10 ** tokenOutOption.decimal} ${
            tokenOutOption.value
          } successfully`
        );

        window.location.reload();
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (window.ethereum === undefined) {
    return (
      <p>
        No Ethereum wallet was detected. <br />
        Please install{" "}
        <a href="http://metamask.io" target="_blank" rel="noopener noreferrer">
          MetaMask
        </a>
        .
      </p>
    );
  }

  return (
    <div className="homepage__wrapper">
      <div className="bg__wrapper"></div>
      {renderConnectToWallet()}
      <div className="form__wrapper">
        <div className="exchange-form">
          <div className="form-title">Exchange Form</div>
          <div className="form-content">
            <div className="token-info__wrapper">
              <Row>
                <Col md={5}>
                  <p className="token-info--text">From</p>
                </Col>
                <Col md={7}>
                  <p className="token-info--text-right">
                    Balance: {tokenInOption?.balance || 0}
                  </p>
                </Col>
                <Col md={5}>
                  <InputGroup>
                    <FormControl
                      type="number"
                      className="token-amount"
                      min="0"
                      step="0.01"
                      value={tokenInAmount}
                      onChange={handleChangeTokenInAmount}
                    />
                  </InputGroup>
                </Col>
                <Col md={7}>
                  <Select
                    placeholder="Choose token"
                    value={tokenInOption}
                    options={tokenInOptionList}
                    onChange={handleSelectTokenIn}
                    className="token-type"
                    getOptionLabel={showOptionLabel}
                  />
                </Col>
              </Row>
            </div>
            <div className="token-info__wrapper">
              <Row>
                <Col md={5}>
                  <p className="token-info--text">To</p>
                </Col>
                <Col md={7}>
                  <p className="token-info--text-right">
                    Pool Balance: {tokenOutOption?.poolBalance || 0}
                  </p>
                </Col>
                <Col md={5}>
                  <div className="token-amount__wrapper">
                    <p className="token-amount--text">{tokenOutAmount}</p>
                  </div>
                </Col>
                <Col md={7}>
                  <Select
                    placeholder="Choose token"
                    value={tokenOutOption}
                    options={tokenOutOptionList}
                    onChange={handleSelectTokenOut}
                    className="token-type"
                    getOptionLabel={showOptionLabel}
                  />
                </Col>
              </Row>
            </div>
          </div>
          <div className="form-errors">
            {errorMessages.map((error, key) => (
              <p key={key}>{error}</p>
            ))}
          </div>
          <div className="form-submit">
            <Button className="btn btn-secondary" onClick={handleSwapToken}>
              Swap
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
