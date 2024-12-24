// transactions/executor.js
import { emit } from '../core/events.js';
import { updateState } from '../core/store.js';
import { estimateGasPrice, estimateGasLimit } from './gas.js';
import { showAlert } from '../ui/alerts.js';
import { showProcessModal, hideProcessModal, updateModal } from '../ui/modals.js';
import { validateAmount, validateGasPrice, validateGasLimit } from '../utils/validators.js';

/**
 * トランザクション実行の基本設定
 */
const TX_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    CONFIRMATION_BLOCKS: 1
};

/**
 * トランザクション実行の管理
 * @param {Object} params トランザクションパラメータ
 * @returns {Promise<Object>} トランザクション結果
 */
export async function executeTransaction(params) {
    const {
        type,
        method,
        args = [],
        options = {},
        validationData = {},
        modalMessages = {}
    } = params;

    try {
        // バリデーション
        await validateTransaction(type, args, validationData);
        
        // ガスパラメータの取得
        const gasParams = await prepareGasParameters(method, options);
        
        // トランザクションの実行
        showProcessModal(
            modalMessages.title || 'Processing Transaction',
            modalMessages.description || 'Please confirm the transaction in your wallet'
        );

        const result = await processTransaction({
            method,
            args,
            options: { ...options, ...gasParams }
        });

        // 成功時の処理
        handleSuccess(result, type);
        return result;

    } catch (error) {
        // エラー処理
        handleError(error, type);
        throw error;

    } finally {
        hideProcessModal();
    }
}

/**
 * トランザクションの検証
 * @param {string} type トランザクションタイプ
 * @param {Array} args 引数
 * @param {Object} validationData 検証用データ
 */
async function validateTransaction(type, args, validationData) {
    if (type === 'deposit' || type === 'withdraw') {
        const [amount] = args;
        const validation = validateAmount(amount, validationData.balance);
        
        if (!validation.isValid) {
            throw new Error(validation.reason);
        }
    }
}

/**
 * ガスパラメータの準備
 * @param {Object} method コントラクトメソッド
 * @param {Object} options オプション
 * @returns {Promise<Object>} ガスパラメータ
 */
async function prepareGasParameters(method, options) {
    try {
        const [gasPrice, gasLimit] = await Promise.all([
            estimateGasPrice(),
            estimateGasLimit(method, options)
        ]);

        if (!validateGasPrice(gasPrice) || !validateGasLimit(gasLimit)) {
            throw new Error('Invalid gas parameters');
        }

        return { gasPrice, gasLimit };

    } catch (error) {
        console.error('Gas parameter preparation error:', error);
        throw new Error('Failed to prepare gas parameters');
    }
}

/**
 * トランザクションの実行処理
 * @param {Object} params 実行パラメータ
 * @returns {Promise<Object>} トランザクション結果
 */
async function processTransaction(params) {
    const { method, args, options } = params;
    let attempts = 0;

    while (attempts < TX_CONFIG.MAX_RETRIES) {
        try {
            // トランザクションの送信
            const tx = await method(...args).send(options);
            
            // 確認待ち
            updateModal(null, {
                description
