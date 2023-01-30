// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";
import "svgnft/contracts/Base64.sol";

// import "hardhat/console.sol";

contract WorkflowToken is ERC721A, Ownable {
  struct Step {
    string name;
    string dockerfile;
    string command;
    string exports;
  }

  struct Workflow {
    string name;
    string version;
  }

  Workflow public workflow;
  Step[] public steps;
  string[] inputs;
  string[] outputs;

  string public baseURI;

  uint256 public price;
  uint256 public maxSupply;
  uint256 public constant maxMintPerWallet = 5;

  constructor() ERC721A("", "") {}

  function tokenURI(uint256 _tokenId) public view override returns (string memory) {
    string memory workflowJson = "{";
    workflowJson = string.concat(workflowJson, '"name":"', workflow.name, '",');
    workflowJson = string.concat(workflowJson, '"version":"', workflow.version, '",');
    workflowJson = string.concat(workflowJson, '"inputs":[');
    for (uint256 i = 0; i < inputs.length; i++) {
      workflowJson = string.concat(workflowJson, '"', inputs[i], '"');
      if (i != inputs.length - 1) {
        workflowJson = string.concat(workflowJson, ",");
      }
    }
    workflowJson = string.concat(workflowJson, "],");
    workflowJson = string.concat(workflowJson, '"outputs":[');
    for (uint256 i = 0; i < outputs.length; i++) {
      workflowJson = string.concat(workflowJson, '{"name":"', outputs[i], '"}');
      if (i != outputs.length - 1) {
        workflowJson = string.concat(workflowJson, ",");
      }
    }
    workflowJson = string.concat(workflowJson, "],");
    workflowJson = string.concat(workflowJson, '"steps":[');
    for (uint256 i = 0; i < steps.length; i++) {
      workflowJson = string.concat(workflowJson, '{"name":"', steps[i].name, '",');
      workflowJson = string.concat(workflowJson, '"commands":[');
      workflowJson = string.concat(workflowJson, steps[i].command);
      workflowJson = string.concat(workflowJson, '],"exports":["');
      workflowJson = string.concat(workflowJson, steps[i].exports);
      workflowJson = string.concat(workflowJson, '"]}');
      if (i != steps.length - 1) {
        workflowJson = string.concat(workflowJson, ",");
      }
    }
    workflowJson = string.concat(workflowJson, "]}");

    string memory json = string.concat(
      '{"name":"',
      name(),
      '","description":"Workflow is on chain but executed off-chain.",',
      '"workflow":',
      workflowJson,
      ', "image": "',
      string.concat(baseURI, "erc721:0x", toAsciiString(address(this)), "/", _toString(_tokenId)),
      '"}'
    );
    return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
  }

  function setBaseURI(string memory _uri) public onlyOwner {
    baseURI = _uri;
  }

  function mint(uint256 _quantity) external payable {
    require(msg.value >= price * _quantity, "Insufficient fee");
    require(totalSupply() + _quantity <= maxSupply, "Exceeds max supply");
    require(_numberMinted(msg.sender) + _quantity <= 20, "Exceeds max quantity");
    _mint(msg.sender, _quantity);

    // Refund any extra ETH sent
    if (msg.value > price * _quantity) {
      (bool status, ) = payable(msg.sender).call{value: msg.value - price * _quantity}("");
      require(status, "Refund failed");
    }
  }

  /**
   * @notice Sets the price of each token in wei.
   * @param _price Price of each token in wei.
   */
  function setPrice(uint256 _price) external onlyOwner {
    price = _price;
  }

  // Utils

  function toAsciiString(address x) internal pure returns (string memory) {
    bytes memory s = new bytes(40);
    for (uint256 i = 0; i < 20; i++) {
      bytes1 b = bytes1(uint8(uint256(uint160(x)) / (2**(8 * (19 - i)))));
      bytes1 hi = bytes1(uint8(b) / 16);
      bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
      s[2 * i] = char(hi);
      s[2 * i + 1] = char(lo);
    }
    return string(s);
  }

  function char(bytes1 b) internal pure returns (bytes1 c) {
    if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
    else return bytes1(uint8(b) + 0x57);
  }
}
