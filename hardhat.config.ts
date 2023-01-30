import { HardhatUserConfig, task } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@chugsplash/plugins"

// Task that mints a token
task("mint", "Mints 10 tokens", async (args: { address: string }, hre) => {
  const { address } = args
  const [signer] = await hre.ethers.getSigners()
  const { ethers } = hre
  const WorkflowToken = await ethers.getContractAt("WorkflowToken", address)
  await WorkflowToken.connect(signer).mint(1, { value: ethers.utils.parseEther("1") })
}).addParam("address", "Token address")

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.17", // Solidity compiler version (e.g. 0.8.15)
        settings: {
          outputSelection: {
            "*": {
              "*": ["storageLayout"],
            },
          },
        },
      },
      // Other compiler config objects go here (optional)
    ],
  },
  typechain: {
    outDir: "types",
  },
}

export default config
