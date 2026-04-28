/**
 * board.js - タスク操作ロジック (復元・最新版)
 */
let activeTimers = {};

// タスクの追加・更新
async function addTask() {
    const taskId = document.getElementById('modalTaskId').value;
    const title = document.getElementById('taskInput').value;
    if (!title) return alert("タスク名を入力してください");

    const data = {
        id: taskId,
        title: title,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        detail: document.getElementById('taskDetail').value
    };

    // 編集時のみBacklog設定を含める
    if (taskId) {
        data.backlogAssigneeId = document.getElementById('modalBacklogAssignee').value;
        data.backlogIssueTypeId = document.getElementById('modalBacklogType').value;
    }

    const action = taskId ? 'edit_task' : 'add_task';
    const response = await fetch(`api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        closeTaskModal();
        loadTasksFromServer(); 
    }
}

// 編集モーダルを開く
function openEditModal(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    openTaskModal(false); // モーダルを初期化
    
    const backlogArea = document.getElementById('modalBacklogArea');
    if (backlogArea) backlogArea.style.display = "block";

    document.getElementById('modalTitle').innerText = "Edit Task";
    document.getElementById('modalTaskId').value = task.id;
    document.getElementById('taskInput').value = task.text;
    document.getElementById('taskDetail').value = task.detail;
    document.getElementById('startDate').value = task.startDate;
    document.getElementById('endDate').value = task.endDate;
    
    if (document.getElementById('modalBacklogAssignee')) {
        document.getElementById('modalBacklogAssignee').value = task.backlogAssigneeId || "";
    }
    if (document.getElementById('modalBacklogType')) {
        document.getElementById('modalBacklogType').value = task.backlogIssueTypeId || "";
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "Update Task";
    submitBtn.onclick = addTask; 
}

// 描画関数
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
                    <button class="btn-doing" onclick="updateStatus('${task.id}', 'doing')">処理中</button>
                    <button class="btn-done" onclick="updateStatus('${task.id}', 'done')">完了</button>
                    <button class="btn-backlog-sync" onclick="syncToBacklog('${task.id}')">Backlog追加</button>
                    <button class="btn-delete" onclick="deleteTask('${task.id}')">削除</button>
                </div>
            `;
            list.appendChild(card);
        });
    });
}

// ステータス更新
async function updateStatus(id, newStatus) {
    if (activeTimers[id]) {
        await stopTaskTimer(id); // 計測中なら保存
    }
    await fetch('api.php?action=update_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, status: newStatus })
    });
    loadTasksFromServer();
}

// 削除
async function deleteTask(id) {
    if (!confirm("このタスクを削除しますか？")) return;
    await fetch('api.php?action=delete_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    });
    loadTasksFromServer();
}

// 以下、ストップウォッチ・詳細開閉・テンプレート関連の関数
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

function toggleDetail(id) {
    const detailEl = document.getElementById(`detail-${id}`);
    const btnEl = document.getElementById(`btn-toggle-${id}`);
    if (detailEl.classList.contains('expanded')) {
        detailEl.classList.remove('expanded');
        btnEl.innerText = 'もっと見る';
    } else {
        detailEl.classList.add('expanded');
        btnEl.innerText = '閉じる';
    }
}

async function loadTemplates() {
    const res = await fetch('api.php?action=fetch_templates');
    const templates = await res.json();
    const selector = document.getElementById('modal-template-selector');
    if (!selector) return;
    selector.innerHTML = '<option value="">-- テンプレートを選んでください --</option>';
    templates.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id; opt.text = t.name;
        opt.dataset.title = t.title; opt.dataset.detail = t.detail;
        selector.appendChild(opt);
    });
}

function handleModalTemplateChange() {
    const selector = document.getElementById('modal-template-selector');
    const selectedOption = selector.options[selector.selectedIndex];
    if (selectedOption.value) {
        document.getElementById('taskInput').value = selectedOption.dataset.title || "";
        document.getElementById('taskDetail').value = selectedOption.dataset.detail || "";
    }
}

function openTemplateCreateMode() {
    openTaskModal(false);
    document.getElementById('modalTitle').innerText = "新規テンプレート作成";
    document.getElementById('saveTemplateBtn').style.display = "none";
    document.getElementById('submitBtn').innerText = "テンプレートを保存する";
    document.getElementById('submitBtn').onclick = async function() {
        const name = prompt("テンプレート名を入力してください");
        if (!name) return;
        const data = { name: name, title: document.getElementById('taskInput').value, detail: document.getElementById('taskDetail').value };
        await fetch('api.php?action=add_template', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        closeTaskModal();
        loadTemplates();
    };
}