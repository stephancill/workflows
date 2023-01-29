# Use an existing image with Node.js and TypeScript installed as the base image
FROM node:14-alpine

RUN apk add --no-cache bash

VOLUME /app/cache

# Set the working directory
WORKDIR /app

# Copy the script, yarn.lock, package.json, tsconfig.json to the working directory
COPY nft-resolver.ts yarn.lock package.json tsconfig.json /app/

# Install the required packages
RUN yarn install --frozen-lockfile

# Compile the TypeScript script
RUN yarn tsc 


RUN mv /app/nft-resolver.js /app/nft-resolver.js.tmp
RUN echo '#!/usr/local/bin/node\n' > /app/nft-resolver.js
RUN cat /app/nft-resolver.js.tmp >> /app/nft-resolver.js
RUN rm /app/nft-resolver.js.tmp

RUN ln -s /app/nft-resolver.js /usr/local/bin/resolve-nft
RUN chmod +x /usr/local/bin/resolve-nft