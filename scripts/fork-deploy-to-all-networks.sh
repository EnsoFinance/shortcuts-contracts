#!/bin/bash
set -o allexport
source .env

echo "Test deployment to all networks on their forks"
    && yarn fork:deploy polygon \
    && yarn fork:deploy arbitrum \
    && yarn fork:deploy mainnet