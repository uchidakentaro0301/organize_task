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

/**
 * dashboard.js - 分析機能の分離実装
 */

async function updateDashboard() {
    if (!tasks) return;

    // 基本数値の更新（総数、残数、完了率、期限切れ）
    const total = tasks.length;
    const remaining = tasks.filter(t => t.status !== 'done').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const rate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.status !== 'done' && t.endDate && t.endDate < todayStr).length;

    if (document.getElementById('total-count')) document.getElementById('total-count').innerText = total;
    if (document.getElementById('remaining-count')) document.getElementById('remaining-count').innerText = remaining;
    if (document.getElementById('progress-rate')) document.getElementById('progress-rate').innerText = rate + "%";
    
    const overEl = document.getElementById('overdue-count');
    if (overEl) {
        overEl.innerText = overdue;
        overEl.style.color = overdue > 0 ? "#ef4444" : "#4f46e5";
    }

    // 各分析枠の更新
    await updateStatusDistribution(); // ステータス配分枠
    updateTimeRanking();              // 時間消費分析枠（新規）
}

/**
 * 時間消費TOP5ランキングの描画（独立した枠用）
 */
function updateTimeRanking() {
    const container = document.getElementById('time-ranking-container');
    if (!container) return;

    // totalTime（秒）を保持しているタスクを降順ソート
    const rankedTasks = tasks
        .filter(t => (t.totalTime || 0) > 0)
        .sort((a, b) => b.totalTime - a.totalTime)
        .slice(0, 5);

    if (rankedTasks.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8; font-size:0.85rem;">計測データがありません</div>';
        return;
    }

    const maxTime = rankedTasks[0].totalTime;
    let html = `<div style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
                <p style="font-size:0.8rem; color:#64748b; margin-bottom:5px;">消費時間の多い上位5タスク</p>`;

    rankedTasks.forEach((t, index) => {
        const hours = (t.totalTime / 3600).toFixed(1);
        const percent = Math.max((t.totalTime / maxTime) * 100, 2);
        
        html += `
            <div class="ranking-item">
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 6px; color: #334155;">
                    <span style="font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 75%;">
                        ${index + 1}. ${escapeHTML(t.text)}
                    </span>
                    <span style="font-weight: bold; color: #4f46e5;">${hours}h</span>
                </div>
                <div style="background: #f1f5f9; height: 10px; border-radius: 5px; overflow: hidden; width: 100%;">
                    <div style="background: linear-gradient(90deg, #6366f1, #8b5cf6); width: ${percent}%; height: 100%; transition: width 1s ease;"></div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

/**
 * HTMLエスケープ用補助関数（安全のため）
 */
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}