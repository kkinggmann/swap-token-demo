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

const HARDHAT_NETWORK_ID = "31337";

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

  const tokenPool = getTokenPool("0x1291Be112d480055DaFd8a610b7d1e203891C274");

  const getERC20TokenInfo = useCallback(
    async (tokenAddress, userAddress) => {
      const token = getERC20Token(tokenAddress);
      const value = await token.symbol();
      const balance = await token.balanceOf(userAddress);
      const decimal = await token.decimals();
      const address = token.address;
      return {value, address, balance: (balance / 10 ** decimal).toString()};
    },
    [getERC20Token]
  );

  useEffect(() => {
    const inititalTokenList = async (userAddress) => {
      const tokenA = await getERC20TokenInfo(
        "0x809d550fca64d94Bd9F66E60752A544199cfAC3D",
        userAddress
      );
      const tokenB = await getERC20TokenInfo(
        "0x4c5859f0F772848b2D91F1D83E2Fe57935348029",
        userAddress
      );
      const nativeToken = {
        value: "ETH",
        address: "0x0000000000000000000000000000000000000000",
        balance: ((await provider.getBalance(userAddress)) / 1e18).toString(),
      };

      dispatch(addTokenToList(tokenA));
      dispatch(addTokenToList(tokenB));
      dispatch(addTokenToList(nativeToken));
    };

    if (selectedAddress) {
      inititalTokenList(selectedAddress);
    }
  }, [dispatch, getERC20TokenInfo, provider, selectedAddress]);

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
    }
  };

  const handleChangeTokenInAmount = (e) => {
    if (tokenInOption) {
      const tokenInAmount = e.target.value;
      setTokenInAmount(tokenInAmount);
      handleSetTokenOutAmount(tokenInAmount, tokenRate);
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
                <Col md={7}></Col>
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
          <div className="form-submit">
            <Button className="btn btn-secondary">Swap</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
