let currentPeriodView = 'weekly'; // デフォルトの期間表示設定

/**
 * ダッシュボード全体の更新
 */
async function updateDashboard() {
    if (typeof tasks === 'undefined' || !tasks) return;

    // 1. 基本数値の計算（タスク統計）
    const total = tasks.length;
    const remaining = tasks.filter(t => t.status !== 'done').length;
    const doneTasks = tasks.filter(t => t.status === 'done');
    const doneCount = doneTasks.length;
    const rate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.status !== 'done' && t.endDate && t.endDate < todayStr).length;

    // 2. 数値統計のDOM反映
    updateAverageWorkDensity(doneTasks);
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

    // 3. 各分析セクションの更新
    await updateStatusDistribution();   // ステータス配分
    await updateCategoryDistribution(); // カテゴリー別分布 [新規]
    await updateCyTechStats();           // CyTechユーザー完了人数 [新規]
    updateTimeRanking();                // 時間消費ランキング
    renderPeriodTasks();                // 期間別実績リスト（カテゴリー別）
}

/**
 * CyTechユーザー統計の更新
 * 週・月の完了人数、現在の対応人数を取得して反映
 */
async function updateCyTechStats() {
    try {
        const response = await fetch('api.php?action=get_cytech_stats');
        const data = await response.json();

        if (data.success) {
            if (document.getElementById('cy-week-done')) 
                document.getElementById('cy-week-done').innerText = data.weekDone;
            if (document.getElementById('cy-month-done')) 
                document.getElementById('cy-month-done').innerText = data.monthDone;
            if (document.getElementById('cy-doing-count')) 
                document.getElementById('cy-doing-count').innerText = data.doingCount;
        }
    } catch (e) { console.error("CyTech統計取得エラー:", e); }
}

/**
 * 期間別のタスクリストを描画（カテゴリー別にグループ化）
 */
