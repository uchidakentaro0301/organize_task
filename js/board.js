let activeTimers = {};
let pipVideo = null;
let pipCanvas = null;

/**
 * PiP（Picture-in-Picture）用の隠し要素を初期化する
 */
function initPipElements() {
    if (pipVideo) return;
    pipVideo = document.createElement('video');
    pipVideo.muted = true;
    pipVideo.autoplay = true;
    
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

/* ==========================================================================
   カテゴリー管理機能
   ========================================================================== */

/**
 * カテゴリー追加モーダルを開く
 */
function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.add('active');
    const input = document.getElementById('categoryInput');
    if (input) input.value = "";
}

/**
 * カテゴリー追加モーダルを閉じる
 */
function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.remove('active');
}

/**
 * 新規カテゴリーをサーバーに保存する
 */
async function saveCategory() {
    const name = document.getElementById('categoryInput').value;
    if (!name) return alert("カテゴリー名を入力してください");

    const response = await fetch('api.php?action=add_category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name })
    });

    if (response.ok) {
        closeCategoryModal();
        loadCategories(); // タスクモーダル用のセレクトボックスを更新
        alert("カテゴリーを追加しました");
    }
}

/**
 * カテゴリー一覧をサーバーから取得してセレクトボックスを更新する
 */
async function loadCategories() {
    const res = await fetch('api.php?action=fetch_categories');
    const categories = await res.json();
    const selector = document.getElementById('taskCategory');
    if (!selector) return;
    
    selector.innerHTML = '<option value="">-- カテゴリーを選択 --</option>';
    categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        selector.appendChild(opt);
    });
}

/* ==========================================================================
   タスク操作機能
   ========================================================================== */

/**
 * タスクの追加・更新処理
 */
async function addTask() {
    const taskId = document.getElementById('modalTaskId').value;
    const title = document.getElementById('taskInput').value;
    const categoryId = document.getElementById('taskCategory').value;

    if (!title) return alert("タスク名を入力してください");
    if (!categoryId) return alert("カテゴリーを選択してください（必須）");

    const data = {
        id: taskId,
        title: title,
        categoryId: categoryId,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        detail: document.getElementById('taskDetail').value
    };

    // 編集時はBacklog連携用のIDも取得
    if (taskId) {
        const assigneeEl = document.getElementById('modalBacklogAssignee');
        const typeEl = document.getElementById('modalBacklogType');
        if (assigneeEl) data.backlogAssigneeId = assigneeEl.value;
        if (typeEl) data.backlogIssueTypeId = typeEl.value;
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

/**
 * 編集モーダルを開く
 */
function openEditModal(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    openTaskModal(false); 
    
    const backlogArea = document.getElementById('modalBacklogArea');
    if (backlogArea) backlogArea.style.display = "block";

    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.innerText = "Edit Task (編集モード)";
    
    document.getElementById('modalTaskId').value = task.id;
    document.getElementById('taskInput').value = task.text;
    document.getElementById('taskDetail').value = task.detail || "";
    document.getElementById('startDate').value = task.startDate || "";
    document.getElementById('endDate').value = task.endDate || "";
    
    // カテゴリーのセット（データのロード完了を待つために少し遅延させる）
    setTimeout(() => {
        const catSelect = document.getElementById('taskCategory');
        if (catSelect) catSelect.value = task.categoryId || "";
    }, 150);

    const assigneeEl = document.getElementById('modalBacklogAssignee');
    const typeEl = document.getElementById('modalBacklogType');
    if (assigneeEl) assigneeEl.value = task.backlogAssigneeId || "";
    if (typeEl) typeEl.value = task.backlogIssueTypeId || "";

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.innerText = "Update Task (更新を保存)";
        submitBtn.onclick = addTask; 
    }
}

/**
 * かんばんボードの描画
 */
function render() {
    const columns = ['todo', 'doing', 'done'];
    columns.forEach(status => {
        const list = document.querySelector(`#${status} .task-list`);
        if (!list) return;
        list.innerHTML = '';

        const filteredTasks = tasks.filter(t => t.status === status);

        if (status === 'done') {
            // --- 完了カラム：カテゴリー別にフォルダー分け ---
            const grouped = {};
            filteredTasks.forEach(task => {
                const catName = task.categoryName || '未分類';
                if (!grouped[catName]) grouped[catName] = [];
                grouped[catName].push(task);
            });

            for (const catName in grouped) {
                const folder = document.createElement('div');
                folder.className = 'category-folder';
                
                const taskCardsHtml = grouped[catName].map(task => createCardHtml(task)).join('');

                folder.innerHTML = `
                    <div class="category-folder-header" onclick="this.nextElementSibling.style.display = (this.nextElementSibling.style.display === 'none' ? 'block' : 'none')">
                        <span>📂 ${escapeHTML(catName)} (${grouped[catName].length})</span>
                        <span style="font-size: 0.7rem;">クリックで開閉</span>
                    </div>
                    <div class="category-folder-content">
                        ${taskCardsHtml}
                    </div>
                `;
                list.appendChild(folder);
            }
        } else {
            // --- 未着手・進行中：通常表示 ---
            filteredTasks.forEach(task => {
                const cardWrapper = document.createElement('div');
                cardWrapper.innerHTML = createCardHtml(task);
                list.appendChild(cardWrapper.firstElementChild);
            });
        }
    });
}

/**
 * 共通のカードHTML生成関数（重複を避けるために分離）
 */
function createCardHtml(task) {
    const savedTime = task.totalTime || 0;
    return `
        <div class="task-card ${task.status}">
            <a class="task-edit-link" onclick="openEditModal('${task.id}')">編集</a>
            <div class="task-category-tag" style="font-size:0.65rem; color:#6366f1; font-weight:bold; margin-bottom:4px;">
                # ${escapeHTML(task.categoryName || '未分類')}
            </div>
            <div class="task-title">${escapeHTML(task.text)}</div>
            <div class="task-date-info">🗓️ ${task.startDate || '-'} 〜 ${task.endDate || '-'}</div>
            <div id="detail-${task.id}" class="task-detail">${escapeHTML(task.detail)}</div>
            ${task.detail ? `<span class="toggle-detail-btn" onclick="toggleDetail('${task.id}')" id="btn-toggle-${task.id}">もっと見る</span>` : ''}

            <div class="task-stopwatch liquidGlass-wrapper">
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
                <button class="btn-delete" onclick="deleteTask('${task.id}')">削除</button>
            </div>
        </div>
    `;
}

/**
 * ステータス更新 (進行中ならタイマー停止)
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
 * タスク削除
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
 * タイマー用秒フォーマット
 */
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
    
    initPipElements(); 

    const task = tasks.find(t => t.id == id);
    let currentTime = parseInt(task.totalTime || 0);
    
    const startBtn = document.getElementById(`start-btn-${id}`);
    const stopBtn = document.getElementById(`stop-btn-${id}`);
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;

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
 * タイマー停止（PiP終了を含む）
 */
async function stopTaskTimer(id) {
    if (!activeTimers[id]) return;
    clearInterval(activeTimers[id]);
    delete activeTimers[id];
    
    if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(() => {});
    }
    
    await saveTimerToDB(id);
    const startBtn = document.getElementById(`start-btn-${id}`);
    const stopBtn = document.getElementById(`stop-btn-${id}`);
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
}

