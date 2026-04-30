let currentPeriodView = 'weekly'; // デフォルトの期間表示設定

/**
 * ダッシュボード全体の更新
 */
async function updateDashboard() {
    if (typeof tasks === 'undefined' || !tasks) return;

    // 1. 各種数値の計算
    const total = tasks.length;
    const remaining = tasks.filter(t => t.status !== 'done').length;
    const doneTasks = tasks.filter(t => t.status === 'done');
    const doneCount = doneTasks.length;
    const rate = total > 0 ? Math.round((doneCount / total) * 100) : 0;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const overdue = tasks.filter(t => t.status !== 'done' && t.endDate && t.endDate < todayStr).length;

    // 2. 作業密度の計算
    updateAverageWorkDensity(doneTasks);

    // 3. 数値統計の反映
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

    // 4. 分析データの更新
    await updateStatusDistribution();
    updateTimeRanking();
    renderPeriodTasks(); // 期間別実績リストの描画
}

/**
 * 作業密度の計算
 */
function updateAverageWorkDensity(doneTasks) {
    const avgDisplay = document.getElementById('average-task-time');
    if (!avgDisplay) return;

    const timedDoneTasks = doneTasks.filter(t => (t.totalTime || 0) > 0);
    
    if (timedDoneTasks.length === 0) {
        avgDisplay.innerText = "0s";
        return;
    }

    const totalSeconds = timedDoneTasks.reduce((sum, t) => sum + parseInt(t.totalTime), 0);
    const avgSeconds = Math.floor(totalSeconds / timedDoneTasks.length);

    avgDisplay.innerText = formatTaskTime(avgSeconds);
}

/**
 * 期間表示の切り替え関数
 */
function switchPeriodList(period) {
    currentPeriodView = period;
    
    // タブの見た目（activeクラス）を更新
    document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
    const activeTab = document.getElementById(`tab-${period}`);
    if (activeTab) activeTab.classList.add('active');
    
    // リストを再描画
    renderPeriodTasks();
}

/**
 * 期間別のタスクリストを描画
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
            // 今週（月曜始まり）
            const day = now.getDay() || 7;
            const monday = new Date(now);
            monday.setDate(now.getDate() - day + 1);
            monday.setHours(0,0,0,0);
            return taskDate >= monday;
        } else if (currentPeriodView === 'monthly') {
            // 当月
            return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
        } else if (currentPeriodView === 'quarterly') {
            // 今四半期
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

    // ソート（新しい順）
    filtered.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    
    container.innerHTML = filtered.map(t => `
        <div class="completed-item">
            <span class="completed-name">${escapeHTML(t.text)}</span>
            <span class="completed-time">${formatTaskTime(t.totalTime || 0)}</span>
        </div>
    `).join('');
}

/**
 * ステータス配分状況の描画（「進行中」「完了」の合計時間表示を統合）
 */
async function updateStatusDistribution() {
    const container = document.getElementById('status-distribution-container');
    if (!container) return;

    try {
        const response = await fetch('api.php?action=get_status_stats');
        const result = await response.json();

        if (result.success) {
            const data = result.data;

            // --- 追加：ステータス別の合計時間を反映 ---
            const doingTimeEl = document.getElementById('doing-total-time');
            if (doingTimeEl) doingTimeEl.innerText = formatTaskTime(data.doing_time || 0);

            const doneTimeEl = document.getElementById('done-total-time');
            if (doneTimeEl) doneTimeEl.innerText = formatTaskTime(data.done_time || 0);
            // ----------------------------------------

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
    } catch (e) { console.error("統計取得エラー:", e); }
}

/**
 * 時間消費ランキング (TOP 5)
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
        html += `
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; border-bottom: 1px solid rgba(0,0,0,0.03); padding-bottom: 4px;">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 65%; color: #475569;">
                    <span style="color: #6366f1; font-weight: bold; margin-right: 4px;">${index + 1}</span>
                    <span>${escapeHTML(t.text)}</span>
                </div>
                <div style="font-weight: bold; color: #1e1b4b; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
                    ${formatTaskTime(t.totalTime)}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

/**
 * 秒数を「○h ○m ○s」形式に変換
 */
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

/**
 * HTMLエスケープ
 */
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}