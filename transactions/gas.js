// transactions/gas.js
import { showAlert } from '../ui/alerts.js';

// Network specific constants
const GAS_PRICE_THRESHOLDS = {
    HIGH: 30,      // Gwei
    EXTREME: 100   // Gwei
};

const GAS_LIMITS = {
    BASE_NETWORK_MAX: 30000000,
    APPROVAL: 60000,
    DEPOSIT: 200000,
    WITHDRAW: 150000,
    CLAIM: 120000
};

const BUFFER_MULTIPLIERS = {
    GAS_PRICE: 1.1,  // 10% buffer for gas price
    GAS_LIMIT: 1.2   // 20% buffer for gas limit
};

/**
 * ガス価格を推定し、必要に応じて警告を表示
 * @returns {Promise<string>} Estimated gas price in wei
 */
export async function estimateGasPrice() {
    try {
        const gasPrice = await web3.eth.getGasPrice();
        const gasPriceGwei = Number(web3.utils.fromWei(gasPrice, 'gwei'));

        // ガス価格に基づく警告表示
        if (gasPriceGwei > GAS_PRICE_THRESHOLDS.EXTREME) {
            showAlert('Gas prices are extremely high. Consider waiting.', 'error');
            throw new Error('Gas price too high');
        }
        
        if (gasPriceGwei > GAS_PRICE_THRESHOLDS.HIGH) {
            showAlert('Gas prices are higher than usual.', 'warning');
        }

        // バッファを追加した最終的なガス価格を計算
        const adjustedGasPrice = Math.floor(
            Number(gasPrice) * BUFFER_MULTIPLIERS.GAS_PRICE
        );

        return adjustedGasPrice.toString();
    } catch (error) {
        console.error('Gas price estimation error:', error);
        // フォールバック: Base Networkの標準的な低価格
        return web3.utils.toWei('1', 'gwei');
    }
}

/**
 * 特定の操作のガスリミットを推定
 * @param {Object} method Contract method
 * @param {Object} params Transaction parameters
 * @returns {Promise<number>} Estimated gas limit
 */
export async function estimateGasLimit(method, params = {}) {
    try {
        const estimate = await method.estimateGas(params);
        const adjustedEstimate = Math.ceil(
            estimate * BUFFER_MULTIPLIERS.GAS_LIMIT
        );

        if (adjustedEstimate > GAS_LIMITS.BASE_NETWORK_MAX) {
            throw new Error('Gas limit exceeds network maximum');
        }

        return adjustedEstimate;
    } catch (error) {
        console.error('Gas limit estimation error:', error);
        
        // 操作タイプに基づくフォールバック値を返す
        const methodName = method._method?.name?.toLowerCase() || '';
        if (methodName.includes('approve')) return GAS_LIMITS.APPROVAL;
        if (methodName.includes('deposit')) return GAS_LIMITS.DEPOSIT;
        if (methodName.includes('withdraw')) return GAS_LIMITS.WITHDRAW;
        if (methodName.includes('claim')) return GAS_LIMITS.CLAIM;
        
        throw error;
    }
}

/**
 * トランザクションの総コストを推定
 * @param {number} gasLimit Estimated gas limit
 * @param {string} value Transaction value in wei
 * @returns {Promise<{cost: string, isHighCost: boolean, warning?: string}>}
 */
export async function estimateTransactionCost(gasLimit, value = '0') {
    try {
        const gasPrice = await estimateGasPrice();
        const gasCost = BigInt(gasPrice) * BigInt(gasLimit);
        const totalCost = gasCost + BigInt(value);
        
        const costInEth = web3.utils.fromWei(totalCost.toString(), 'ether');
        const isHighCost = Number(costInEth) > 0.001;

        return {
            cost: costInEth,
            isHighCost,
            warning: isHighCost ? 'This transaction requires a relatively high gas fee.' : undefined
        };
    } catch (error) {
        console.error('Transaction cost estimation error:', error);
        throw error;
    }
}

/**
 * ガス関連のパラメータをトランザクション用に準備
 * @param {Object} method Contract method
 * @param {Object} params Transaction parameters
 * @returns {Promise<{gasPrice: string, gasLimit: number}>}
 */
export async function prepareGasParameters(method, params = {}) {
    const [gasPrice, gasLimit] = await Promise.all([
        estimateGasPrice(),
        estimateGasLimit(method, params)
    ]);

    return { gasPrice, gasLimit };
}
