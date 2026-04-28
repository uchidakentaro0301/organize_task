/**
 * board.js - 最新アップデート版 (ストップウォッチ保持機能付)
 */
let activeTimers = {};

async function addTask() {
    const taskId = document.getElementById('modalTaskId').value;
    const title = document.getElementById('taskInput').value;
    if (!title) return alert("タスク名を入力してください");
    const data = {
        id: taskId, title: title,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        detail: document.getElementById('taskDetail').value
    };
    if (taskId) {
        data.backlogAssigneeId = document.getElementById('modalBacklogAssignee').value;
        data.backlogIssueTypeId = document.getElementById('modalBacklogType').value;
    }
    const action = taskId ? 'edit_task' : 'add_task';
    await fetch(`api.php?action=${action}`, { method: 'POST', body: JSON.stringify(data) });
    closeTaskModal();
    loadTasksFromServer();
}

/**
 * ステータス更新: 移動前にタイマーが動いていれば保存する
 */
async function updateStatus(id, newStatus) {
    if (activeTimers[id]) {
        await stopTaskTimer(id); // 動いていれば止めて保存
    }
    await fetch('api.php?action=update_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, status: newStatus })
    });
    loadTasksFromServer();
}

function render() {
    const columns = ['todo', 'doing', 'done'];
    columns.forEach(status => {
        const list = document.querySelector(`#${status} .task-list`);
        if (!list) return;
        list.innerHTML = '';
        const filteredTasks = tasks.filter(t => t.status === status);

        filteredTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${status}`;
            const savedTime = task.totalTime || 0;

            card.innerHTML = `
                <a class="task-edit-link" onclick="openEditModal('${task.id}')">編集</a>
                <div class="task-title">${escapeHTML(task.text)}</div>
                <div class="task-date-info">🗓️ ${task.startDate || '-'} 〜 ${task.endDate || '-'}</div>
                <div id="detail-${task.id}" class="task-detail">${escapeHTML(task.detail)}</div>
                ${task.detail ? `<span class="toggle-detail-btn" onclick="toggleDetail('${task.id}')" id="btn-toggle-${task.id}">もっと見る</span>` : ''}

                <div class="task-stopwatch">
                    <div class="timer-label">⏱️ ${task.status === 'done' ? 'TOTAL TIME' : '作業時間'}: 
                        <span id="display-time-${task.id}" class="timer-display">${formatSeconds(savedTime)}</span>
                    </div>
                    <div class="timer-controls">
                        <button id="start-btn-${task.id}" class="timer-btn start" onclick="startTaskTimer('${task.id}')" ${task.status === 'done' ? 'disabled' : ''}>Start</button>
                        <button id="stop-btn-${task.id}" class="timer-btn stop" onclick="stopTaskTimer('${task.id}')" disabled>Stop</button>
                    </div>
                </div>
                
                <div class="btn-group">
                    <button class="btn-todo" onclick="updateStatus('${task.id}', 'todo')">未着手</button>
                    <button class="btn-doing" onclick="updateStatus('${task.id}', 'doing')">進行中</button>
                    <button class="btn-done" onclick="updateStatus('${task.id}', 'done')">完了</button>
                    <button class="btn-backlog-sync" onclick="syncToBacklog('${task.id}')">Backlog追加</button>
                    <button class="btn-delete" onclick="deleteTask('${task.id}')">削除</button>
                </div>
            `;
            list.appendChild(card);
        });
    });
}

function formatSeconds(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}時間${m}分${sec}秒` : `${m}分${sec}秒`;
}

function startTaskTimer(id) {
    if (activeTimers[id]) return;
    const task = tasks.find(t => t.id == id);
    let currentTime = parseInt(task.totalTime || 0);
    document.getElementById(`start-btn-${id}`).disabled = true;
    document.getElementById(`stop-btn-${id}`).disabled = false;

    activeTimers[id] = setInterval(() => {
        currentTime++;
        document.getElementById(`display-time-${id}`).innerText = formatSeconds(currentTime);
    }, 1000);
}

async function stopTaskTimer(id) {
    if (!activeTimers[id]) return;
    clearInterval(activeTimers[id]);
    delete activeTimers[id];
    await saveTimerToDB(id);
    document.getElementById(`start-btn-${id}`).disabled = false;
    document.getElementById(`stop-btn-${id}`).disabled = true;
}

async function saveTimerToDB(id) {
    const displayStr = document.getElementById(`display-time-${id}`).innerText;
    let totalSeconds = 0;
    const h = displayStr.match(/(\d+)時間/);
    const m = displayStr.match(/(\d+)分/);
    const s = displayStr.match(/(\d+)秒/);
    if (h) totalSeconds += parseInt(h[1]) * 3600;
    if (m) totalSeconds += parseInt(m[1]) * 60;
    if (s) totalSeconds += parseInt(s[1]);

    await fetch('api.php?action=update_task_time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, totalTime: totalSeconds })
    });
    const idx = tasks.findIndex(t => t.id == id);
    if (idx !== -1) tasks[idx].totalTime = totalSeconds;
}

// 他の関数(openEditModal, toggleDetail, deleteTask, templates系)は既存のまま維持