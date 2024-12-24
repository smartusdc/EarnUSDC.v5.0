// wallet/events.js
import { showAlert } from '../ui/alerts.js';
import { updateState } from '../core/store.js';
import { emit } from '../core/events.js';
import { getConnectionState, initializeWalletConnection } from './connector.js';

/**
 * ウォレットイベントのセットアップ
 * @returns {void}
 */
export function setupWalletEvents() {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', handleAccountChange);
    window.ethereum.on('chainChanged', handleChainChange);
    window.ethereum.on('disconnect', handleDisconnect);
    window.ethereum.on('connect', handleConnect);
}

/**
 * アカウント変更の処理
 * @param {string[]} accounts Changed accounts
 */
async function handleAccountChange(accounts) {
    if (!accounts || accounts.length === 0) {
        handleDisconnect();
        return;
    }

    const newAccount = accounts[0];
    if (getConnectionState() === 'connected') {
        updateState({
            wallet: {
                address: newAccount,
                isConnected: true
            }
        });
        
        emit('wallet:accountChanged', { account: newAccount });
        showAlert('Account changed successfully', 'info');
        
        // 新しいアカウントでデータを再読み込み
        await refreshUserData(newAccount);
    }
}

/**
 * チェーン変更の処理
 * @param {string} chainId New chain ID
 */
async function handleChainChange(chainId) {
    if (chainId !== CHAIN_CONFIG.chainId) {
        showAlert('Please switch to Base Network', 'warning');
        emit('network:changed', { 
            chainId,
            isSupported: false 
        });
        
        // 必要に応じてネットワーク切り替えを促す
        const shouldSwitch = await confirmNetworkSwitch();
        if (shouldSwitch) {
            await initializeWalletConnection();
        }
    } else {
        emit('network:changed', { 
            chainId,
            isSupported: true 
        });
    }
}

/**
 * 切断の処理
 * @param {Object} error Disconnect error if any
 */
function handleDisconnect(error) {
    updateState({
        wallet: {
            address: '',
            isConnected: false
        }
    });
    
    emit('wallet:disconnected', error);
    showAlert('Wallet disconnected', 'info');
}

/**
 * 接続の処理
 * @param {Object} connectInfo Connection info
 */
function handleConnect(connectInfo) {
    emit('wallet:connected', connectInfo);
    
    // 接続が確立された後のデータ初期化
    initializeAfterConnection();
}

/**
 * ユーザーデータの再読み込み
 * @param {string} account Account address
 */
async function refreshUserData(account) {
    try {
        const [balance, rewards] = await Promise.all([
            contract.methods.deposits(account).call(),
            contract.methods.calculateReward(account).call()
        ]);

        updateState({
            balance: web3.utils.fromWei(balance, 'mwei'),
            rewards: web3.utils.fromWei(rewards, 'mwei')
        });
    } catch (error) {
        console.error('Error refreshing user data:', error);
        showAlert('Failed to refresh account data', 'error');
    }
}

/**
 * ネットワーク切り替えの確認
 * @returns {Promise<boolean>}
 */
async function confirmNetworkSwitch() {
    return new Promise(resolve => {
        const result = window.confirm(
            'This application requires Base Network. Would you like to switch networks?'
        );
        resolve(result);
    });
}

/**
 * 接続後の初期化処理
 */
async function initializeAfterConnection() {
    try {
        const accounts = await web3.eth.getAccounts();
        if (accounts && accounts.length > 0) {
            await refreshUserData(accounts[0]);
        }
    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Failed to initialize application data', 'error');
    }
}

/**
 * イベントリスナーのクリーンアップ
 */
export function cleanupWalletEvents() {
    if (!window.ethereum) return;
    
    window.ethereum.removeListener('accountsChanged', handleAccountChange);
    window.ethereum.removeListener('chainChanged', handleChainChange);
    window.ethereum.removeListener('disconnect', handleDisconnect);
    window.ethereum.removeListener('connect', handleConnect);
}
