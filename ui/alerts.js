// ui/alerts.js
import { emit } from '../core/events.js';

// アラートの設定
const ALERT_CONFIGS = {
    duration: 5000,    // デフォルトの表示時間
    maxAlerts: 3,      // 同時表示の最大数
    container: {
        id: 'alertContainer',
        class: 'fixed top-4 right-4 z-50 space-y-2'
    }
};

// アラートの状態管理
let activeAlerts = new Set();
let alertCounter = 0;

/**
 * アラートの表示
 * @param {string} message メッセージ
 * @param {string} type アラートタイプ ('success' | 'error' | 'warning' | 'info')
 * @param {number} [duration] 表示時間（ミリ秒）
 */
export function showAlert(message, type = 'info', duration = ALERT_CONFIGS.duration) {
    const alertId = `alert-${++alertCounter}`;
    
    ensureContainer();
    
    // アラート要素の作成
    const alertElement = createAlertElement(message, type, alertId);
    const container = document.getElementById(ALERT_CONFIGS.container.id);
    
    // 最大表示数を超える場合、古いアラートを削除
    while (activeAlerts.size >= ALERT_CONFIGS.maxAlerts) {
        const oldestAlert = container.firstChild;
        if (oldestAlert) {
            removeAlert(oldestAlert.id);
        }
    }
    
    // アラートの表示
    container.appendChild(alertElement);
    activeAlerts.add(alertId);
    
    // イベントの発行
    emit('alert:shown', { id: alertId, message, type });
    
    // 自動消去のタイマー設定
    if (duration > 0) {
        setTimeout(() => removeAlert(alertId), duration);
    }
    
    return alertId;
}

/**
 * アラート要素の作成
 * @param {string} message メッセージ
 * @param {string} type アラートタイプ
 * @param {string} id アラートID
 * @returns {HTMLElement} アラート要素
 */
function createAlertElement(message, type, id) {
    const alert = document.createElement('div');
    alert.id = id;
    alert.className = `
        alert-slide-in transform transition-all duration-300
        max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto
        ring-1 ring-black ring-opacity-5 p-4
        ${getAlertColorClasses(type)}
    `;
    
    alert.innerHTML = `
        <div class="flex items-center">
            <div class="flex-shrink-0">
                ${getAlertIcon(type)}
            </div>
            <div class="ml-3 w-0 flex-1">
                <p class="text-sm font-medium">
                    ${message}
                </p>
            </div>
            <div class="ml-4 flex-shrink-0 flex">
                <button
                    class="bg-transparent rounded-md inline-flex text-current hover:text-gray-500 focus:outline-none"
                    onclick="document.getElementById('${id}').remove()"
                >
                    <span class="sr-only">Close</span>
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    // アニメーション設定
    requestAnimationFrame(() => {
        alert.classList.add('translate-y-0', 'opacity-100');
    });
    
    return alert;
}

/**
 * アラートタイプに応じたカラークラスを取得
 * @param {string} type アラートタイプ
 * @returns {string} Tailwind CSSクラス
 */
function getAlertColorClasses(type) {
    switch (type) {
        case 'success':
            return 'bg-green-50 text-green-800';
        case 'error':
            return 'bg-red-50 text-red-800';
        case 'warning':
            return 'bg-yellow-50 text-yellow-800';
        default:
            return 'bg-blue-50 text-blue-800';
    }
}

/**
 * アラートタイプに応じたアイコンを取得
 * @param {string} type アラートタイプ
 * @returns {string} SVGアイコン
 */
function getAlertIcon(type) {
    const iconClasses = 'h-5 w-5';
    switch (type) {
        case 'success':
            return `<svg class="${iconClasses}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`;
        case 'error':
            return `<svg class="${iconClasses}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`;
        case 'warning':
            return `<svg class="${iconClasses}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>`;
        default:
            return `<svg class="${iconClasses}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>`;
    }
}

/**
 * アラートコンテナの確認と作成
 */
function ensureContainer() {
    let container = document.getElementById(ALERT_CONFIGS.container.id);
    if (!container) {
        container = document.createElement('div');
        container.id = ALERT_CONFIGS.container.id;
        container.className = ALERT_CONFIGS.container.class;
        document.body.appendChild(container);
    }
}

/**
 * アラートの削除
 * @param {string} alertId アラートID
 */
export function removeAlert(alertId) {
    const alert = document.getElementById(alertId);
    if (alert) {
        alert.classList.add('-translate-y-1', 'opacity-0');
        setTimeout(() => {
            alert.remove();
            activeAlerts.delete(alertId);
            emit('alert:hidden', { id: alertId });
        }, 300);
    }
}

/**
 * 全アラートの削除
 */
export function clearAllAlerts() {
    const container = document.getElementById(ALERT_CONFIGS.container.id);
    if (container) {
        container.innerHTML = '';
        activeAlerts.clear();
        emit('alert:cleared');
    }
}
