from flask import Flask, jsonify, send_file
from . import workflow as workflow_module
import json
import os

app = Flask(__name__)

CACHE_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "cache")

@app.route('/eip155:<chainId>/erc721:<address>/<tokenId>', methods=['GET'])
def erc721_token(chainId, address, tokenId):
    # Create workflow to get token metadata using std:nft-resolver
    # TODO: Only include rpc url if running locally
    workflow = {
        "name": "img2img-nft",
        "version": "1.0.0",
        "outputs": [{ "name": "METADATA_JSON", "type": "string" }],
        "steps": [
            {
            "name": "std:nft-resolver",
            "commands": [
                "export METADATA_JSON=\"$(node nft-resolver.js --chainId=$CHAIN_ID --tokenAddress=$ADDRESS --tokenId=$TOKEN_ID --metadataOnly --rpcUrl=http://host.docker.internal:8545)\""
            ],
            "exports": ["METADATA_JSON"]
            },
        ]
    }

    # Run the workflow
    outputs = workflow_module.run_workflow(workflow, {
        "CHAIN_ID": chainId,
        "ADDRESS": address,
        "TOKEN_ID": tokenId
    }, cache_dir=CACHE_DIR)

    # Parse the metadata JSON
    workflow = json.loads(outputs["METADATA_JSON"])["workflow"]

    workflow_inputs = {x.split("=", 1)[0]:x.split("=", 1)[1]  for x in workflow["inputs"]}

    # Populate environment variables for the workflow
    variables_to_save = {
        "CHAIN_ID": chainId,
        "ADDRESS": address,
        "TOKEN_ID": tokenId,
        **workflow_inputs
    }

    # Run the workflow
    outputs = workflow_module.run_workflow(workflow, variables_to_save, cache_dir=CACHE_DIR)

    # Extract the output file
    image_file = outputs[workflow["outputs"][0]["name"]]

    # Look it up in the cache
    container_cache = "/app/cache/"
    if image_file.startswith(container_cache):
        image_file = os.path.join(CACHE_DIR, image_file[len(container_cache):])

    # Return the image
    return send_file(image_file)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
