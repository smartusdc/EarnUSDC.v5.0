// ui/dashboard.js
import { getState } from '../core/store.js';
import { formatUSDC } from '../utils/formatters.js';
import { createTransactionForm } from './forms.js';
import { showModal, closeModal } from './modals.js';
import { emit } from '../core/events.js';

/**
 * ダッシュボードの描画
 * @param {string} containerId コンテナのID
 */
export function renderDashboard(containerId = 'mainContent') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const state = getState();
    
    container.innerHTML = `
        <div class="space-y-6">
            ${renderStatsSection(state)}
            ${renderTransactionSection(state)}
            ${renderRewardsSection(state)}
            ${renderReferralSection(state)}
        </div>
    `;

    // フォームハンドラーの設定
    setupFormHandlers();

    emit('dashboard:rendered');
}

/**
 * 統計セクションの描画
 * @param {Object} state アプリケーション状態
 * @returns {string} HTML文字列
 */
function renderStatsSection(state) {
    const { balance, rewards, rank } = state;
    
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Balance</h3>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Deposits</span>
                        <span class="font-medium">${formatUSDC(balance.deposits)} USDC</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Available</span>
                        <span class="font-medium">${formatUSDC(balance.usdc)} USDC</span>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Rank Status</h3>
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Current Rank</span>
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${getRankColorClass(rank.current)}">
                            ${rank.current}
                        </span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Bonus Rate</span>
                        <span class="font-medium text-green-600">+${rank.bonus}%</span>
                    </div>
                    <div class="mt-2">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-500">Progress to Next Rank</span>
                            <span class="text-gray-500">${rank.progress}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 rounded-full h-2 transition-all duration-500"
                                style="width: ${rank.progress}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * 取引セクションの描画
 * @param {Object} state アプリケーション状態
 * @returns {string} HTML文字列
 */
function renderTransactionSection(state) {
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Deposit</h3>
                ${createTransactionForm({
                    type: 'deposit',
                    balance: state.balance.usdc,
                    minAmount: '0.01',
                    disabled: state.loading.isLoading
                })}
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Withdraw</h3>
                ${createTransactionForm({
                    type: 'withdraw',
                    balance: state.balance.deposits,
                    minAmount: '0.01',
                    disabled: state.loading.isLoading
                })}
            </div>
        </div>
    `;
}

/**
 * 報酬セクションの描画
 * @param {Object} state アプリケーション状態
 * @returns {string} HTML文字列
 */
function renderRewardsSection(state) {
    const { rewards } = state;
    
    return `
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Rewards</h3>
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <div class="text-sm text-gray-600">Pending Rewards</div>
                        <div class="mt-1 text-2xl font-semibold">${formatUSDC(rewards.pending)} USDC</div>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <div class="text-sm text-gray-600">Accumulated Rewards</div>
                        <div class="mt-1 text-2xl font-semibold">${formatUSDC(rewards.accumulated)} USDC</div>
                    </div>
                    <div class="p-4 bg-gray-50 rounded-lg">
                        <div class="text-sm text-gray-600">Referral Rewards</div>
                        <div class="mt-1 text-2xl font-semibold">${formatUSDC(rewards.referral)} USDC</div>
                    </div>
                </div>
                
                <div class="flex space-x-4">
                    <button
                        onclick="handleClaimRewards()"
                        class="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        ${!Number(rewards.pending) || state.loading.isLoading ? 'disabled' : ''}
                    >
                        Claim Rewards
                    </button>
                    <button
                        onclick="handleClaimReferralRewards()"
                        class="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        ${!Number(rewards.referral) || state.loading.isLoading ? 'disabled' : ''}
                    >
                        Claim Referral Rewards
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * リファラルセクションの描画
 * @param {Object} state アプリケーション状態
 * @returns {string} HTML文字列
 */
function renderReferralSection(state) {
    return `
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Referral Program</h3>
            <div class="space-y-4">
                <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-600">Your Referral Code</div>
                    ${state.referral?.code ? `
                        <div class="mt-2 flex items-center space-x-2">
                            <code class="text-lg font-mono bg-white px-3 py-2 rounded">${state.referral.code}</code>
                            <button
                                onclick="copyReferralCode('${state.referral.code}')"
                                class="p-2 text-gray-500 hover:text-gray-700"
                                title="Copy referral code"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
                                </svg>
                            </button>
                        </div>
                    ` : `
                        <button
                            onclick="handleGenerateReferralCode()"
                            class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Generate Referral Code
                        </button>
                    `}
                </div>
            </div>
        </div>
    `;
}

/**
 * ランクに応じた色クラスを取得
 * @param {string} rank ランク名
 * @returns {string} Tailwind CSSクラス
 */
function getRankColorClass(rank) {
    const colors = {
        'Normal': 'bg-gray-100 text-gray-800',
        'Silver': 'bg-gray-200 text-gray-800',
        'Gold': 'bg-yellow-100 text-yellow-800',
        'Platinum': 'bg-purple-100 text-purple-800',
        'Whale': 'bg-blue-100 text-blue-800'
    };
    return colors[rank] || colors['Normal'];
}

/**
 * フォームのイベントハンドラーを設定
 */
function setupFormHandlers() {
    // Deposit form
    const depositForm = document.querySelector('form[data-type="deposit"]');
    if (depositForm) {
        depositForm.addEventListener('submit', handleDeposit);
    }

    // Withdraw form
    const withdrawForm = document.querySelector('form[data-type="withdraw"]');
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', handleWithdraw);
    }
}

// Export for use in index.html
window.handleClaimRewards = async function() {
    // Implementation will be added
};

window.handleClaimReferralRewards = async function() {
    // Implementation will be added
};

window.handleGenerateReferralCode = async function() {
    // Implementation will be added
};

window.copyReferralCode = async function(code) {
    try {
        await navigator.clipboard.writeText(code);
        showModal({
            type: 'success',
            title: 'Success',
            content: 'Referral code copied to clipboard!'
        });
    } catch (error) {
        console.error('Failed to copy:', error);
    }
};
