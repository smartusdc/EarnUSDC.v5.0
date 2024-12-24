// wallet/connector.js
import { showAlert } from '../ui/alerts.js';
import { showProcessModal, hideProcessModal } from '../ui/modals.js';
import { updateState } from '../core/store.js';
import { emit } from '../core/events.js';

// Connection state management
const CONNECTION_STATES = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ERROR: 'error'
};

let connectionState = CONNECTION_STATES.DISCONNECTED;
let connectionAttempts = 0;
const MAX_ATTEMPTS = 3;

/**
 * ウォレット接続の初期化
 * @returns {Promise<boolean>} Connection success
 */
export async function initializeWalletConnection() {
    if (connectionState === CONNECTION_STATES.CONNECTING) {
        showAlert('Connection already in progress...', 'info');
        return false;
    }

    try {
        connectionState = CONNECTION_STATES.CONNECTING;
        showProcessModal('Connecting Wallet', 'Please approve the connection request');

        if (!window.ethereum) {
            throw new Error('WALLET_NOT_FOUND');
        }

        const accounts = await requestAccounts();
        if (!accounts || accounts.length === 0) {
            throw new Error('NO_ACCOUNTS');
        }

        await ensureCorrectNetwork();
        await initializeWeb3(accounts[0]);

        connectionState = CONNECTION_STATES.CONNECTED;
        connectionAttempts = 0;
        emit('wallet:connected', { account: accounts[0] });
        
        return true;

    } catch (error) {
        handleConnectionError(error);
        return false;
    } finally {
        hideProcessModal();
    }
}

/**
 * アカウントへのアクセスをリクエスト
 * @returns {Promise<string[]>} Connected accounts
 */
async function requestAccounts() {
    try {
        return await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
    } catch (error) {
        if (error.code === 4001) {
            throw new Error('USER_REJECTED');
        }
        throw error;
    }
}

/**
 * ネットワークの確認と切り替え
 * @returns {Promise<void>}
 */
async function ensureCorrectNetwork() {
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    if (chainId !== CHAIN_CONFIG.chainId) {
        try {
            await ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CHAIN_CONFIG.chainId }]
            });
        } catch (error) {
            if (error.code === 4902) {
                await addBaseNetwork();
            } else {
                throw error;
            }
        }
    }
}

/**
 * Web3インスタンスの初期化
 * @param {string} account Connected account address
 * @returns {Promise<void>}
 */
async function initializeWeb3(account) {
    window.web3 = new Web3(window.ethereum);
    window.contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
    window.usdcContract = new web3.eth.Contract(USDC_ABI, USDC_ADDRESS);
    
    updateState({
        wallet: {
            address: account,
            isConnected: true
        }
    });
}

/**
 * Base Networkの追加
 * @returns {Promise<void>}
 */
async function addBaseNetwork() {
    try {
        await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [CHAIN_CONFIG]
        });
        emit('network:added', CHAIN_CONFIG);
    } catch (error) {
        console.error('Failed to add Base network:', error);
        throw new Error('NETWORK_ADD_FAILED');
    }
}

/**
 * 接続エラーの処理
 * @param {Error} error Connection error
 */
function handleConnectionError(error) {
    connectionState = CONNECTION_STATES.ERROR;
    
    const errorMessages = {
        'WALLET_NOT_FOUND': {
            message: 'Please install MetaMask to use this application',
            type: 'error'
        },
        'USER_REJECTED': {
            message: 'Connection request was rejected',
            type: 'warning'
        },
        'NO_ACCOUNTS': {
            message: 'No accounts found. Please check your wallet',
            type: 'error'
        },
        'NETWORK_ADD_FAILED': {
            message: 'Failed to add Base network. Please try manually',
            type: 'error'
        }
    };

    const errorConfig = errorMessages[error.message] || {
        message: 'Failed to connect wallet',
        type: 'error'
    };

    showAlert(errorConfig.message, errorConfig.type);
    emit('wallet:error', { error: error.message });

    // 再試行ロジック
    if (connectionAttempts < MAX_ATTEMPTS) {
        connectionAttempts++;
        setTimeout(initializeWalletConnection, 1000);
    }
}

/**
 * 接続状態の取得
 * @returns {string} Current connection state
 */
export function getConnectionState() {
    return connectionState;
}

/**
 * ウォレットの切断
 * @returns {void}
 */
export function disconnectWallet() {
    connectionState = CONNECTION_STATES.DISCONNECTED;
    updateState({
        wallet: {
            address: '',
            isConnected: false
        }
    });
    emit('wallet:disconnected');
}
