// core/events.js

// イベントリスナーの保存用マップ
const listeners = new Map();

// イベントの種類の定義
const EVENT_TYPES = {
    // ウォレット関連
    WALLET_CONNECTED: 'wallet:connected',
    WALLET_DISCONNECTED: 'wallet:disconnected',
    WALLET_ACCOUNT_CHANGED: 'wallet:accountChanged',
    WALLET_ERROR: 'wallet:error',

    // ネットワーク関連
    NETWORK_CHANGED: 'network:changed',
    NETWORK_ADDED: 'network:added',

    // トランザクション関連
    TRANSACTION_STARTED: 'transaction:started',
    TRANSACTION_SUCCESS: 'transaction:success',
    TRANSACTION_ERROR: 'transaction:error',
    TRANSACTION_CONFIRMED: 'transaction:confirmed',

    // 状態更新関連
    STATE_UPDATED: 'state:updated',
    BALANCE_UPDATED: 'balance:updated',
    REWARDS_UPDATED: 'rewards:updated'
};

/**
 * イベントリスナーの登録
 * @param {string} eventType イベントの種類
 * @param {Function} callback コールバック関数
 * @returns {Function} リスナー解除用の関数
 */
export function on(eventType, callback) {
    if (!listeners.has(eventType)) {
        listeners.set(eventType, new Set());
    }
    
    listeners.get(eventType).add(callback);
    
    // クリーンアップ用の関数を返す
    return () => {
        const callbacks = listeners.get(eventType);
        if (callbacks) {
            callbacks.delete(callback);
            if (callbacks.size === 0) {
                listeners.delete(eventType);
            }
        }
    };
}

/**
 * 一度だけ実行されるイベントリスナーの登録
 * @param {string} eventType イベントの種類
 * @param {Function} callback コールバック関数
 * @returns {Function} リスナー解除用の関数
 */
export function once(eventType, callback) {
    const removeListener = on(eventType, (...args) => {
        removeListener();
        callback(...args);
    });
    return removeListener;
}

/**
 * イベントの発行
 * @param {string} eventType イベントの種類
 * @param {Object} data イベントデータ
 */
export function emit(eventType, data = {}) {
    const callbacks = listeners.get(eventType);
    if (callbacks) {
        callbacks.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventType}:`, error);
            }
        });
    }
}

/**
 * 特定のイベントタイプのリスナーをすべて削除
 * @param {string} eventType イベントの種類
 */
export function removeAllListeners(eventType) {
    if (eventType) {
        listeners.delete(eventType);
    } else {
        listeners.clear();
    }
}

/**
 * 指定されたイベントタイプのリスナー数を取得
 * @param {string} eventType イベントの種類
 * @returns {number} リスナーの数
 */
export function listenerCount(eventType) {
    const callbacks = listeners.get(eventType);
    return callbacks ? callbacks.size : 0;
}

export { EVENT_TYPES };
