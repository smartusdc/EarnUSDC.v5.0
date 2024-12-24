// core/store.js
import { emit } from './events.js';
import { EVENT_TYPES } from './events.js';

// アプリケーションの状態
const state = {
    wallet: {
        address: '',
        isConnected: false,
        networkId: null
    },
    balance: {
        usdc: '0',
        deposits: '0',
        rewards: '0'
    },
    rewards: {
        pending: '0',
        accumulated: '0',
        referral: '0'
    },
    rank: {
        current: 'Normal',
        bonus: 0,
        progress: 0
    },
    transactions: {
        pending: new Set(),
        history: []
    },
    loading: {
        isLoading: false,
        message: ''
    }
};

// 変更監視が必要なパス
const WATCHED_PATHS = {
    'wallet.address': true,
    'balance.usdc': true,
    'balance.deposits': true,
    'rewards.pending': true,
    'rank.current': true
};

/**
 * 状態の更新
 * @param {Object} updates 更新内容
 * @param {boolean} silent イベント発行を抑制するかどうか
 */
export function updateState(updates, silent = false) {
    const changes = new Set();
    
    function updateNestedState(current, updates, path = '') {
        Object.entries(updates).forEach(([key, value]) => {
            const currentPath = path ? `${path}.${key}` : key;
            
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                if (!current[key]) {
                    current[key] = {};
                }
                updateNestedState(current[key], value, currentPath);
            } else {
                if (current[key] !== value) {
                    current[key] = value;
                    if (WATCHED_PATHS[currentPath]) {
                        changes.add(currentPath);
                    }
                }
            }
        });
    }

    updateNestedState(state, updates);

    if (!silent && changes.size > 0) {
        emit(EVENT_TYPES.STATE_UPDATED, {
            changes: Array.from(changes),
            state: getState()
        });

        // 特定の変更に対する個別のイベント発行
        changes.forEach(path => {
            if (path.startsWith('balance.')) {
                emit(EVENT_TYPES.BALANCE_UPDATED, {
                    type: path.split('.')[1],
                    value: getStateValue(path)
                });
            } else if (path.startsWith('rewards.')) {
                emit(EVENT_TYPES.REWARDS_UPDATED, {
                    type: path.split('.')[1],
                    value: getStateValue(path)
                });
            }
        });
    }
}

/**
 * 状態の取得
 * @param {string} [path] 取得するパス
 * @returns {any} 状態の値
 */
export function getState(path) {
    if (!path) {
        return { ...state };
    }
    return getStateValue(path);
}

/**
 * 指定パスの状態値を取得
 * @param {string} path 状態のパス
 * @returns {any} 状態の値
 */
function getStateValue(path) {
    return path.split('.').reduce((obj, key) => 
        obj ? obj[key] : undefined, state);
}

/**
 * トランザクション状態の更新
 * @param {string} txHash トランザクションハッシュ
 * @param {Object} txInfo トランザクション情報
 */
export function updateTransaction(txHash, txInfo) {
    const { pending } = state.transactions;
    
    if (txInfo.status === 'pending') {
        pending.add(txHash);
    } else {
        pending.delete(txHash);
        state.transactions.history.unshift({
            ...txInfo,
            hash: txHash,
            timestamp: Date.now()
        });

        // 履歴の最大数を制限
        if (state.transactions.history.length > 50) {
            state.transactions.history.pop();
        }
    }

    emit(EVENT_TYPES.TRANSACTION_UPDATED, {
        hash: txHash,
        info: txInfo
    });
}

/**
 * ローディング状態の更新
 * @param {boolean} isLoading ローディング中かどうか
 * @param {string} message ローディングメッセージ
 */
export function setLoading(isLoading, message = '') {
    updateState({
        loading: { isLoading, message }
    });
}

/**
 * 状態のリセット
 */
export function resetState() {
    updateState({
        wallet: {
            address: '',
            isConnected: false,
            networkId: null
        },
        balance: {
            usdc: '0',
            deposits: '0',
            rewards: '0'
        },
        rewards: {
            pending: '0',
            accumulated: '0',
            referral: '0'
        },
        rank: {
            current: 'Normal',
            bonus: 0,
            progress: 0
        },
        transactions: {
            pending: new Set(),
            history: []
        },
        loading: {
            isLoading: false,
            message: ''
        }
    });
}

export const initialState = { ...state };
