import { HardhatUserConfig } from "hardhat/config"
import "@nomicfoundation/hardhat-toolbox"
import "@chugsplash/plugins"

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
