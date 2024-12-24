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
let web3Instance = null;

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
            title: 'Connecting Wallet',
            content: `
                <div class="text-center">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p class="mt-4 text-sm text-gray-500">Connecting to your wallet...</p>
                </div>
            `,
            closable: false
        });

        // Check for Ethereum provider
        const provider = await detectEthereumProvider();
        if (!provider) {
            throw new Error('WALLET_NOT_FOUND');
        }

        // Ensure the provider is MetaMask
        if (!provider.isMetaMask) {
            throw new Error('METAMASK_REQUIRED');
        }

        // Request accounts
        const accounts = await requestAccounts();
        if (!accounts || accounts.length === 0) {
            throw new Error('NO_ACCOUNTS');
        }

        // Check and switch network if needed
        await ensureCorrectNetwork();
        
        // Initialize Web3 and contracts
        await initializeWeb3AndContracts(provider);

        // Update connection state
        connectionState = CONNECTION_STATES.CONNECTED;
        connectionAttempts = 0;

        // Update application state
        updateState({
            wallet: {
                address: accounts[0],
                isConnected: true,
                chainId: await provider.request({ method: 'eth_chainId' })
            }
        });

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
 * Ethereumプロバイダーの検出
 * @returns {Promise<any>} Ethereum provider
 */
async function detectEthereumProvider() {
    if (window.ethereum) {
        return window.ethereum;
    }

    return new Promise((resolve) => {
        window.addEventListener('ethereum#initialized', () => {
            resolve(window.ethereum);
        }, { once: true });

        setTimeout(() => {
            resolve(null);
        }, 3000);
    });
}

/**
 * Web3とコントラクトの初期化
 * @param {any} provider Ethereum provider
 */
async function initializeWeb3AndContracts(provider) {
    try {
        // Import Web3 dynamically
        const Web3 = await import('https://cdnjs.cloudflare.com/ajax/libs/web3/4.3.0/web3.min.js');
        web3Instance = new Web3.default(provider);

        // Initialize contracts
        window.contract = new web3Instance.eth.Contract(
            CONTRACT_ABI,
            window.CONTRACT_ADDRESS
        );

        window.usdcContract = new web3Instance.eth.Contract(
            USDC_ABI,
            window.USDC_ADDRESS
        );

        return true;
    } catch (error) {
        console.error('Web3 initialization error:', error);
        throw new Error('WEB3_INIT_FAILED');
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
                await addNetwork();
            } else {
                throw new Error('NETWORK_SWITCH_FAILED');
            }
        }
    }
}

/**
 * Base Networkの追加
 */
async function addNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [window.CHAIN_CONFIG]
        });
    } catch (error) {
        throw new Error('NETWORK_ADD_FAILED');
    }
}

/**
 * 接続エラーの処理
 * @param {Error} error Connection error
 * @returns {Error} Handled error
 */
function handleConnectionError(error) {
    connectionState = CONNECTION_STATES.ERROR;

    const errorMessages = {
        'WALLET_NOT_FOUND': 'Please install MetaMask to use this application',
        'METAMASK_REQUIRED': 'Please use MetaMask wallet',
        'USER_REJECTED': 'Connection request was rejected',
        'NO_ACCOUNTS': 'No accounts found. Please check your wallet',
        'NETWORK_SWITCH_FAILED': 'Failed to switch network. Please try manually',
        'NETWORK_ADD_FAILED': 'Failed to add network. Please add Base Network manually',
        'WEB3_INIT_FAILED': 'Failed to initialize. Please refresh the page'
    };

    const message = errorMessages[error.message] || 'Wallet connection failed';
    showAlert(message, 'error');
    emit('wallet:error', { error: error.message });

    return new Error(message);
}

/**
 * ウォレットの切断
 */
export function disconnectWallet() {
    connectionState = CONNECTION_STATES.DISCONNECTED;
    web3Instance = null;
    
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

/**
 * Web3インスタンスの取得
 * @returns {Object|null} Web3 instance
 */
export function getWeb3Instance() {
    return web3Instance;
}
/**
 * 接続状態の取得
 * @returns {string} Current connection state
 */
export function getConnectionState() {
    return connectionState;
}
