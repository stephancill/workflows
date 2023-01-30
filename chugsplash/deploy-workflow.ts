import { UserChugSplashConfig } from "@chugsplash/core"
import { ethers } from "hardhat"

// Load workflow description json
import workflow from "../workflow/examples/img2img-nft.json"

const config: UserChugSplashConfig = {
  options: {
    projectName: "Workflow",
  },
  contracts: {
    WorkflowToken: {
      contract: "WorkflowToken",
      variables: {
        // ERC721A
        _name: "Workflow Genesis",
        _symbol: "WRKFLWGEN",
        _currentIndex: 0,
        _burnCounter: 0,
        _packedOwnerships: {},
        _packedAddressData: {},
        _tokenApprovals: {},
        _operatorApprovals: {},
        // Ownable
        _owner: "0x1111111111111111111111111111111111111111",
        // WorkflowToken
        workflow: {
          name: workflow.name,
          version: workflow.version,
        },
        outputs: workflow.outputs.map((output) => output.name),
        inputs: workflow.inputs.map((inputs) => inputs.name),
        steps: workflow.steps.map((step) => ({
          name: step.name,
          command: JSON.stringify(step.commands[0]),
          exports: step.exports[0],
          dockerfile: "",
        })),
        baseURI: `http://localhost:8000/eip155:1/`, // TODO: Environment variable and get chainId from provider
        price: ethers.utils.parseEther("0.01").toString(),
        maxSupply: 555,
      },
    },
  },
}

export default config
