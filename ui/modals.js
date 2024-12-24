// ui/modals.js
import { emit } from '../core/events.js';

// モーダルの状態管理
const modalState = {
    activeModals: new Map(),
    zIndexCounter: 1000
};

/**
 * 基本的なモーダルの表示
 * @param {Object} options モーダルオプション
 * @returns {string} モーダルID
 */
export function showModal({
    title,
    content,
    type = 'default',
    closable = true,
    onClose,
    className = ''
}) {
    const modalId = `modal-${Date.now()}`;
    const zIndex = modalState.zIndexCounter++;

    const modalElement = document.createElement('div');
    modalElement.id = modalId;
    modalElement.className = `
        fixed inset-0 z-[${zIndex}]
        flex items-center justify-center
        bg-black bg-opacity-50
        transition-opacity duration-300
        ${className}
    `;

    modalElement.innerHTML = `
        <div class="modal-content bg-white rounded-lg shadow-xl max-w-lg w-full m-4 transform transition-all">
            ${title ? `
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                    ${closable ? `
                        <button class="modal-close text-gray-400 hover:text-gray-500">
                            <span class="sr-only">Close</span>
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    ` : ''}
                </div>
            ` : ''}
            <div class="px-6 py-4">
                ${content}
            </div>
        </div>
    `;

    // クリックイベントの設定
    modalElement.addEventListener('click', (e) => {
        if (closable && (e.target === modalElement || e.target.classList.contains('modal-close'))) {
            closeModal(modalId);
        }
    });

    // モーダル情報の保存
    modalState.activeModals.set(modalId, {
        element: modalElement,
        onClose,
        type
    });

    // DOMへの追加
    document.body.appendChild(modalElement);
    
    // アニメーション
    requestAnimationFrame(() => {
        modalElement.classList.add('opacity-100');
        modalElement.querySelector('.modal-content').classList.add('scale-100');
    });

    emit('modal:shown', { id: modalId, type });
    
    return modalId;
}

/**
 * プロセスモーダルの表示
 * @param {string} title タイトル
 * @param {string} description 説明
 * @returns {string} モーダルID
 */
export function showProcessModal(title, description) {
    return showModal({
        type: 'process',
        closable: false,
        className: 'process-modal',
        content: `
            <div class="text-center">
                <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <h3 class="mt-4 text-lg font-semibold text-gray-900">${title}</h3>
                <p class="mt-2 text-sm text-gray-500">${description}</p>
            </div>
        `
    });
}

/**
 * 確認モーダルの表示
 * @param {Object} options 確認モーダルオプション
 * @returns {Promise<boolean>} ユーザーの選択
 */
export function showConfirmModal({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonClass = 'bg-blue-500 hover:bg-blue-600',
    cancelButtonClass = 'bg-gray-100 hover:bg-gray-200'
}) {
    return new Promise((resolve) => {
        showModal({
            title,
            type: 'confirm',
            content: `
                <div class="text-gray-600 mb-6">${message}</div>
                <div class="flex justify-end space-x-3">
                    <button class="modal-cancel px-4 py-2 rounded text-gray-700 ${cancelButtonClass}">
                        ${cancelText}
                    </button>
                    <button class="modal-confirm px-4 py-2 rounded text-white ${confirmButtonClass}">
                        ${confirmText}
                    </button>
                </div>
            `,
            onClose: () => resolve(false)
        });

        // ボタンのイベントリスナー設定
        const modalElement = document.querySelector('.modal-content');
        modalElement.querySelector('.modal-confirm').onclick = () => {
            resolve(true);
            closeAllModals();
        };
        modalElement.querySelector('.modal-cancel').onclick = () => {
            resolve(false);
            closeAllModals();
        };
    });
}

/**
 * モーダルの更新
 * @param {string} modalId モーダルID
 * @param {Object} updates 更新内容
 */
export function updateModal(modalId, updates) {
    const modalInfo = modalState.activeModals.get(modalId);
    if (!modalInfo) return;

    const { element } = modalInfo;
    
    if (updates.title) {
        const titleElement = element.querySelector('.modal-content h3');
        if (titleElement) {
            titleElement.textContent = updates.title;
        }
    }

    if (updates.content) {
        const contentElement = element.querySelector('.modal-content > div:last-child');
        if (contentElement) {
            contentElement.innerHTML = updates.content;
        }
    }

    if (updates.className) {
        element.className = `
            fixed inset-0
            flex items-center justify-center
            bg-black bg-opacity-50
            transition-opacity duration-300
            ${updates.className}
        `;
    }

    emit('modal:updated', { id: modalId, updates });
}

/**
 * モーダルを閉じる
 * @param {string} modalId モーダルID
 */
export function closeModal(modalId) {
    const modalInfo = modalState.activeModals.get(modalId);
    if (!modalInfo) return;

    const { element, onClose } = modalInfo;

    // フェードアウトアニメーション
    element.classList.add('opacity-0');
    element.querySelector('.modal-content').classList.add('scale-95');

    setTimeout(() => {
        element.remove();
        modalState.activeModals.delete(modalId);
        
        if (typeof onClose === 'function') {
            onClose();
        }
        
        emit('modal:closed', { id: modalId });
    }, 300);
}

/**
 * すべてのモーダルを閉じる
 */
export function closeAllModals() {
    modalState.activeModals.forEach((_, modalId) => {
        closeModal(modalId);
    });
    emit('modal:all-closed');
}

/**
 * モーダルスタックの最上位を取得
 * @returns {string|null} モーダルID
 */
export function getTopModalId() {
    const modals = Array.from(modalState.activeModals.entries());
    return modals.length > 0 ? modals[modals.length - 1][0] : null;
}

/**
 * ESCキーでのモーダル閉じる機能の設定
 */
function setupEscapeKeyHandler() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const topModalId = getTopModalId();
            if (topModalId) {
                const modalInfo = modalState.activeModals.get(topModalId);
                if (modalInfo && modalInfo.type !== 'process') {
                    closeModal(topModalId);
                }
            }
        }
    });
}

// 初期化時にESCキーハンドラーを設定
setupEscapeKeyHandler();
