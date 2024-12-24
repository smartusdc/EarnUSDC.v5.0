// wallet/connector.js
import { emit } from '../core/events.js';
import { updateState } from '../core/store.js';
import { showAlert } from '../ui/alerts.js';
import { showModal, closeModal } from '../ui/modals.js';
import { CONTRACT_ABI, USDC_ABI } from '../config/contracts.js';

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
let currentModalId = null;

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
        currentModalId = showModal({
            type: 'process',
            closable: false,
            title: 'Connecting Wallet',
            content: `
                <div class="text-center">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p class="mt-2 text-sm text-gray-500">Please approve the connection request in your wallet</p>
                </div>
            `
        });

        // Check for wallet presence
        if (!window.ethereum) {
            throw new Error('WALLET_NOT_FOUND');
        }

        // Request accounts
        const accounts = await requestAccounts();
        if (!accounts || accounts.length === 0) {
            throw new Error('NO_ACCOUNTS');
        }

        // Check and switch network if needed
        await ensureCorrectNetwork();
        
        // Initialize Web3 and contracts
        await initializeWeb3(accounts[0]);

        connectionState = CONNECTION_STATES.CONNECTED;
        connectionAttempts = 0;
        emit('wallet:connected', { account: accounts[0] });
        showAlert('Wallet connected successfully', 'success');
        
        return true;

    } catch (error) {
        const handledError = handleConnectionError(error);
        throw handledError;

    } finally {
        if (currentModalId) {
            closeModal(currentModalId);
            currentModalId = null;
        }
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
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (chainId !== window.CHAIN_CONFIG.chainId) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: window.CHAIN_CONFIG.chainId }]
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
    window.contract = new web3.eth.Contract(CONTRACT_ABI, window.CONTRACT_ADDRESS);
    window.usdcContract = new web3.eth.Contract(USDC_ABI, window.USDC_ADDRESS);
    
    updateState({
        wallet: {
            address: account,
            isConnected: true,
            chainId: await window.ethereum.request({ method: 'eth_chainId' })
        }
    });
}

/**
 * Base Networkの追加
 * @returns {Promise<void>}
 */
async function addBaseNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [window.CHAIN_CONFIG]
        });
        emit('network:added', window.CHAIN_CONFIG);
    } catch (error) {
        console.error('Failed to add Base network:', error);
        throw new Error('NETWORK_ADD_FAILED');
    }
}

/**
 * 接続エラーの処理
 * @param {Error} error Connection error
 * @returns {Error} Handled error with user-friendly message
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

    // Handle retry logic
    if (connectionAttempts < MAX_ATTEMPTS && error.message !== 'USER_REJECTED') {
        connectionAttempts++;
        return new Error(errorConfig.message + ' Retrying...');
    }

    return new Error(errorConfig.message);
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
 */
export function disconnectWallet() {
    connectionState = CONNECTION_STATES.DISCONNECTED;
    updateState({
        wallet: {
            address: '',
            isConnected: false,
            chainId: null
        }
    });
    emit('wallet:disconnected');
    showAlert('Wallet disconnected', 'info');
}
