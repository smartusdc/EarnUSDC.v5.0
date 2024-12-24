// utils/validators.js

/**
 * 数値入力の検証
 * @param {string|number} value 入力値
 * @param {Object} options 検証オプション
 * @returns {boolean} 検証結果
 */
export function validateNumericInput(value, options = {}) {
    const {
        min = 0,
        max = Number.MAX_SAFE_INTEGER,
        decimals = 6,
        required = true
    } = options;

    // 必須チェック
    if (!value && value !== 0) {
        return !required;
    }

    // 数値変換
    const num = Number(value);
    
    // 数値チェック
    if (isNaN(num)) return false;
    
    // 範囲チェック
    if (num < min || num > max) return false;
    
    // 小数点以下の桁数チェック
    const decimalPart = value.toString().split('.')[1];
    if (decimalPart && decimalPart.length > decimals) return false;
    
    return true;
}

/**
 * ウォレットアドレスの検証
 * @param {string} address アドレス
 * @returns {boolean} 検証結果
 */
export function validateAddress(address) {
    if (!address) return false;
    
    // 基本的なフォーマットチェック
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
    
    // アドレスが全て0でないことを確認
    if (/^0x[0]{40}$/.test(address)) return false;
    
    return true;
}

/**
 * リファラルコードの検証
 * @param {string} code リファラルコード
 * @returns {boolean} 検証結果
 */
export function validateReferralCode(code) {
    if (!code) return false;
    
    // 6桁の数字であることを確認
    if (!/^\d{6}$/.test(code)) return false;
    
    // コードが全て0でないことを確認
    if (code === '000000') return false;
    
    return true;
}

/**
 * トランザクションハッシュの検証
 * @param {string} hash トランザクションハッシュ
 * @returns {boolean} 検証結果
 */
export function validateTransactionHash(hash) {
    if (!hash) return false;
    
    // 基本的なフォーマットチェック
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * ガス価格の検証
 * @param {string|number} price ガス価格（Gwei）
 * @param {Object} options 検証オプション
 * @returns {boolean} 検証結果
 */
export function validateGasPrice(price, options = {}) {
    const {
        minGwei = 0.1,
        maxGwei = 500,
        decimals = 1
    } = options;

    return validateNumericInput(price, {
        min: minGwei,
        max: maxGwei,
        decimals
    });
}

/**
 * ガスリミットの検証
 * @param {string|number} limit ガスリミット
 * @returns {boolean} 検証結果
 */
export function validateGasLimit(limit) {
    const num = Number(limit);
    
    // 整数であることを確認
    if (!Number.isInteger(num)) return false;
    
    // Base Networkの制限をチェック
    const MAX_GAS_LIMIT = 30000000;
    if (num <= 0 || num > MAX_GAS_LIMIT) return false;
    
    return true;
}

/**
 * 入力金額の検証
 * @param {string|number} amount 金額
 * @param {Object} balance 残高情報
 * @returns {Object} 検証結果と理由
 */
export function validateAmount(amount, balance = {}) {
    const result = {
        isValid: false,
        reason: ''
    };

    if (!amount) {
        result.reason = 'Amount is required';
        return result;
    }

    const value = Number(amount);
    if (isNaN(value)) {
        result.reason = 'Invalid amount';
        return result;
    }

    if (value <= 0) {
        result.reason = 'Amount must be greater than 0';
        return result;
    }

    if (value < 0.01) {
        result.reason = 'Minimum amount is 0.01 USDC';
        return result;
    }

    if (balance.available && value > Number(balance.available)) {
        result.reason = 'Insufficient balance';
        return result;
    }

    result.isValid = true;
    return result;
}
