// utils/formatters.js

/**
 * USDC金額のフォーマット
 * @param {string|number} value USDC金額
 * @param {Object} options フォーマットオプション
 * @returns {string} フォーマットされた金額
 */
export function formatUSDC(value, options = {}) {
    const {
        decimals = 4,
        minimumFractionDigits = 2,
        useGrouping = true
    } = options;

    if (!value) return '0.0000';
    
    const num = Number(value);
    if (isNaN(num)) return '0.0000';
    
    // 大きな数値の場合は桁区切りを使用
    if (num >= 10000 && useGrouping) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits,
            maximumFractionDigits: 2
        });
    }
    
    // 通常の表示は4桁の小数点
    return num.toFixed(decimals);
}

/**
 * パーセント値のフォーマット
 * @param {string|number} value パーセント値
 * @param {number} decimals 小数点以下の桁数
 * @returns {string} フォーマットされたパーセント値
 */
export function formatPercent(value, decimals = 2) {
    if (!value) return '0.00';
    
    const num = Number(value);
    if (isNaN(num)) return '0.00';
    
    return num.toFixed(decimals);
}

/**
 * ガス価格のフォーマット
 * @param {string|number} value Gwei単位のガス価格
 * @returns {string} フォーマットされたガス価格
 */
export function formatGasPrice(value) {
    if (!value) return '0';
    
    const num = Number(value);
    if (isNaN(num)) return '0';
    
    // 1 Gwei未満の場合
    if (num < 1) {
        return num.toFixed(3);
    }
    
    // 1000 Gwei以上の場合
    if (num >= 1000) {
        return `${(num / 1000).toFixed(2)}k`;
    }
    
    return num.toFixed(1);
}

/**
 * アドレスの短縮表示
 * @param {string} address ウォレットアドレス
 * @param {number} prefixLength 先頭の表示文字数
 * @param {number} suffixLength 末尾の表示文字数
 * @returns {string} 短縮されたアドレス
 */
export function formatAddress(address, prefixLength = 6, suffixLength = 4) {
    if (!address || address.length < (prefixLength + suffixLength)) {
        return address;
    }
    
    return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

/**
 * 日時のフォーマット
 * @param {number|string|Date} timestamp タイムスタンプまたは日付
 * @param {Object} options フォーマットオプション
 * @returns {string} フォーマットされた日時
 */
export function formatDateTime(timestamp, options = {}) {
    const {
        showTime = true,
        showSeconds = false,
        showDate = true
    } = options;
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const parts = [];
    
    if (showDate) {
        parts.push(date.toLocaleDateString());
    }
    
    if (showTime) {
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            ...(showSeconds ? { second: '2-digit' } : {})
        };
        parts.push(date.toLocaleTimeString(undefined, timeOptions));
    }
    
    return parts.join(' ');
}

/**
 * 経過時間のフォーマット
 * @param {number} seconds 秒数
 * @returns {string} フォーマットされた経過時間
 */
export function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m ${seconds % 60}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ${minutes % 60}m`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
}
