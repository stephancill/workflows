#!/usr/bin/env python3

from urllib.request import Request, urlopen
import os
import json
import time
import argparse
import hashlib
import requests
import base64

parser = argparse.ArgumentParser()
parser.add_argument("--image", help="data uri of image to run the prediction on")
parser.add_argument("--image-file", help="location of image to run the prediction on")
parser.add_argument("--prompt", help="prompt for the prediction", required=True)
parser.add_argument("--negative_prompt", help="negative prompt for the prediction", default="")
parser.add_argument("--width", help="width of the image", type=int, default=512)
parser.add_argument("--height", help="height of the image", type=int, default=512)
parser.add_argument("--prompt_strength", help="prompt strength for the prediction", type=float, default=0.8)
parser.add_argument("--num_outputs", help="number of outputs for the prediction", type=int, default=1)
parser.add_argument("--num_inference_steps", help="number of inference steps for the prediction", type=int, default=75)
parser.add_argument("--guidance_scale", help="guidance scale for the prediction", type=float, default=7.5)
parser.add_argument("--scheduler", help="scheduler for the prediction", default="DPMSolverMultistep")
parser.add_argument("--seed", help="seed for the prediction", type=int, default=0)
args = parser.parse_args()

def main():
    if not args.image and not args.image_file:
        raise Exception("You must provide either an image or an image file")

    image = None

    if args.image_file:
        if args.image_file.endswith(".png"):
            content_type = "image/png"
        elif args.image_file.endswith(".jpg") or args.image_file.endswith(".jpeg"):
            content_type = "image/jpeg"
        else:
            raise Exception("Image file must be a png or jpg")
        
        with open(args.image_file, "rb") as f:
            data = f.read()
            # Base64 encode the image
            image = f"data:{content_type};base64,{base64.b64encode(data).decode('utf-8')}"
    else:
        image = args.image
    
    input_str = f"{image}{args.prompt}{args.negative_prompt}{args.width}{args.height}{args.prompt_strength}{args.num_outputs}{args.num_inference_steps}{args.guidance_scale}{args.scheduler}{args.seed}"
    input_hash = hashlib.sha256(input_str.encode()).hexdigest()

    filename = os.path.join(os.getcwd(), "cache", f"{input_hash}.png")

    # Ensure cache directory exists
    if not os.path.exists("cache"):
        os.mkdir("cache")

    # If the file already exists, return it
    if os.path.exists(filename):
        print(f"{filename}")
        return
    
    api_url = "https://api.replicate.com/v1/predictions"
    headers = {
        "Authorization": f"Token {os.environ['REPLICATE_API_TOKEN']}",
        "Content-Type": "application/json"
    }
    data = {
        "version": "15a3689ee13b0d2616e98820eca31d4c3abcd36672df6afce5cb6feb1d66087d",
        "input": {
            "image": image,
            "prompt": args.prompt,
            "negative_prompt": args.negative_prompt,
            "width": args.width,
            "height": args.height,
            "prompt_strength": args.prompt_strength,
            "num_outputs": args.num_outputs,
            "num_inference_steps": args.num_inference_steps,
            "guidance_scale": args.guidance_scale,
            "scheduler": args.scheduler,
            "seed": args.seed
        }
    }

    response = requests.post(api_url, data=json.dumps(data).encode(), headers=headers)
    response_data = response.json()

    prediction_id = response_data["id"]

    while True:
        poll_url = f"https://api.replicate.com/v1/predictions/{prediction_id}"
        # req = Request(poll_url, headers=headers)
        # poll_response = urlopen(req)
        # poll_response_data = json.loads(poll_response.read())

        poll_response = requests.get(poll_url, headers=headers)
        poll_response_data = poll_response.json()

        status = poll_response_data["status"]

        # print(f"Poll response data: {poll_response_data}")
        # print(f"Prediction status: {status}")

        if status == "succeeded":
            image_urls = poll_response_data["output"]
            url = image_urls[0]
            req = Request(url, headers=headers)
            response = urlopen(req)
            with open(filename, "wb") as file:
                file.write(response.read())
                print(f"{filename}")
            return
        elif status == "failed" or status == "canceled":
            print("failed")
            return
        
        time.sleep(5)


if __name__ == "__main__":
    main()