pragma solidity ^0.8.4;

contract Registry {
    
}

/*
    1. user creates recipe, can execute themselves
    2. user creates recipe, selects fee association
    3. user creates recipe entrance, and exit
    4. NFTs store the routes(or ipfs hash), and NFT stores the user who created, and fee associated for using
        - trim down NFTs completely:
        - transfer, approve, transferFrom
        - remove: burn, mint,
        - test to see if opensea uses `approve` or `setApprovalForAll`
        - store inside:
            - creator address
            - fee of usage
            - calls:
                - route OR
                - IPFS hash containing routes
*/