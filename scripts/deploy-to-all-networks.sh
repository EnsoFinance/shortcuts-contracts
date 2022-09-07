#!/bin/bash
set -o allexport
source .env

yarn deploy polygon

yarn deploy arbitrum

yarn deploy mainnet