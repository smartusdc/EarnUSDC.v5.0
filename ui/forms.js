// ui/forms.js
import { emit } from '../core/events.js';
import { formatUSDC } from '../utils/formatters.js';

/**
 * 入出金フォームの生成
 * @param {Object} options フォームオプション
 * @returns {string} フォームのHTML
 */
export function createTransactionForm({
    type = 'deposit',
    balance = '0',
    minAmount = '0.01',
    maxAmount,
    onSubmit,
    disabled = false
}) {
    const formId = `${type}-form-${Date.now()}`;
    
    return `
        <form id="${formId}" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">
                    Amount (USDC)
                </label>
                <div class="mt-1 relative rounded-md shadow-sm">
                    <input
                        type="number"
                        name="amount"
                        class="focus:ring-blue-500 focus:border-blue-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                        min="${minAmount}"
                        ${maxAmount ? `max="${maxAmount}"` : ''}
                        step="0.01"
                        required
                        ${disabled ? 'disabled' : ''}
                    >
                    <div class="absolute inset-y-0 right-0 flex items-center">
                        <button
                            type="button"
                            class="max-btn inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 hover:text-blue-500 focus:outline-none"
                            ${disabled ? 'disabled' : ''}
                        >
                            MAX
                        </button>
                    </div>
                </div>
                <p class="mt-1 text-sm text-gray-500">
                    Available: ${formatUSDC(balance)} USDC
                </p>
            </div>

            <div>
                <button
                    type="submit"
                    class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    ${disabled ? 'disabled' : ''}
                >
                    ${type === 'deposit' ? 'Deposit' : 'Withdraw'}
                </button>
            </div>
        </form>
    `;
}

/**
 * フォームのイベントハンドラーを設定
 * @param {string} formId フォームID
 * @param {Object} options イベントオプション
 */
export function setupFormHandlers(formId, {
    onSubmit,
    onMaxClick,
    validateAmount
}) {
    const form = document.getElementById(formId);
    if (!form) return;

    const amountInput = form.querySelector('input[name="amount"]');
    const maxButton = form.querySelector('.max-btn');

    // 数値入力の検証
    amountInput?.addEventListener('input', (e) => {
        const value = e.target.value;
        if (validateAmount) {
            const isValid = validateAmount(value);
            e.target.setCustomValidity(isValid ? '' : 'Invalid amount');
        }
    });

    // MAXボタンのハンドラ
    maxButton?.addEventListener('click', () => {
        if (onMaxClick) {
            onMaxClick(amountInput);
        }
    });

    // フォーム送信のハンドラ
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!onSubmit) return;

        const amount = amountInput?.value;
        if (!amount) return;

        try {
            await onSubmit(amount);
            emit('form:submitted', { formId, amount });
            form.reset();
        } catch (error) {
            console.error('Form submission error:', error);
            emit('form:error', { formId, error });
        }
    });
}

/**
 * リファラルコードフォームの生成
 * @param {Object} options フォームオプション
 * @returns {string} フォームのHTML
 */
export function createReferralForm({
    currentCode = '',
    onSubmit,
    disabled = false
}) {
    const formId = `referral-form-${Date.now()}`;
    
    return `
        <form id="${formId}" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">
                    Referral Code
                </label>
                <div class="mt-1">
                    <input
                        type="text"
                        name="referralCode"
                        class="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Enter 6-digit code"
                        pattern="[0-9]{6}"
                        value="${currentCode}"
                        required
                        ${disabled ? 'disabled' : ''}
                    >
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    ${disabled ? 'disabled' : ''}
                >
                    ${currentCode ? 'Update' : 'Apply'} Referral Code
                </button>
            </div>
        </form>
    `;
}

/**
 * リファラルフォームのイベントハンドラーを設定
 * @param {string} formId フォームID
 * @param {Function} onSubmit 送信時のコールバック
 */
export function setupReferralFormHandlers(formId, onSubmit) {
    const form = document.getElementById(formId);
    if (!form) return;

    const codeInput = form.querySelector('input[name="referralCode"]');

    // コード入力の検証
    codeInput?.addEventListener('input', (e) => {
        const value = e.target.value;
        const isValid = /^[0-9]{6}$/.test(value);
        e.target.setCustomValidity(isValid ? '' : 'Please enter a valid 6-digit code');
    });

    // フォーム送信のハンドラ
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!onSubmit) return;

        const code = codeInput?.value;
        if (!code) return;

        try {
            await onSubmit(code);
            emit('referral:submitted', { formId, code });
        } catch (error) {
            console.error('Referral form submission error:', error);
            emit('referral:error', { formId, error });
        }
    });
}
