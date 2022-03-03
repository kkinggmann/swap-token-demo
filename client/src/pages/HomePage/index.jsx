import React, {useState} from "react";
import "./styles.scss";
import {Row, Button, Col, InputGroup, FormControl} from "react-bootstrap";
import Select from "react-select";
import {FaEthereum} from "react-icons/fa";
import {GiToken} from "react-icons/gi";

const data = [
  {
    value: 1,
    text: "ETH",
    icon: <FaEthereum />,
  },
  {
    value: 2,
    text: "TOKA",
    icon: <GiToken />,
  },
  {
    value: 3,
    text: "TOKB",
    icon: <GiToken />,
  },
];

function HomePage() {
  const [selectedOption, setSelectedOption] = useState(data[0]);

  const handleChange = (e) => {
    setSelectedOption(e);
  };

  const showOptionLabel = (e) => {
    return (
      <div className="token-option-label">
        {e.icon}
        <span>{e.text}</span>
      </div>
    );
  };

  const renderConnectToWallet = () => {
    return (
      <div className="header__wrapper">
        {2 === 1 ? (
          <Button className="btn btn-secondary button-connect">
            Connect to Wallet
          </Button>
        ) : (
          <div className="header-content">
            <p className="user-address">0x12a2325D7301eB809b3c5C81fF01139e73EC3E85</p>
            <Button className="btn btn-secondary button-logout">Log out</Button>
          </div>
        )}
      </div>
    );
  };

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
                    Balance: {`${2.16919}`}
                  </p>
                </Col>
                <Col md={5}>
                  <InputGroup>
                    <FormControl
                      type="number"
                      className="token-amount"
                      min="0"
                    />
                  </InputGroup>
                </Col>
                <Col md={7}>
                  <Select
                    placeholder="Select Option"
                    value={selectedOption}
                    options={data}
                    onChange={handleChange}
                    className="token-type"
                    getOptionLabel={showOptionLabel}
                  />
                </Col>
              </Row>
            </div>
            <div className="token-info__wrapper">
              <Row>
                <Col md={5}>
                  <p className="token-info--text">From</p>
                </Col>
                <Col md={7}>
                  <p className="token-info--text-right">
                    Balance: {`${2.16919}`}
                  </p>
                </Col>
                <Col md={5}>
                  <InputGroup>
                    <FormControl
                      type="number"
                      className="token-amount"
                      min="0"
                    />
                  </InputGroup>
                </Col>
                <Col md={7}>
                  <Select
                    value={selectedOption}
                    options={data}
                    onChange={handleChange}
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
