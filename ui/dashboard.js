// ui/dashboard.js
import { getState } from '../core/store.js';
import { formatUSDC } from '../utils/formatters.js';
import { createTransactionForm } from './forms.js';
import { showModal, closeModal } from './modals.js';
import { emit } from '../core/events.js';

/**
 * Render dashboard
 * @param {string} containerId Container element ID
 */
export function renderDashboard(containerId = 'mainContent') {
    console.log('Starting dashboard render...');
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Dashboard container not found:', containerId);
        return;
    }

    const state = getState();
    console.log('Current application state:', state);

    if (!state.wallet.isConnected) {
        console.log('Wallet not connected, showing pre-connection message');
        renderPreConnectionMessage(container);
        return;
    }

    try {
        container.innerHTML = `
            <div class="space-y-6">
                ${renderStatsSection(state)}
                ${renderTransactionSection(state)}
                ${renderRewardsSection(state)}
                ${renderReferralSection(state)}
            </div>
        `;

        console.log('Dashboard sections rendered');
        setupFormHandlers();
        emit('dashboard:rendered');

    } catch (error) {
        console.error('Error rendering dashboard:', error);
        container.innerHTML = renderErrorState();
    }
}

/**
 * Render statistics section
 * @param {Object} state Application state
 * @returns {string} HTML string
 */
