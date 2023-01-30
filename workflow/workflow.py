import json
import subprocess
import argparse
import sys
import random
import os

def run_workflow(workflow, variables_to_save, cache_dir):
    # Load environment variables from .env file into os.environ dictionary
    with open(".env") as f:
        for line in f:
            name, value = line.strip().split("=", 1)
            variables_to_save[name] = value

    # Iterate through the steps in the workflow
    for step in workflow["steps"]:
        # Check if the step is a built-in step or a custom step
        if step["name"].startswith("std:"):
            # Built-in step, use the provided image
            image = step["name"][4:]
            subprocess.run(["docker", "build", "-t", image, f"./common/{image}"])
        elif "docker_base" in step:
            # Custom step, use the provided base image
            image = step["docker_base"]
        elif "dockerfile" in step:
            # Custom step, build the image from the provided Dockerfile
            with open("Dockerfile", "w") as f:
                f.write(step["dockerfile"])
            subprocess.run(["docker", "build", "-t", step["name"], "."])
            image = step["name"]
        else:
            # Invalid step, skip
            continue

        # Track variables in "exports"
        for key in step["exports"]:
            if not key in variables_to_save:
                variables_to_save[key] = None

        # Generate 20 random characters for separator
        separator = "".join([f"{random.randrange(0, 10)}" for _ in range(50)])

        # Build commands list
        commands = ["docker", "run", "--rm", "-v", f"{cache_dir}:/app/cache"] # TODO: Separate cache per step
        for key, value in variables_to_save.items():
            if value:
                commands += ["-e"]
                commands += [f"{key}={value}"]
        
        commands += [image, "/bin/bash", "-c"]
        commands += [" && ".join(step["commands"] + [f"echo {separator}"] + [f"echo {x}=\"${x} {separator}\"" for x in variables_to_save])]

        print(f"Running step {step['name']}")
        print(f"Commands:", [x if len(x) < 1000 else x[:100] + "..." for x in commands])

        # Run the commands in the step's container
        result = subprocess.run(commands, capture_output=True, text=True)

        # Save environment variables
        env_lines = result.stdout.split(f"{separator}\n",1)[-1].replace("\n", "").split(f" {separator}") # type: ignore

        for line in env_lines:
            if not line:
                continue
            var, value = line.split("=", 1)
            if var in variables_to_save:
                variables_to_save[var] = value

        # Clean up
        # Remove Dockerfile if it was created
        if "dockerfile" in step:
            os.remove("Dockerfile")
        
        print(f"Step {step['name']} completed")

    # Extract variables to output into its own dict
    output_variables = {x["name"]: variables_to_save[x["name"]] for x in workflow["outputs"]}

    return output_variables

    
if __name__ == "__main__":
    CACHE_DIR = os.path.join(os.path.dirname(os.path.realpath(__file__)), "cache")

    raw_args = sys.argv[1:]

    # Load the workflow JSON if it is a file
    if os.path.isfile(raw_args[0]):
        # Load the workflow JSON
        with open(raw_args[0], "r") as f:
            workflow = json.load(f)
    else: # Otherwise, assume it is a JSON string
        workflow = json.loads(raw_args[0])

    parser = argparse.ArgumentParser()

    # Add arguments for each input
    for input in workflow["inputs"]:
        key, value = input.split("=", 1)
        parser.add_argument(f"--{key}", default=value)

    # Parse inputs
    variables_to_save = {x.split("=", 1)[0]: parser.parse_args(raw_args[1:]).__getattribute__(x.split("=", 1)[0]) for x in workflow["inputs"]}

    outputs = run_workflow(workflow, variables_to_save, CACHE_DIR)
    # Print keys in "outputs"
    for key, value in outputs.items():
        print(f"{key}=\"{value}\"")