function renderPeriodTasks() {
    const container = document.getElementById('period-completed-list');
    if (!container || typeof tasks === 'undefined') return;

    const now = new Date();
    const doneTasks = tasks.filter(t => t.status === 'done');

    const filtered = doneTasks.filter(t => {
        if (!t.endDate) return false;
        const taskDate = new Date(t.endDate);
        
        if (currentPeriodView === 'weekly') {
            const day = now.getDay() || 7;
            const monday = new Date(now);
            monday.setDate(now.getDate() - day + 1);
            monday.setHours(0,0,0,0);
            return taskDate >= monday;
        } else if (currentPeriodView === 'monthly') {
            return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
        } else if (currentPeriodView === 'quarterly') {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const taskQuarter = Math.floor(taskDate.getMonth() / 3);
            return currentQuarter === taskQuarter && taskDate.getFullYear() === now.getFullYear();
        }
        return false;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding:30px; color:#94a3b8; text-align:center; font-size:0.8rem;">完了したタスクはありません</div>';
        return;
    }

    // カテゴリー別にグループ化
    const grouped = {};
    filtered.forEach(task => {
        const catName = task.categoryName || '未分類';
        if (!grouped[catName]) grouped[catName] = [];
        grouped[catName].push(task);
    });

    let html = '';
    for (const catName in grouped) {
        grouped[catName].sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
        html += `
            <div class="category-folder" style="margin: 10px; border: 1px solid rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden;">
                <div style="background: rgba(0,0,0,0.03); color: #475569; padding: 10px 15px; font-size: 0.8rem; font-weight: bold; border-bottom: 1px solid rgba(0,0,0,0.05);">
                    📂 ${escapeHTML(catName)} (${grouped[catName].length} 件)
                </div>
                <div class="category-folder-content">
                    ${grouped[catName].map(t => `
                        <div class="completed-item">
                            <span class="completed-name">${escapeHTML(t.text)}</span>
                            <span class="completed-time">${formatTaskTime(t.totalTime || 0)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }
    container.innerHTML = html;
}

/**
 * カテゴリー別分布の描画
 */
async function updateCategoryDistribution() {
    const container = document.getElementById('category-distribution-container');
    if (!container) return;

    try {
        const response = await fetch('api.php?action=get_category_stats');
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            const total = data.reduce((sum, item) => sum + parseInt(item.count), 0);
            
            let html = '<div style="width: 100%; padding: 10px;">';
            if (data.length === 0) {
                html += '<div style="text-align:center; padding:15px; color:#94a3b8; font-size:0.75rem;">カテゴリーデータなし</div>';
            } else {
                data.forEach(item => {
                    const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
                    html += `
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px; color: #475569;">
                                <span><strong>${escapeHTML(item.name)}</strong></span>
                                <span>${item.count} 件 (${percent}%)</span>
                            </div>
                            <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden;">
                                <div style="background: #6366f1; width: ${percent}%; height: 100%; transition: width 0.8s ease;"></div>
                            </div>
                        </div>`;
                });
            }
            container.innerHTML = html + '</div>';
        }
    } catch (e) { console.error("カテゴリー統計取得エラー:", e); }
}

/**
 * ステータス配分状況の描画
 */
async function updateStatusDistribution() {
    const container = document.getElementById('status-distribution-container');
    if (!container) return;

    try {
        const response = await fetch('api.php?action=get_status_stats');
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            const doingTimeEl = document.getElementById('doing-total-time');
            if (doingTimeEl) doingTimeEl.innerText = formatTaskTime(data.doing_time || 0);
            const doneTimeEl = document.getElementById('done-total-time');
            if (doneTimeEl) doneTimeEl.innerText = formatTaskTime(data.done_time || 0);

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
                        <div style="background: #e2e8f0; height: 12px; border-radius: 6px; overflow: hidden;">
                            <div style="background: ${s.color}; width: ${percent}%; height: 100%; transition: width 0.8s ease;"></div>
                        </div>
                    </div>`;
            });
            container.innerHTML = html + '</div>';
        }
    } catch (e) { console.error("統計取得エラー:", e); }
}

/**
 * その他ユーティリティ関数
 */
function updateAverageWorkDensity(doneTasks) {
    const avgDisplay = document.getElementById('average-task-time');
    if (!avgDisplay) return;
    const timedDoneTasks = doneTasks.filter(t => (t.totalTime || 0) > 0);
    if (timedDoneTasks.length === 0) { avgDisplay.innerText = "0s"; return; }
    const totalSeconds = timedDoneTasks.reduce((sum, t) => sum + parseInt(t.totalTime), 0);
    avgDisplay.innerText = formatTaskTime(Math.floor(totalSeconds / timedDoneTasks.length));
}

function switchPeriodList(period) {
    currentPeriodView = period;
    document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
    if (document.getElementById(`tab-${period}`)) document.getElementById(`tab-${period}`).classList.add('active');
    renderPeriodTasks();
}

function updateTimeRanking() {
    const container = document.getElementById('time-ranking-container');
    if (!container) return;
    const rankedTasks = tasks.filter(t => (t.totalTime || 0) > 0).sort((a, b) => b.totalTime - a.totalTime).slice(0, 5);
    if (rankedTasks.length === 0) { container.innerHTML = '<div style="text-align:center; padding:15px; color:#94a3b8; font-size:0.75rem;">データなし</div>'; return; }
    let html = `<div style="display: flex; flex-direction: column; gap: 8px;">`;
    rankedTasks.forEach((t, index) => {
        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; border-bottom: 1px solid rgba(0,0,0,0.03); padding-bottom: 4px;">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 65%; color: #475569;">
                    <span style="color: #6366f1; font-weight: bold; margin-right: 4px;">${index + 1}</span>
                    <span>${escapeHTML(t.text)}</span>
                </div>
                <div style="font-weight: bold; color: #1e1b4b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">${formatTaskTime(t.totalTime)}</div>
            </div>`;
    });
    container.innerHTML = html + `</div>`;
}

function formatTaskTime(totalSeconds) {
    const s = parseInt(totalSeconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    let parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (sec > 0 || parts.length === 0) parts.push(`${sec}s`);
    return parts.join(' ');
}

function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function exportDashboardToCSV() {
    const stats = [
        ["ダッシュボード統計レポート", new Date().toLocaleString()],
        [],
        ["項目", "値"],
        ["総タスク数", document.getElementById('total-count')?.innerText || "0"],
        ["残タスク", document.getElementById('remaining-count')?.innerText || "0"],
        ["完了率", document.getElementById('progress-rate')?.innerText || "0%"],
        ["期限切れ", document.getElementById('overdue-count')?.innerText || "0"],
        ["作業密度 (平均)", document.getElementById('average-task-time')?.innerText || "0s"],
        ["進行中 合計時間", document.getElementById('doing-total-time')?.innerText || "0s"],
        ["完了 合計時間", document.getElementById('done-total-time')?.innerText || "0s"],
        [],
        ["CyTech週次完了", document.getElementById('cy-week-done')?.innerText || "0"],
        ["CyTech月次完了", document.getElementById('cy-month-done')?.innerText || "0"],
        ["CyTech現在対応", document.getElementById('cy-doing-count')?.innerText || "0"]
    ];

    const csvContent = stats.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dashboard_report_${new Date().toISOString().slice(0,10).replace(/-/g, "")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}