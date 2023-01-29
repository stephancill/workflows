# Workflow Token

Workflow languages can be used to describe operations to be executed on an input. Workflow Token uses the ERC-721 token standard to tokenize workflows which produce images.

## How it works

- Token metadata encodes the workflow description
- Token metadata defines the input parameters
- `baseURI` defines the location of the server to execute the workflow
- `tokenURI` calls the server to execute the workflow by pointing to the token itself
  - e.g. `https://workflow-token.com/eip155:1/erc721:0x9d27527Ada2CF29fBDAB2973cfa243845a08Bd3F/2`
- When called, the server will resolve the token metadata, decode the workflow, and execute it.
- The server will return the output of the workflow as a JSON object adhering to the ERC-721 metadata standard.

## Workflow definition

Workflows consist of steps. Each step defines commands which mutate the environment (persisted between steps) are executed. The environment in which the commands are executed is defined using a Dockerfile. Some common steps are built in and their names are prefixed with `std:`. Common steps are defined in the `common` directory and can be called by name. Hosts can choose to change the implementation as long as it adheres to the predefined interface. Custom packages can be defined in the workflow metadata by either specifying a `docker_base` or a `dockerfile`. `docker_base` will execute the commands in the base image described by the string, while `dockerfile` will build a new image from the provided Dockerfile string.

An example workflow is described below. It takes an input message and append message. It encodes the input message, decodes it, and appends the append message. See the `workflow/examples` directory for more examples.

```json
{
  "name": "echo-workflow",
  "version": "1.0.0",
  "inputs": [
    {
      "name": "INPUT_MESSAGE",
      "type": "string"
    },
    {
      "name": "APPEND_MESSAGE",
      "type": "string"
    }
  ],
  "outputs": [
    {
      "name": "OUTPUT_MESSAGE",
      "type": "string"
    }
  ],
  "packages": [
    {
      "name": "encode-message",
      "dockerfile": "FROM alpine:latest\nRUN apk add --no-cache bash",
      "commands": ["export MESSAGE_BASE64=$(echo $INPUT_MESSAGE | base64)"],
      "exports": ["MESSAGE_BASE64"]
    },
    {
      "name": "decode-and-append-message",
      "dockerfile": "FROM alpine:latest\nRUN apk add --no-cache bash",
      "commands": ["export OUTPUT_MESSAGE=\"$(echo $MESSAGE_BASE64 | base64 -d) $APPEND_MESSAGE\""],
      "exports": ["OUTPUT_MESSAGE"]
    }
  ]
}
```

## Example workflow execution

Copy sample.env to .env and fill in the REPLICATE_API_KEY.

```bash
cp sample.env .env
```

```bash
cd workflow
```

```bash
python3 workflow.py examples/img2img-nft.json --CHAIN_ID=1 --ADDRESS=0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03 --TOKEN_ID=1 --INPUT_PROMPT="3d cartoon character" --INPUT_SEED=4
```
