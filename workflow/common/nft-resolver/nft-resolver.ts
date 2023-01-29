import * as yargs from "yargs"
import { ethers } from "ethers"
import fetch from "node-fetch"
import sharp from "sharp"

async function fetchTokenMetadata(chainId: number, tokenAddress: string, tokenId: number) {
  // TODO: Support multiple networks
  if (chainId !== 1) {
    throw new Error("Unsupported chain ID")
  }

  // Connect to the Ethereum network
  const provider = new ethers.providers.StaticJsonRpcProvider("https://eth.llamarpc.com")

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

  const dataURI = await downloadImageAndConvertToDataURI(metadata.image)

  // Return the image URL
  return dataURI
}

async function downloadImageAndConvertToDataURI(url: string) {
  let dataUri: string

  if (url.startsWith("https://")) {
    // Find mimetype from server
    const mimetype = await fetch(url, { method: "HEAD" }).then((response) => response.headers.get("content-type"))

    // Download the image
    const image = fetch(url).then((response) => response.buffer())

    // Convert the image to a base64 encoded
    const data = await image.then((image) => image.toString("base64"))

    dataUri = `data:${mimetype};base64,${data}`
  } else if (url.startsWith("ipfs://")) {
    const ipfsURI = url.replace("ipfs://", "https://ipfs.io/ipfs/")
    const mimetype = await fetch(ipfsURI, { method: "HEAD" }).then((response) => response.headers.get("content-type"))

    // Download the image
    const image = fetch(ipfsURI).then((response) => response.buffer())

    // Convert the image to a base64 encoded
    const data = await image.then((image) => image.toString("base64"))

    dataUri = `data:${mimetype};base64,${data}`
  } else if (url.startsWith("data:")) {
    // Convert svg to png
    const data = url.split(",")[1]
    const decoded = Buffer.from(data, "base64").toString("utf8")
    const mimetype = url.split(",")[0].split(":")[1].split(";")[0]

    if (mimetype === "image/svg+xml") {
      const image = await sharp(Buffer.from(decoded, "utf8")).png().toBuffer()
      const data = image.toString("base64")

      dataUri = `data:image/png;base64,${data}`
    } else {
      throw new Error("Unsupported mimetype")
    }
  } else {
    throw new Error("Unsupported image URL")
  }

  return dataUri
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
    })
    .help().argv

  const { chainId, tokenAddress, tokenId } = await argv

  // Call the fetchTokenMetadata function
  const imageURL = await fetchTokenMetadata(chainId, tokenAddress, tokenId)

  // Log the image URL
  console.log(imageURL)
})()
