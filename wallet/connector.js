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
let connectTimeout = null;
const CONNECT_TIMEOUT_MS = 30000; // 30 seconds timeout

/**
 * ウォレット接続の初期化
 * @returns {Promise<boolean>} Connection success
 */
export async function initializeWalletConnection() {
    if (connectionState === CONNECTION_STATES.CONNECTING) {
        showAlert('Connection already in progress...', 'info');
        return false;
    }

    // Clear any existing timeout
    if (connectTimeout) {
        clearTimeout(connectTimeout);
    }

    try {
        connectionState = CONNECTION_STATES.CONNECTING;
        currentModalId = showModal({
            title: 'Connecting Wallet',
            content: `
                <div class="text-center">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p class="mt-4 text-sm text-gray-500">Connecting to your wallet...</p>
                </div>
            `,
            closable: false
        });

        // Set connection timeout
        connectTimeout = setTimeout(() => {
            if (connectionState === CONNECTION_STATES.CONNECTING) {
                throw new Error('CONNECTION_TIMEOUT');
            }
        }, CONNECT_TIMEOUT_MS);

        // Check for wallet presence
        if (!window.ethereum) {
            throw new Error('WALLET_NOT_FOUND');
        }

        // Request accounts first
        const accounts = await requestAccounts();
        if (!accounts || accounts.length === 0) {
            throw new Error('NO_ACCOUNTS');
        }

        // Check and switch network if needed
        await ensureCorrectNetwork();
        
        // Initialize Web3 and contracts
        if (!await initializeWeb3(accounts[0])) {
            throw new Error('WEB3_INIT_FAILED');
        }

        // Clear timeout as connection was successful
        clearTimeout(connectTimeout);
        connectTimeout = null;

        // Update connection state
        connectionState = CONNECTION_STATES.CONNECTED;
        connectionAttempts = 0;

        // Emit success event and show notification
        emit('wallet:connected', { account: accounts[0] });
        showAlert('Wallet connected successfully', 'success');
        
        return true;

    } catch (error) {
        // Clear timeout if exists
        if (connectTimeout) {
            clearTimeout(connectTimeout);
            connectTimeout = null;
        }

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
 * Web3インスタンスの初期化
 * @param {string} account Connected account address
 * @returns {Promise<boolean>} Initialization success
 */
async function initializeWeb3(account) {
    try {
        // Ensure Web3 is available globally
        if (typeof window.Web3 === 'undefined') {
            console.error('Web3 is not loaded');
            return false;
        }

        // Initialize Web3 with the current provider
        window.web3 = new window.Web3(window.ethereum);
        
        if (!window.web3 || !window.web3.eth) {
            console.error('Failed to initialize Web3 instance');
            return false;
        }

        // Initialize contracts
        try {
            window.contract = new window.web3.eth.Contract(
                CONTRACT_ABI,
                window.CONTRACT_ADDRESS
            );

            window.usdcContract = new window.web3.eth.Contract(
                USDC_ABI,
                window.USDC_ADDRESS
            );
        } catch (contractError) {
            console.error('Contract initialization error:', contractError);
            return false;
        }

        // Update application state
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        updateState({
            wallet: {
                address: account,
                isConnected: true,
                chainId: chainId
            }
        });

        return true;
    } catch (error) {
        console.error('Web3 initialization error:', error);
        return false;
    }
}

/**
 * アカウントへのアクセスをリクエスト
 * @returns {Promise<string[]>} Connected accounts
 */
async function requestAccounts() {
    try {
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        if (!accounts || accounts.length === 0) {
            throw new Error('NO_ACCOUNTS');
        }
        
        return accounts;
    } catch (error) {
        console.error('Request accounts error:', error);
        
        if (error.code === 4001) {
            throw new Error('USER_REJECTED');
        } else if (error.code === -32002) {
            throw new Error('REQUEST_PENDING');
        }
        
        throw error;
    }
}

/**
 * ネットワークの確認と切り替え
 * @returns {Promise<void>}
 */
async function ensureCorrectNetwork() {
    try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== window.CHAIN_CONFIG.chainId) {
            try {
                // First try to switch to the network
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: window.CHAIN_CONFIG.chainId }]
                });
            } catch (switchError) {
                // If the network is not added yet, add it
                if (switchError.code === 4902) {
                    await addBaseNetwork();
                } else if (switchError.code === 4001) {
                    throw new Error('NETWORK_CHANGE_REJECTED');
                } else {
                    throw switchError;
                }
            }
        }
        
        // Verify the network switch was successful
        const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (newChainId !== window.CHAIN_CONFIG.chainId) {
            throw new Error('NETWORK_SWITCH_FAILED');
        }
    } catch (error) {
        console.error('Network switch error:', error);
        throw error;
    }
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
        
        // Verify network was added successfully
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== window.CHAIN_CONFIG.chainId) {
            throw new Error('NETWORK_ADD_FAILED');
        }
        
        emit('network:added', window.CHAIN_CONFIG);
    } catch (error) {
        console.error('Failed to add Base network:', error);
        if (error.code === 4001) {
            throw new Error('NETWORK_ADD_REJECTED');
        }
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
        'REQUEST_PENDING': {
            message: 'Connection request already pending. Please check your wallet.',
            type: 'warning'
        },
        'NO_ACCOUNTS': {
            message: 'No accounts found. Please check your wallet',
            type: 'error'
        },
        'NETWORK_ADD_FAILED': {
            message: 'Failed to add Base network. Please try manually',
            type: 'error'
        },
        'NETWORK_ADD_REJECTED': {
            message: 'Network addition was rejected. Please add Base network manually',
            type: 'warning'
        },
        'NETWORK_CHANGE_REJECTED': {
            message: 'Network change was rejected. Please switch to Base network',
            type: 'warning'
        },
        'NETWORK_SWITCH_FAILED': {
            message: 'Failed to switch to Base network. Please try manually',
            type: 'error'
        },
        'WEB3_INIT_FAILED': {
            message: 'Failed to initialize Web3. Please refresh the page',
            type: 'error'
        },
        'CONNECTION_TIMEOUT': {
            message: 'Connection timed out. Please try again',
            type: 'error'
        }
    };

    const errorConfig = errorMessages[error.message] || {
        message: 'Failed to connect wallet: ' + error.message,
        type: 'error'
    };

    showAlert(errorConfig.message, errorConfig.type);
    emit('wallet:error', { error: error.message });

    // Only retry for certain errors and if we haven't exceeded max attempts
    const retryableErrors = ['NETWORK_SWITCH_FAILED', 'WEB3_INIT_FAILED', 'CONNECTION_TIMEOUT'];
    if (connectionAttempts < MAX_ATTEMPTS && retryableErrors.includes(error.message)) {
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
    // Clear any existing timeout
    if (connectTimeout) {
        clearTimeout(connectTimeout);
        connectTimeout = null;
    }
    
    connectionState = CONNECTION_STATES.DISCONNECTED;
    connectionAttempts = 0;
    
    // Reset application state
    updateState({
        wallet: {
            address: '',
            isConnected: false,
            chainId: null
        }
    });
    
    // Clean up Web3 instance
    window.web3 = null;
    window.contract = null;
    window.usdcContract = null;
    
    emit('wallet:disconnected');
    showAlert('Wallet disconnected', 'info');
}

// Handle page unload
window.addEventListener('unload', () => {
    if (connectTimeout) {
        clearTimeout(connectTimeout);
    }
});
