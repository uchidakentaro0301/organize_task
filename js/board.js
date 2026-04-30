let activeTimers = {};
let pipVideo = null;
let pipCanvas = null;

/**
 * PiP用の隠し要素を初期化する
 */
function initPipElements() {
    if (pipVideo) return;
    // 映像を流すためのビデオ要素
    pipVideo = document.createElement('video');
    pipVideo.muted = true;
    pipVideo.autoplay = true;
    
    // 描画用のCanvas要素
    pipCanvas = document.createElement('canvas');
    pipCanvas.width = 400;  // PiPウィンドウの解像度
    pipCanvas.height = 200;
}

/**
 * Canvasに現在のタイマー状態を描画してPiP映像を更新する
 */
function updatePipCanvas(timeText, taskTitle) {
    if (!pipCanvas) return;
    const ctx = pipCanvas.getContext('2d');
    
    // 背景の描画 (深みのあるネイビー)
    ctx.fillStyle = '#1e1b4b'; 
    ctx.fillRect(0, 0, pipCanvas.width, pipCanvas.height);
    
    // タスク名の描画
    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.fillText(taskTitle.substring(0, 25), 30, 50);
    
    // タイマーの描画 (デジタルフォント風)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px sans-serif'; // フォントが読み込まれていない場合を考慮
    ctx.fillText(timeText, 30, 130);
    
    // ステータス表示
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('● RECORDING', 30, 170);

    // Canvasの内容をVideo要素のストリームとして設定
    if (pipVideo.srcObject === null) {
        pipVideo.srcObject = pipCanvas.captureStream(10); // 10 FPS
    }
}

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

    openTaskModal(false); 
    
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

                <div class="task-stopwatch liquidGlass-wrapper">
                    <div class="liquidGlass-effect"></div>
                    <div class="liquidGlass-tint"></div>
                    <div class="liquidGlass-shine"></div>
                    
                    <div class="timer-content-inner" style="z-index: 3; display: flex; width: 100%; align-items: center; gap: 10px;">
                        <div class="timer-display-container" style="flex: 1;">
                            <div class="timer-label" style="font-size: 0.5rem; font-weight: 800; color: rgba(0,0,0,0.4); margin-bottom: 2px;">● REC</div>
                            <div id="display-time-${task.id}" class="liquidGlass-text" style="font-family: 'Orbitron', monospace; font-size: 1.1rem; font-weight: 700; color: #000; text-align: center;">${formatSeconds(savedTime)}</div>
                        </div>
                        <div class="timer-controls" style="display: flex; flex-direction: column; gap: 2px;">
                            <button id="start-btn-${task.id}" class="timer-btn start" onclick="startTaskTimer('${task.id}')" ${task.status === 'done' ? 'disabled' : ''}>RUN</button>
                            <button id="stop-btn-${task.id}" class="timer-btn stop" onclick="stopTaskTimer('${task.id}')" disabled>STOP</button>
                        </div>
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
        await stopTaskTimer(id); 
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

// 秒フォーマット
function formatSeconds(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/**
 * タイマー開始（PiP起動を含む）
 */
function startTaskTimer(id) {
    if (activeTimers[id]) return;
    
    initPipElements(); // PiP要素の初期化

    const task = tasks.find(t => t.id == id);
    let currentTime = parseInt(task.totalTime || 0);
    
    document.getElementById(`start-btn-${id}`).disabled = true;
    document.getElementById(`stop-btn-${id}`).disabled = false;

    // PiPの起動（ユーザーのクリックイベント内で実行する必要があります）
    pipVideo.play().then(() => {
        pipVideo.requestPictureInPicture().catch(err => {
            console.warn("PiP起動に失敗しました（ブラウザ設定など）:", err);
        });
    });

    activeTimers[id] = setInterval(() => {
        currentTime++;
        const timeText = formatSeconds(currentTime);
        
        // 画面上の表示を更新
        const timeDisplay = document.getElementById(`display-time-${id}`);
        if (timeDisplay) timeDisplay.innerText = timeText;
        
        // PiPの映像（Canvas）を更新
        updatePipCanvas(timeText, task.text);
    }, 1000);
}

/**
 * タイマー停止（PiP終了を含む）
 */
async function stopTaskTimer(id) {
    if (!activeTimers[id]) return;
    clearInterval(activeTimers[id]);
    delete activeTimers[id];
    
    // PiPを終了
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
    }
    
    await saveTimerToDB(id);
    document.getElementById(`start-btn-${id}`).disabled = false;
    document.getElementById(`stop-btn-${id}`).disabled = true;
}

async function saveTimerToDB(id) {
    const displayEl = document.getElementById(`display-time-${id}`);
    if (!displayEl) return;
    
    const displayStr = displayEl.innerText;
    let totalSeconds = 0;
    const parts = displayStr.split(':').map(Number);
    
    if (parts.length === 3) {
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        totalSeconds = parts[0] * 60 + parts[1];
    }

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