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
    emit('wallet:connected', connectInfo
