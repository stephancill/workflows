FROM python:3.9-alpine

RUN apk add --no-cache bash

WORKDIR /app

RUN pip install requests

VOLUME /app/cache

COPY img2img.py /app/img2img.py

RUN ln -s /app/img2img.py /usr/local/bin/img2img

RUN chmod +x /usr/local/bin/img2img
