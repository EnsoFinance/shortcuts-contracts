#!/bin/bash
set -o allexport
source ../.env

proxy=0x7fEA6786D291A87fC4C98aFCCc5A5d3cFC36bc7b
implementation=0x66fc62c1748e45435b06cf8dd105b73e9855f93e

verify() {
    yarn hardhat --network $1 verify --contract contracts/proxy/UpgradeableProxy.sol:UpgradeableProxy $proxy $implementation
}

echo "Verify on all Blockscan networks" \
    && verify polygon \
    && verify arbitrum \
    && verify optimism \
    && verify bsc \
    && verify gnosis \
    && verify avalanche \
    && verify fantom \
    && verify aurora \
    && verify mainnet