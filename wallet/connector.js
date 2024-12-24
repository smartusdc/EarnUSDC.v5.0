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
 * Initialize wallet connection
 * @returns {Promise<boolean>} Connection success
 */
export async function initializeWalletConnection() {
    console.log('Starting wallet connection initialization');
    
    if (connectionState === CONNECTION_STATES.CONNECTING) {
        showAlert('Connection already in progress', 'info');
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
        console.log('Detecting Ethereum provider...');
        const provider = await detectEthereumProvider();
        if (!provider) {
            throw new Error('WALLET_NOT_FOUND');
        }
        console.log('Ethereum provider detected');

        // Ensure the provider is MetaMask
        if (!provider.isMetaMask) {
            throw new Error('METAMASK_REQUIRED');
        }

        // Request accounts
        console.log('Requesting accounts...');
        const accounts = await requestAccounts();
        if (!accounts || accounts.length === 0) {
            throw new Error('NO_ACCOUNTS');
        }
        const userAddress = accounts[0];
        console.log('Account access granted:', userAddress);

        // Check and switch network if needed
        console.log('Checking network...');
        await ensureCorrectNetwork();
        console.log('Network check complete');

        // Initialize Web3 and fetch initial data
        console.log('Initializing Web3...');
        try {
            web3Instance = new Web3(provider);
        } catch (error) {
            console.error('Web3 initialization error:', error);
            throw new Error('WEB3_INIT_FAILED');
        }
        console.log('Web3 instance created');

        // Initialize contracts
        try {
            window.contract = new web3Instance.eth.Contract(
                CONTRACT_ABI,
                window.CONTRACT_ADDRESS
            );
            window.usdcContract = new web3Instance.eth.Contract(
                USDC_ABI,
                window.USDC_ADDRESS
            );
            console.log('Contracts initialized');
        } catch (error) {
            console.error('Contract initialization error:', error);
            throw new Error('CONTRACT_INIT_FAILED');
        }

        // Update modal for data fetching
        if (currentModalId) {
            showModal({
                title: 'Loading Data',
                content: `
                    <div class="text-center">
                        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <p class="mt-4 text-sm text-gray-500">Loading your account data...</p>
                    </div>
                `,
                closable: false
            });
        }

        // Fetch initial data
        console.log('Fetching contract data...');
        try {
            // Fetch basic data
            const [deposits, calculatedReward, usdcBalance, referralCode] = await Promise.all([
                window.contract.methods.deposits(userAddress).call(),
                window.contract.methods.calculateReward(userAddress).call(),
                window.usdcContract.methods.balanceOf(userAddress).call(),
                window.contract.methods.userToReferralCode(userAddress).call()
            ]);

            // Fetch rank data separately
            const userRank = await window.contract.methods.getUserRank(userAddress).call();
            console.log('User rank data:', userRank);

            const rankProgress = Math.min(
                (Number(userRank.progressToNextRank || 0) / 10000) * 100,
                100
            );

            // Update application state
            updateState({
                wallet: {
                    address: userAddress,
                    isConnected: true,
                    networkId: await provider.request({ method: 'eth_chainId' })
                },
                balance: {
                    usdc: web3Instance.utils.fromWei(usdcBalance, 'mwei'),
                    deposits: web3Instance.utils.fromWei(deposits, 'mwei'),
                    rewards: web3Instance.utils.fromWei(calculatedReward, 'mwei')
                },
                rewards: {
                    pending: web3Instance.utils.fromWei(calculatedReward, 'mwei'),
                    accumulated: '0',
                    referral: '0'
                },
                rank: {
                    current: userRank.rankName || 'Normal',
                    bonus: Number(userRank.bonusRate || 0) / 100,
                    progress: rankProgress
                },
                referral: {
                    code: referralCode === '0' ? null : referralCode
                }
            });

            console.log('Application state updated successfully');
            emit('wallet:connected', { account: userAddress });

        } catch (error) {
            console.error('Data fetching error:', error);
            throw new Error('DATA_FETCH_FAILED');
        }

        // Update connection state
        connectionState = CONNECTION_STATES.CONNECTED;
        connectionAttempts = 0;

        // Show success message
        showAlert('Successfully connected to wallet', 'success');
        return true;

    } catch (error) {
        console.error('Connection error:', error);
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
 * Detect Ethereum provider
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
 * Request account access
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
 * Ensure correct network connection
 */
async function ensureCorrectNetwork() {
    try {
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
    } catch (error) {
        console.error('Network check error:', error);
        throw error;
    }
}

/**
 * Add Base Network to wallet
 */
async function addNetwork() {
    try {
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [window.CHAIN_CONFIG]
        });
    } catch (error) {
        console.error('Network add error:', error);
        throw new Error('NETWORK_ADD_FAILED');
    }
}

/**
 * Handle connection errors
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
        'WEB3_INIT_FAILED': 'Failed to initialize Web3. Please refresh the page',
        'CONTRACT_INIT_FAILED': 'Failed to initialize contracts. Please try again',
        'DATA_FETCH_FAILED': 'Failed to fetch account data. Please try again'
    };

    const message = errorMessages[error.message] || error.message || 'Wallet connection failed';
    showAlert(message, 'error');
    emit('wallet:error', { error: message });

    return new Error(message);
}

/**
 * Disconnect wallet
 */
export function disconnectWallet() {
    connectionState = CONNECTION_STATES.DISCONNECTED;
    web3Instance = null;
    
    updateState({
        wallet: {
            address: '',
            isConnected: false,
            networkId: null
        }
    });

    emit('wallet:disconnected');
    showAlert('Wallet disconnected', 'info');
}

/**
 * Get Web3 instance
 * @returns {Object|null} Web3 instance
 */
export function getWeb3Instance() {
    return web3Instance;
}

/**
 * Get connection state
 * @returns {string} Current connection state
 */
export function getConnectionState() {
    return connectionState;
}
