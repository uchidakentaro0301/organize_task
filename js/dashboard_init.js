/**
 * ダッシュボードのカード並び替え初期化と保存ロジック
 */
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.dashboard-grid');
    if (!grid) return;

    // 1. localStorage から保存された順序を読み込み、要素を再配置
    const savedOrder = localStorage.getItem('dashboard-card-order');
    if (savedOrder) {
        try {
            const orderArray = JSON.parse(savedOrder);
            orderArray.forEach(id => {
                const card = document.getElementById(id);
                if (card) {
                    grid.appendChild(card);
                }
            });
        } catch (e) {
            console.error("順序の読み込みに失敗しました:", e);
        }
    }

    // 2. SortableJS の初期化
    if (typeof Sortable !== 'undefined') {
        new Sortable(grid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function () {
                // 移動終了時に現在の順序（カードのIDリスト）を取得して保存
                const currentOrder = Array.from(grid.querySelectorAll('.stat-card'))
                    .map(card => card.id);
                localStorage.setItem('dashboard-card-order', JSON.stringify(currentOrder));
            }
        });
    } else {
        console.warn("SortableJS が読み込まれていません。");
    }
});