function renderStatsSection(state) {
    console.log('Rendering stats section with state:', state.balance, state.rank);
    
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
                        <span class="text-gray-600">Available USDC</span>
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
                            <span class="text-gray-500">${rank.progress.toFixed(2)}%</span>
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
 * Render transaction section
 * @param {Object} state Application state
 * @returns {string} HTML string
 */
function renderTransactionSection(state) {
    console.log('Rendering transaction section...');
    
    return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Deposit USDC</h3>
                ${createTransactionForm({
                    type: 'deposit',
                    balance: state.balance.usdc,
                    minAmount: '0.01',
                    disabled: state.loading?.isLoading
                })}
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Withdraw USDC</h3>
                ${createTransactionForm({
                    type: 'withdraw',
                    balance: state.balance.deposits,
                    minAmount: '0.01',
                    disabled: state.loading?.isLoading
                })}
            </div>
        </div>
    `;
}

/**
 * Render rewards section
 * @param {Object} state Application state
 * @returns {string} HTML string
 */
function renderRewardsSection(state) {
    console.log('Rendering rewards section:', state.rewards);
    
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
                        ${Number(rewards.pending) === 0 ? 'disabled' : ''}
                    >
                        Claim Rewards
                    </button>
                    <button
                        onclick="handleClaimReferralRewards()"
                        class="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        ${Number(rewards.referral) === 0 ? 'disabled' : ''}
                    >
                        Claim Referral Rewards
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render referral section
 * @param {Object} state Application state
 * @returns {string} HTML string
 */
function renderReferralSection(state) {
    console.log('Rendering referral section:', state.referral);
    
    return `
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Referral Program</h3>
            <div class="space-y-4">
                <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="text-sm text-gray-600">Your Referral Code</div>
                    ${state.referral?.code ? `
                        <div class="mt-2 flex items-center space-x-2">
                            <code class="text-lg font-mono bg-white px-3 py-2 rounded border">${state.referral.code}</code>
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
                            class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
 * Render pre-connection message
 * @param {HTMLElement} container Container element
 */
function renderPreConnectionMessage(container) {
    container.innerHTML = `
        <div class="text-center py-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Welcome to EarnUSDC</h2>
            <p class="text-gray-600 mb-8">Connect your wallet to start earning high yields on your USDC deposits</p>
            <div class="flex justify-center space-x-4">
                <div class="flex items-center text-gray-600">
                    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Base Network</span>
                </div>
                <div class="flex items-center text-gray-600">
                    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>24% APR</span>
                </div>
                <div class="flex items-center text-gray-600">
                    <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Referral Rewards</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render error state
 * @returns {string} HTML string
 */
function renderErrorState() {
    return `
        <div class="text-center py-12">
            <div class="rounded-full bg-red-100 p-3 mx-auto w-12 h-12 mb-4">
                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
            <p class="text-gray-500 mb-4">There was a problem loading your dashboard. Please try refreshing the page.</p>
            <button
                onclick="window.location.reload()"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
                Refresh Page
            </button>
        </div>
    `;
}

/**
 * Get rank color class
 *// ui/dashboard.js
[前半部分は省略... 直前のコードの続きです]

/**
 * Get rank color class
 * @param {string} rank Rank name
 * @returns {string} Tailwind CSS classes
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
 * Setup form handlers
 */
function setupFormHandlers() {
    console.log('Setting up form handlers...');
    
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

/**
 * Handle deposit form submission
 * @param {Event} e Submit event
 */
async function handleDeposit(e) {
    e.preventDefault();
    console.log('Handling deposit submission...');

    const form = e.target;
    const amount = form.querySelector('input[name="amount"]').value;

    try {
        // Show confirmation modal
        const confirmed = await showModal({
            title: 'Confirm Deposit',
            content: `
                <div class="space-y-4">
                    <p>Are you sure you want to deposit ${formatUSDC(amount)} USDC?</p>
                    <div class="text-sm text-gray-500">
                        Please confirm this transaction in your wallet after clicking "Confirm"
                    </div>
                </div>
            `,
            type: 'confirm'
        });

        if (!confirmed) return;

        // Approve USDC spending if needed
        await approveUSDCSpending(amount);

        // Execute deposit
        const tx = await window.contract.methods
            .depositFunds(
                web3.utils.toWei(amount, 'mwei'),
                0  // referralCode (0 if none)
            )
            .send({ from: window.ethereum.selectedAddress });

        console.log('Deposit transaction:', tx);
        showAlert('Deposit successful!', 'success');
        
        // Refresh dashboard
        await updateDashboardData();

    } catch (error) {
        console.error('Deposit error:', error);
        showAlert(error.message || 'Failed to process deposit', 'error');
    }
}

/**
 * Handle withdraw form submission
 * @param {Event} e Submit event
 */
async function handleWithdraw(e) {
    e.preventDefault();
    console.log('Handling withdraw submission...');

    const form = e.target;
    const amount = form.querySelector('input[name="amount"]').value;

    try {
        // Show confirmation modal
        const confirmed = await showModal({
            title: 'Confirm Withdrawal',
            content: `
                <div class="space-y-4">
                    <p>Are you sure you want to withdraw ${formatUSDC(amount)} USDC?</p>
                    <div class="text-sm text-gray-500">
                        Please confirm this transaction in your wallet after clicking "Confirm"
                    </div>
                </div>
            `,
            type: 'confirm'
        });

        if (!confirmed) return;

        // Execute withdrawal
        const tx = await window.contract.methods
            .withdraw(web3.utils.toWei(amount, 'mwei'))
            .send({ from: window.ethereum.selectedAddress });

        console.log('Withdrawal transaction:', tx);
        showAlert('Withdrawal successful!', 'success');
        
        // Refresh dashboard
        await updateDashboardData();

    } catch (error) {
        console.error('Withdrawal error:', error);
        showAlert(error.message || 'Failed to process withdrawal', 'error');
    }
}

/**
 * Approve USDC spending
 * @param {string} amount Amount to approve
 */
async function approveUSDCSpending(amount) {
    const userAddress = window.ethereum.selectedAddress;
    const contractAddress = window.CONTRACT_ADDRESS;
    
    // Check current allowance
    const allowance = await window.usdcContract.methods
        .allowance(userAddress, contractAddress)
        .call();

    const requiredAmount = web3.utils.toWei(amount, 'mwei');
    
    if (BigInt(allowance) < BigInt(requiredAmount)) {
        console.log('Requesting USDC approval...');
        
        await window.usdcContract.methods
            .approve(contractAddress, requiredAmount)
            .send({ from: userAddress });
            
        console.log('USDC approval granted');
    }
}

/**
 * Update dashboard data
 */
async function updateDashboardData() {
    console.log('Updating dashboard data...');
    
    const userAddress = window.ethereum.selectedAddress;
    if (!userAddress) return;

    try {
        const [
            deposits,
            calculatedReward,
            usdcBalance,
            rankInfo
        ] = await Promise.all([
            window.contract.methods.deposits(userAddress).call(),
            window.contract.methods.calculateReward(userAddress).call(),
            window.usdcContract.methods.balanceOf(userAddress).call(),
            window.contract.methods.getUserRank(userAddress).call()
        ]);

        const rankProgress = Math.min(
            (Number(rankInfo.progressToNextRank) / 10000) * 100,
            100
        );

        updateState({
            balance: {
                usdc: web3.utils.fromWei(usdcBalance, 'mwei'),
                deposits: web3.utils.fromWei(deposits, 'mwei'),
                rewards: web3.utils.fromWei(calculatedReward, 'mwei')
            },
            rewards: {
                pending: web3.utils.fromWei(calculatedReward, 'mwei'),
                accumulated: '0',
                referral: '0'
            },
            rank: {
                current: rankInfo.rankName,
                bonus: Number(rankInfo.bonusRate) / 100,
                progress: rankProgress
            }
        });

        // Re-render dashboard
        renderDashboard();
        
    } catch (error) {
        console.error('Error updating dashboard data:', error);
        showAlert('Failed to update dashboard data', 'error');
    }
}

// Export functions for use in event handlers
window.handleClaimRewards = async function() {
    console.log('Handling reward claim...');
    try {
        const tx = await window.contract.methods
            .claimDepositReward()
            .send({ from: window.ethereum.selectedAddress });
        
        console.log('Claim rewards transaction:', tx);
        showAlert('Rewards claimed successfully!', 'success');
        await updateDashboardData();
        
    } catch (error) {
        console.error('Claim rewards error:', error);
        showAlert(error.message || 'Failed to claim rewards', 'error');
    }
};

window.handleClaimReferralRewards = async function() {
    console.log('Handling referral reward claim...');
    try {
        const tx = await window.contract.methods
            .claimReferralReward()
            .send({ from: window.ethereum.selectedAddress });
        
        console.log('Claim referral rewards transaction:', tx);
        showAlert('Referral rewards claimed successfully!', 'success');
        await updateDashboardData();
        
    } catch (error) {
        console.error('Claim referral rewards error:', error);
        showAlert(error.message || 'Failed to claim referral rewards', 'error');
    }
};

window.handleGenerateReferralCode = async function() {
    console.log('Generating referral code...');
    try {
        const tx = await window.contract.methods
            .generateReferralCode()
            .send({ from: window.ethereum.selectedAddress });
        
        console.log('Generate referral code transaction:', tx);
        showAlert('Referral code generated successfully!', 'success');
        await updateDashboardData();
        
    } catch (error) {
        console.error('Generate referral code error:', error);
        showAlert(error.message || 'Failed to generate referral code', 'error');
    }
};

window.copyReferralCode = async function(code) {
    try {
        await navigator.clipboard.writeText(code);
        showAlert('Referral code copied to clipboard!', 'success');
    } catch (error) {
        console.error('Failed to copy:', error);
        showAlert('Failed to copy referral code', 'error');
    }
};

export { renderDashboard, updateDashboardData };
