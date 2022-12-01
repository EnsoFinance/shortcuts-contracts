#!/bin/bash
set -o allexport
source .env

yarn fork:deploy polygon

yarn fork:deploy arbitrum

yarn fork:deploy mainnet