function updateDashboard() {
    const period = document.getElementById('period-selector')?.value || 'all';
    const now = new Date();
    let startDateLimit = null;

    // 1. 期間フィルタリング
    if (period !== 'all') {
        startDateLimit = new Date();
        if (period === '1w') startDateLimit.setDate(now.getDate() - 7);
        if (period === '1m') startDateLimit.setMonth(now.getMonth() - 1);
        if (period === '3m') startDateLimit.setMonth(now.getMonth() - 3);
        if (period === '1y') startDateLimit.setFullYear(now.getFullYear() - 1);
        startDateLimit.setHours(0, 0, 0, 0);
    }

    const filteredTasks = tasks.filter(t => {
        if (period === 'all') return true;
        if (!t.endDate) return false;
        return new Date(t.endDate) >= startDateLimit;
    });

    // 2. 数値計算
    const total = tasks.length;
    const remaining = tasks.filter(t => t.status !== 'done').length;
    const doneCountInPeriod = filteredTasks.filter(t => t.status === 'done').length;
    const progressRate = filteredTasks.length > 0 ? Math.round((doneCountInPeriod / filteredTasks.length) * 100) : 0;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = tasks.filter(t => t.status !== 'done' && t.endDate && t.endDate < todayStr).length;

    // 3. 表示反映
    if (document.getElementById('total-count')) document.getElementById('total-count').innerText = total;
    if (document.getElementById('remaining-count')) document.getElementById('remaining-count').innerText = remaining;
    if (document.getElementById('progress-rate')) document.getElementById('progress-rate').innerText = progressRate + "%";
    
    const overEl = document.getElementById('overdue-count');
    if (overEl) {
        overEl.innerText = overdueCount;
        overEl.style.color = overdueCount > 0 ? "#ef4444" : "#4f46e5";
    }

    const labelMap = { 'all':'全期間', '1w':'直近1週間', '1m':'直近1ヶ月', '3m':'直近3ヶ月', '1y':'直近1年' };
    if (document.getElementById('period-label')) document.getElementById('period-label').innerText = labelMap[period] + "の統計";

    const placeholder = document.querySelector('.placeholder-box');
    if (placeholder) {
        const todo = filteredTasks.filter(t => t.status === 'todo').length;
        const doing = filteredTasks.filter(t => t.status === 'doing').length;
        const done = filteredTasks.filter(t => t.status === 'done').length;
        placeholder.innerHTML = `<div style="font-size:0.8rem; color:#475569; line-height:1.6;">
            <p>📝 未着手: <strong>${todo}</strong> 件</p>
            <p>⏳ 進行中: <strong>${doing}</strong> 件</p>
            <p>✅ 完了済: <strong>${done}</strong> 件</p>
        </div>`;
    }
}