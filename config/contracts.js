// config/contracts.js

export const CONTRACT_ABI = [
    // USDC承認
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // 残高確認
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // デポジット
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "referralCode",
                "type": "uint256"
            }
        ],
        "name": "depositFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // 引き出し
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // 報酬請求
    {
        "inputs": [],
        "name": "claimDepositReward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // リファラル報酬請求
    {
        "inputs": [],
        "name": "claimReferralReward",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // リファラルコード生成
    {
        "inputs": [],
        "name": "generateReferralCode",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    // ユーザーランク情報取得
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getUserRank",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "rankId",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "rankName",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "bonusRate",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "nextRankThreshold",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "progressToNextRank",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    // 報酬計算
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "userAddress",
                "type": "address"
            }
        ],
        "name": "calculateReward",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

export const USDC_ABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
