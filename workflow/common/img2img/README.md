# std:img2img

## Usage

This container exposes a function `img2img` which takes an input image and returns the path to the output image. It is implemented using the replicate.ai API. The API key is set using the `REPLICATE_API_KEY` environment variable in the .env file in the root `workflow` directory.

```bash
$ img2img --image-file=\"$INITIAL_IMAGE_FILE\" --prompt=\"$INPUT_PROMPT\" --seed=$INPUT_SEED
/app/cache/790f682fc46fd85032fc616aa75f8e09abfe01e0d3c6ca555f3d25c7790634af.png
```
