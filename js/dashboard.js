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