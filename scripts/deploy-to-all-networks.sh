#!/bin/bash
set -o allexport
source .env

echo "Deploy to all networks" \
    && yarn deploy polygon \
    && yarn deploy arbitrum \
    && yarn deploy optimism \
    && yarn deploy bsc \
    && yarn deploy gnosis \
    && yarn deploy avalanche \
    && yarn deploy fantom \
    && yarn deploy aurora
    && yarn deploy mainnet