/**
 * タイマー累積時間の保存
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
 * 詳細の開閉
 */
function toggleDetail(id) {
    const detailEl = document.getElementById(`detail-${id}`);
    const btnEl = document.getElementById(`btn-toggle-${id}`);
    if (!detailEl || !btnEl) return;
    if (detailEl.classList.contains('expanded')) {
        detailEl.classList.remove('expanded');
        btnEl.innerText = 'もっと見る';
    } else {
        detailEl.classList.add('expanded');
        btnEl.innerText = '閉じる';
    }
}

/**
 * タスクテンプレートの読み込み
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
 * モーダル内テンプレート変更処理
 */
function handleModalTemplateChange() {
    const selector = document.getElementById('modal-template-selector');
    if (!selector) return;
    const selectedOption = selector.options[selector.selectedIndex];
    if (selectedOption.value) {
        document.getElementById('taskInput').value = selectedOption.dataset.title || "";
        document.getElementById('taskDetail').value = selectedOption.dataset.detail || "";
    }
}

/**
 * テンプレート作成モードの起動
 */
function openTemplateCreateMode() {
    openTaskModal(false);
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.innerText = "新規テンプレート作成";
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
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
}

/**
 * タスク追加用の初期化（カテゴリー読み込みを追加）
 */
function openTaskModal(isTemplateMode = false) {
    const modal = document.getElementById('taskModal');
    if (!modal) return;
    
    // カテゴリー一覧を最新化
    loadCategories(); 
    modal.classList.add('active');
    
    // フィールドのリセット
    const taskIdField = document.getElementById('modalTaskId');
    const taskInput = document.getElementById('taskInput');
    const taskCat = document.getElementById('taskCategory');
    const taskDetail = document.getElementById('taskDetail');
    
    if (taskIdField) taskIdField.value = "";
    if (taskInput) taskInput.value = "";
    if (taskCat) taskCat.value = ""; // カテゴリー選択もリセット
    if (taskDetail) taskDetail.value = "";
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.innerText = "New Task";

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.innerText = "タスクを登録";
        submitBtn.onclick = addTask;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    if (startInput) startInput.value = today;
    if (endInput) endInput.value = today;

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