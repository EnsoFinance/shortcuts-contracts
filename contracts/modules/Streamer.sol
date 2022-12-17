// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "../interfaces/IModuleManager.sol";

contract Streamer {

    struct StreamInfo {
        uint256 amountPerSec;
        uint256 endTime;
        uint256 lastTimestamp;
    }

    mapping(address => mapping(address => StreamInfo)) public streams;

    event Stream(address indexed sender, address indexed receiver, uint256 amount, uint256 timeRange);

    error StreamFailed();
    error InvalidTimes();
    
    function addStream(
        address receiver,
        uint256 amountPerSec,
        uint256 startTime,
        uint256 endTime
    ) external {
        if (startTime > endTime) revert InvalidTimes();
        StreamInfo storage streamInfo = streams[msg.sender][receiver];
        if (
            streamInfo.lastTimestamp != 0 && 
            streamInfo.lastTimestamp < block.timestamp &&
            streamInfo.lastTimestamp < streamInfo.endTime
        ) {
            // Stream funds up to now
            _stream(msg.sender, receiver, streamInfo);
        }
        streamInfo.amountPerSec = amountPerSec;
        streamInfo.lastTimestamp = startTime > 0 ? startTime : block.timestamp;
        streamInfo.endTime = endTime;
    }

    function stream(address sender) external {
        StreamInfo storage streamInfo = streams[sender][msg.sender];
        _stream(sender, msg.sender, streamInfo);
    }

    function _stream(
        address sender,
        address receiver,
        StreamInfo storage streamInfo
    ) internal {
        bool streamEnd = block.timestamp > streamInfo.endTime;
        uint256 timestamp = streamEnd ? streamInfo.endTime : block.timestamp;
        uint256 timeRange = timestamp - streamInfo.lastTimestamp;
        uint256 amount = streamInfo.amountPerSec * timeRange;
        if (streamEnd) {
            delete streamInfo.amountPerSec;
            delete streamInfo.lastTimestamp;
            delete streamInfo.endTime;
        } else {
            streamInfo.lastTimestamp = timestamp;
        }
        bool success = IModuleManager(sender).execTransactionFromModule(
            receiver,
            amount,
            new bytes(0),
            IModuleManager.Operation.Call
        );
        if (!success) revert StreamFailed();
        emit Stream(sender, receiver, amount, timeRange);
    }
}