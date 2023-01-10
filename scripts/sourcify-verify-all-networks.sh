#!/bin/bash
set -o allexport
source .env

yarn hardhat sourcify --network polygon

yarn hardhat sourcify --network arbitrum 

yarn hardhat sourcify --network mainnet 