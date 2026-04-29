/**
 * dashboard.js - 集計・分析ロジック
 */

/**
 * ダッシュボード全体の数値を更新
 */
async function updateDashboard() {
    if (typeof tasks === 'undefined' || !tasks) return;

    // 1. 各種数値の計算
    const total = tasks.length;
    const remaining = tasks.filter(t => t.status !== 'done').length;
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const rate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.status !== 'done' && t.endDate && t.endDate < todayStr).length;

    // 2. 数値統計の反映
    const statsMap = {
        'total-count': total,
        'remaining-count': remaining,
        'progress-rate': rate + "%",
        'overdue-count': overdue
    };

    for (const [id, value] of Object.entries(statsMap)) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = value;
            if (id === 'overdue-count') {
                el.style.color = overdue > 0 ? "#ef4444" : "#4f46e5";
            }
        }
    }

    // 3. 分析データの更新
    await updateStatusDistribution();
    updateTimeRanking();
}

/**
 * ステータス配分グラフの描画
 */
async function updateStatusDistribution() {
    const container = document.getElementById('status-distribution-container');
    if (!container) return;

    try {
        const response = await fetch('api.php?action=get_status_stats');
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            const total = data.total;
            const getPercent = (count) => total > 0 ? Math.round((count / total) * 100) : 0;

            const stats = [
                { label: '未着手', color: '#3b82f6', count: data.todo },
                { label: '進行中', color: '#ef4444', count: data.doing },
                { label: '完了済', color: '#eab308', count: data.done }
            ];

            let html = '<div style="width: 100%; padding: 10px;">';
            stats.forEach(s => {
                const percent = getPercent(s.count);
                html += `
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px; color: #475569;">
                            <span><strong>${s.label}</strong></span>
                            <span>${s.count} 件 (${percent}%)</span>
                        </div>
                        <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden; width: 100%;">
                            <div style="background: ${s.color}; width: ${percent}%; height: 100%; transition: width 0.8s ease;"></div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        }
    } catch (e) { console.error("統計データ取得エラー:", e); }
}

/**
 * 時間消費ランキング (テキスト表示のみ・コンパクト版)
 */
function updateTimeRanking() {
    const container = document.getElementById('time-ranking-container');
    if (!container) return;

    const rankedTasks = tasks
        .filter(t => (t.totalTime || 0) > 0)
        .sort((a, b) => b.totalTime - a.totalTime)
        .slice(0, 5);

    if (rankedTasks.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:15px; color:#94a3b8; font-size:0.75rem;">データなし</div>';
        return;
    }

    let html = `<div style="display: flex; flex-direction: column; gap: 8px;">`;

    rankedTasks.forEach((t, index) => {
        const s = parseInt(t.totalTime);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        
        let timeParts = [];
        if (h > 0) timeParts.push(`${h}h`);
        if (m > 0) timeParts.push(`${m}m`);
        if (sec > 0 || timeParts.length === 0) timeParts.push(`${sec}s`);
        
        const timeStr = timeParts.join('');

        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; border-bottom: 1px solid rgba(0,0,0,0.03); padding-bottom: 4px;">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 65%; color: #475569;">
                    <span style="color: #6366f1; font-weight: bold; margin-right: 4px;">${index + 1}位</span>
                    <span>${escapeHTML(t.text)}</span>
                </div>
                <div style="font-weight: bold; color: #1e1b4b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
                    ${timeStr}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

// 共通エスケープ関数
if (typeof escapeHTML !== 'function') {
    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}