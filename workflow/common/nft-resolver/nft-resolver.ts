import * as yargs from "yargs"
import { ethers } from "ethers"
import fetch from "node-fetch"
import sharp from "sharp"
import fs from "fs"
import path from "path"

async function fetchTokenMetadata(
  chainId: number,
  tokenAddress: string,
  tokenId: number,
  rpcUrl: string | undefined = undefined,
) {
  // TODO: Support multiple networks
  if (chainId !== 1 && !rpcUrl) {
    throw new Error("Unsupported chain ID")
  }

  // Connect to the Ethereum network
  const provider = new ethers.providers.StaticJsonRpcProvider(rpcUrl || "https://eth.llamarpc.com")

  // Define the ABI for the ERC-721 token contract
  const abi = [
    // ethers interface for tokenURI of ERC721
    "function tokenURI(uint256 tokenId) public view returns (string)",
  ]

  // Connect to the token contract
  const contract = new ethers.Contract(tokenAddress, abi, provider)

  // Call the tokenURI method
  const tokenURI = await contract.tokenURI(tokenId)

  let metadata: any
  // data URI
  if (tokenURI.startsWith("data:")) {
    const data = tokenURI.split(",")[1]
    const decoded = Buffer.from(data, "base64").toString("utf8")
    metadata = JSON.parse(decoded)
  } else if (tokenURI.startsWith("https://")) {
    // Fetch the token metadata
    metadata = await fetch(tokenURI).then((response) => response.json())
  } else if (tokenURI.startsWith("ipfs://")) {
    const ipfsURI = tokenURI.replace("ipfs://", "https://ipfs.io/ipfs/")
    metadata = await fetch(ipfsURI).then((response) => response.json())
  } else {
    throw new Error("Unsupported tokenURI")
  }

  // Return the metadata
  return metadata
}

async function downloadImageAndSave(url: string, directory: string, filename: string) {
  const mimetypeToFileExtension: { [key: string]: string } = {
    "image/png": "png",
    "image/jpeg": "jpg",
  }

  let mimetype: string
  let data: Buffer

  if (url.startsWith("https://")) {
    // Find mimetype from server
    const _mimetype = await fetch(url, { method: "HEAD" }).then((response) => response.headers.get("content-type"))
    if (!_mimetype) {
      throw new Error("Could not find mimetype")
    }
    mimetype = _mimetype

    // Download the image
    data = await fetch(url).then((response) => response.buffer())
  } else if (url.startsWith("ipfs://")) {
    const ipfsURI = url.replace("ipfs://", "https://ipfs.io/ipfs/")
    const _mimetype = await fetch(ipfsURI, { method: "HEAD" }).then((response) => response.headers.get("content-type"))
    if (!_mimetype) {
      throw new Error("Could not find mimetype")
    }
    mimetype = _mimetype

    // Download the image
    data = await fetch(ipfsURI).then((response) => response.buffer())
  } else if (url.startsWith("data:")) {
    // e.g. data:image/svg+xml;base64
    data = Buffer.from(url.split(",")[1], "base64")
    mimetype = url.split(",")[0].split(":")[1].split(";")[0]
  } else {
    throw new Error("Unsupported image URL")
  }

  if (mimetype === "image/svg+xml") {
    // Convert to png if svg
    data = await sharp(data).png().toBuffer()
    mimetype = "image/png"
  }

  const filePath = path.join(directory, `${filename}.${mimetypeToFileExtension[mimetype]}`)

  // Save image to disk
  fs.writeFileSync(filePath, data)

  return filePath
}

;(async () => {
  // Get the command line arguments
  const argv = yargs
    .options({
      chainId: {
        type: "number",
        demandOption: true,
        describe: "Chain ID",
      },
      tokenAddress: {
        type: "string",
        demandOption: true,
        describe: "Token Contract Address",
      },
      tokenId: {
        type: "number",
        demandOption: true,
        describe: "Token ID",
      },
      metadataOnly: {
        type: "boolean",
        default: false,
        describe: "Only fetch metadata",
      },
      rpcUrl: {
        type: "string",
        default: undefined,
        describe: "RPC URL",
      },
    })
    .help().argv

  const { chainId, tokenAddress, tokenId, metadataOnly, rpcUrl } = await argv

  // sha256 hash of inputs
  const hash = ethers.utils
    .solidityKeccak256(["uint256", "address", "uint256"], [chainId, tokenAddress, tokenId])
    .slice(2)

  const cache = path.join(process.cwd(), "cache")

  // Create cache directory if it doesn't exist
  if (!fs.existsSync(cache)) {
    fs.mkdirSync(cache)
  }

  let filePath: string

  // Check if any files matching patter {hash}.* exist
  if (fs.existsSync(cache) && fs.readdirSync(cache).some((file) => file.startsWith(hash))) {
    // Return filename of the first file matching the pattern
    const filename = fs.readdirSync(cache).find((file) => file.startsWith(hash))!
    filePath = path.join(cache, filename)
  } else {
    // Call the fetchTokenMetadata function
    const metadata = await fetchTokenMetadata(chainId, tokenAddress, tokenId, rpcUrl)

    if (metadataOnly) {
      // Log the metadata
      console.log(JSON.stringify(metadata))
      return
    }

    // Download the image and save to disk
    filePath = await downloadImageAndSave(metadata.image, cache, hash)
  }

  // Log the image URL
  console.log(filePath)
})()
