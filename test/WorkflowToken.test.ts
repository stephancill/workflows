import "@chugsplash/plugins"
import { chugsplash, ethers } from "hardhat"
import { expect } from "chai"
import { WorkflowToken } from "../types"

import sampleWorkflow from "../workflow/examples/img2img-nft.json"

describe("WorkflowToken", () => {
  let WorkflowToken: WorkflowToken
  beforeEach(async () => {
    // You must reset your ChugSplash deployments to their initial state here
    await chugsplash.reset()

    WorkflowToken = (await chugsplash.getContract("WorkflowToken")) as WorkflowToken
  })

  it("initializes correctly", async () => {
    expect(await WorkflowToken.name()).is.not.empty
    expect(await WorkflowToken.symbol()).is.not.empty
    expect(await WorkflowToken.totalSupply()).equals(0)
    const workflow = await WorkflowToken.workflow()
    expect(workflow.name).equals(sampleWorkflow.name)
    expect(workflow.version).equals(sampleWorkflow.version)
  })

  it("produces the correct tokenURI", async () => {
    // Mint token
    await WorkflowToken.mint(1, { value: ethers.utils.parseEther("0.01") })

    const tokenURI = await WorkflowToken.tokenURI(0)
    console.log(tokenURI)

    // Decode base64 encoded data uri
    const data = tokenURI.split(",")[1]
    const decoded = Buffer.from(data, "base64").toString("utf-8")
    console.log(decoded)
    const json = JSON.parse(decoded)
    console.log(json)
  })
})
