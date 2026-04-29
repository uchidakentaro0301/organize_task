/**
 * dashboard.js - 集計ロジック
 */
function updateDashboard() {
    const total = tasks.length;
    const remaining = tasks.filter(t => t.status !== 'done').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const rate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.status !== 'done' && t.endDate && t.endDate < todayStr).length;
    // 数値の反映
    if (document.getElementById('total-count')) document.getElementById('total-count').innerText = total;
    if (document.getElementById('remaining-count')) document.getElementById('remaining-count').innerText = remaining;
    if (document.getElementById('progress-rate')) document.getElementById('progress-rate').innerText = rate + "%";
    
    const overEl = document.getElementById('overdue-count');
    if (overEl) {
        overEl.innerText = overdue;
        overEl.style.color = overdue > 0 ? "#ef4444" : "#4f46e5";
    }
    // ステータス状況の更新
    const placeholder = document.querySelector('.placeholder-box');
    if (placeholder) {
        const todo = tasks.filter(t => t.status === 'todo').length;
        const doing = tasks.filter(t => t.status === 'doing').length;
        const done = tasks.filter(t => t.status === 'done').length;
        placeholder.innerHTML = `
            <div style="font-size:0.85rem; color:#475569; line-height:1.8; text-align:left;">
                <p>📝 未着手: <strong>${todo}</strong> 件</p>
                <p>⏳ 進行中: <strong>${doing}</strong> 件</p>
                <p>✅ 完了済: <strong>${done}</strong> 件</p>
            </div>`;
    }
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
            const container = document.querySelector('.placeholder-box');
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

// 既存の updateDashboard 関数内から呼び出すようにします
// (既存のコードを上書き、または追加してください)
const originalUpdateDashboard = updateDashboard;
updateDashboard = function() {
    originalUpdateDashboard();
    updateStatusDistribution();
};