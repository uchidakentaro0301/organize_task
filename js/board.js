let activeTimers = {};
let pipVideo = null;
let pipCanvas = null;

/**
 * PiP用の隠し要素を初期化する (既存)
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
 * Canvasに現在のタイマー状態を描画してPiP映像を更新する (既存)
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
    ctx.font = 'bold 64px sans-serif'; 
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

/**
 * タスクの追加・更新
 * IDの有無によってAPIアクションを切り分けます
 */
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

    // 編集時はBacklog連携用のIDも取得
    if (taskId) {
        data.backlogAssigneeId = document.getElementById('modalBacklogAssignee').value;
        data.backlogIssueTypeId = document.getElementById('modalBacklogType').value;
    }

    // ★重要: IDがあれば edit_task、なければ add_task を呼び出す
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

/**
 * 編集モーダルを開く
 * 既存のタスク情報をプレースホルダーと値にセットします
 */
function openEditModal(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    // モーダルを開く（新規・編集共通の初期化を呼び出し）
    openTaskModal(false); 
    
    const backlogArea = document.getElementById('modalBacklogArea');
    if (backlogArea) backlogArea.style.display = "block";

    // モーダルタイトルとボタンの文言を「編集」用に変更
    const modalTitle = document.getElementById('modalTitle') || document.getElementById('modalHeaderTitle');
    if (modalTitle) modalTitle.innerText = "Edit Task (編集モード)";
    
    document.getElementById('modalTaskId').value = task.id; // IDを隠しフィールドに保持
    
    // 現在の値を入力欄にセットし、placeholderでも元の値を表示
    const taskInput = document.getElementById('taskInput');
    taskInput.value = task.text;
    taskInput.placeholder = "元の値: " + task.text;

    const taskDetail = document.getElementById('taskDetail');
    taskDetail.value = task.detail || "";
    taskDetail.placeholder = "元の値: " + (task.detail || "なし");

    document.getElementById('startDate').value = task.startDate || "";
    document.getElementById('endDate').value = task.endDate || "";
    
    if (document.getElementById('modalBacklogAssignee')) {
        document.getElementById('modalBacklogAssignee').value = task.backlogAssigneeId || "";
    }
    if (document.getElementById('modalBacklogType')) {
        document.getElementById('modalBacklogType').value = task.backlogIssueTypeId || "";
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "Update Task (更新を保存)";
    submitBtn.onclick = addTask; 
}

/**
 * 描画関数
 */
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

/**
 * ステータス更新 (既存)
 */
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

/**
 * 削除 (既存)
 */
async function deleteTask(id) {
    if (!confirm("このタスクを削除しますか？")) return;
    await fetch('api.php?action=delete_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    });
    loadTasksFromServer();
}

/**
 * 秒フォーマット (既存)
 */
function formatSeconds(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/**
 * タイマー開始（PiP起動を含む） (既存)
 */
function startTaskTimer(id) {
    if (activeTimers[id]) return;
    
    initPipElements(); 

    const task = tasks.find(t => t.id == id);
    let currentTime = parseInt(task.totalTime || 0);
    
    document.getElementById(`start-btn-${id}`).disabled = true;
    document.getElementById(`stop-btn-${id}`).disabled = false;

    pipVideo.play().then(() => {
        pipVideo.requestPictureInPicture().catch(err => {
            console.warn("PiP起動に失敗しました:", err);
        });
    });

    activeTimers[id] = setInterval(() => {
        currentTime++;
        const timeText = formatSeconds(currentTime);
        
        const timeDisplay = document.getElementById(`display-time-${id}`);
        if (timeDisplay) timeDisplay.innerText = timeText;
        
        updatePipCanvas(timeText, task.text);
    }, 1000);
}

/**
 * タイマー停止（PiP終了を含む） (既存)
 */
async function stopTaskTimer(id) {
    if (!activeTimers[id]) return;
    clearInterval(activeTimers[id]);
    delete activeTimers[id];
    
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
    }
    
    await saveTimerToDB(id);
    document.getElementById(`start-btn-${id}`).disabled = false;
    document.getElementById(`stop-btn-${id}`).disabled = true;
}

/**
 * タイマー時間の保存 (既存)
 */
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

/**
 * 詳細の開閉 (既存)
 */
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

/**
 * テンプレート読み込み (既存)
 */
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

/**
 * モーダル内テンプレート変更処理 (既存)
 */
function handleModalTemplateChange() {
    const selector = document.getElementById('modal-template-selector');
    const selectedOption = selector.options[selector.selectedIndex];
    if (selectedOption.value) {
        document.getElementById('taskInput').value = selectedOption.dataset.title || "";
        document.getElementById('taskDetail').value = selectedOption.dataset.detail || "";
    }
}

/**
 * テンプレート作成モード (既存)
 */
function openTemplateCreateMode() {
    openTaskModal(false);
    const modalTitle = document.getElementById('modalTitle') || document.getElementById('modalHeaderTitle');
    if (modalTitle) modalTitle.innerText = "新規テンプレート作成";
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "テンプレートを保存する";
    submitBtn.onclick = async function() {
        const name = prompt("テンプレート名を入力してください");
        if (!name) return;
        const data = { name: name, title: document.getElementById('taskInput').value, detail: document.getElementById('taskDetail').value };
        await fetch('api.php?action=add_template', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
        closeTaskModal();
        loadTemplates();
    };
}

/**
 * 新規タスク追加用の初期化
 * IDを空にし、UIをリセットしてモーダルを表示します
 */
function openTaskModal(isTemplateMode = false) {
    const modal = document.getElementById('taskModal');
    if (!modal) return;
    
    // モーダルを活性化
    modal.classList.add('active');
    
    // ★重要: 新規作成時はIDを空にし、UIをリセットする
    const taskIdField = document.getElementById('modalTaskId');
    if (taskIdField) taskIdField.value = "";

    const modalTitle = document.getElementById('modalTitle') || document.getElementById('modalHeaderTitle');
    if (modalTitle) modalTitle.innerText = "New Task";

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.innerText = "タスクを登録";
        submitBtn.onclick = addTask; // 登録用の関数を紐付け
    }
    
    // 入力欄の初期化
    document.getElementById('taskInput').value = "";
    document.getElementById('taskInput').placeholder = "タスク名を入力...";
    document.getElementById('taskDetail').value = "";
    document.getElementById('taskDetail').placeholder = "詳細を入力...";
    
    // 日付を当日にセット
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    document.getElementById('endDate').value = today;

    // Backlog設定エリアを隠す
    const backlogArea = document.getElementById('modalBacklogArea');
    if (backlogArea) backlogArea.style.display = "none";
}

/**
 * モーダルを閉じる
 */
function closeTaskModal() { 
    const modal = document.getElementById('taskModal');
    if (modal) modal.classList.remove('active'); 
}