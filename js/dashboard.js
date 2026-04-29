/**
 * dashboard.js - 集計ロジック
 */

/**
 * ダッシュボード全体の数値を更新
 */
async function updateDashboard() {
    if (!tasks) return;

    const total = tasks.length;
    const remaining = tasks.filter(t => t.status !== 'done').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const rate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.status !== 'done' && t.endDate && t.endDate < todayStr).length;

    // 1. 各統計数値の反映
    const elements = {
        'total-count': total,
        'remaining-count': remaining,
        'progress-rate': rate + "%",
        'overdue-count': overdue
    };

    for (const [id, value] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = value;
            // 期限切れがある場合は赤文字にする
            if (id === 'overdue-count') {
                el.style.color = overdue > 0 ? "#ef4444" : "#4f46e5";
            }
        }
    }

    // 2. ステータス配分グラフ（バー）の更新
    await updateStatusDistribution();
}

/**
 * ステータス配分グラフの描画
 */
async function updateStatusDistribution() {
    try {
        const response = await fetch('api.php?action=get_status_stats');
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            // index.php で定義した ID または placeholder-box を取得
            const container = document.getElementById('status-distribution-container') || document.querySelector('.placeholder-box');
            if (!container) return;

            const total = data.total;
            const getPercent = (count) => total > 0 ? Math.round((count / total) * 100) : 0;

            const stats = [
                { label: '未着手', key: 'todo', color: '#3b82f6', count: data.todo },
                { label: '進行中', key: 'doing', color: '#ef4444', count: data.doing },
                { label: '完了済', key: 'done', color: '#eab308', count: data.done }
            ];

            let html = '<div style="width: 100%; padding: 10px;">';
            stats.forEach(s => {
                const percent = getPercent(s.count);
                html += `
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px; color: #475569;">
                            <span><strong>${s.label}</strong></span>
                            <span>${s.count} 件 (${percent}%)</span>
                        </div>
                        <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden; width: 100%;">
                            <div style="background: ${s.color}; width: ${percent}%; height: 100%; transition: width 0.5s ease;"></div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';

            container.innerHTML = html;
        }
    } catch (e) {
        console.error("統計データ取得エラー:", e);
    }
}