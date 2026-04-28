/**
 * board.js - タスク操作ロジック (最新アップデート版)
 */

/**
 * タスク追加・更新
 * 新規作成時はBacklog情報を送らず、編集時のみBacklog設定を含める
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

    // 編集モード（taskIdがある場合）のみBacklog設定値をデータに含める
    if (taskId) {
        data.backlogAssigneeId = document.getElementById('modalBacklogAssignee').value;
        data.backlogIssueTypeId = document.getElementById('modalBacklogType').value;
    }

    // taskIdの有無でアクションを切り替え
    const action = taskId ? 'edit_task' : 'add_task';

    const response = await fetch(`api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        closeTaskModal();
        loadTasksFromServer(); // 最新情報を再取得して描画
    }
}

/**
 * 編集モーダルを開く
 * 編集時のみBacklog設定エリアを表示する
 */
function openEditModal(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    // モーダルを初期化して表示
    openTaskModal(false);
    
    // 編集時はBacklog設定エリア(modalBacklogArea)を表示
    const backlogArea = document.getElementById('modalBacklogArea');
    if (backlogArea) backlogArea.style.display = "block";

    document.getElementById('modalTitle').innerText = "Edit Task";
    document.getElementById('modalTaskId').value = task.id;
    document.getElementById('taskInput').value = task.text;
    document.getElementById('taskDetail').value = task.detail;
    document.getElementById('startDate').value = task.startDate;
    document.getElementById('endDate').value = task.endDate;
    
    // 保存されているBacklog設定をセレクトボックスに反映
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

/**
 * 描画関数
 * タスク詳細を1行制限し、詳細がある場合は「もっと見る」リンクを表示
 */
function render() {
    const columns = ['todo', 'doing', 'done'];
    
    columns.forEach(status => {
        const list = document.querySelector(`#${status} .task-list`);
        if (!list) return;
        list.innerHTML = '';

        // tasks 配列から現在のステータスに合うものを抽出
        const filteredTasks = tasks.filter(t => t.status === status);

        filteredTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${status}`;
            
            const detailText = task.detail ? escapeHTML(task.detail) : "";
            const hasDetail = task.detail && task.detail.trim().length > 0;

            card.innerHTML = `
                <a class="task-edit-link" onclick="openEditModal('${task.id}')">編集</a>
                <div class="task-title">${escapeHTML(task.text)}</div>
                <div class="task-date-info">🗓️ ${task.startDate || '未設定'} 〜 ${task.endDate || '未設定'}</div>
                
                <div id="detail-${task.id}" class="task-detail">${detailText}</div>
                
                ${hasDetail ? `<span class="toggle-detail-btn" onclick="toggleDetail('${task.id}')" id="btn-toggle-${task.id}">もっと見る</span>` : ''}
                
                <div class="btn-group">
                    <button class="btn-todo" onclick="updateStatus('${task.id}', 'todo')">未着手</button>
                    <button class="btn-doing" onclick="updateStatus('${task.id}', 'doing')">進行中</button>
                    <button class="btn-done" onclick="updateStatus('${task.id}', 'done')">完了</button>
                    <button class="btn-backlog-sync" onclick="syncToBacklog('${task.id}')">Backlogに追加</button>
                    <button class="btn-delete" onclick="deleteTask('${task.id}')">削除</button>
                </div>
            `;
            list.appendChild(card);
        });
    });
}

/**
 * 詳細の展開・折り畳みを切り替える関数
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
 * ステータス更新
 */
async function updateStatus(id, newStatus) {
    await fetch('api.php?action=update_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, status: newStatus })
    });
    loadTasksFromServer();
}

/**
 * 削除
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
 * テンプレート一覧をDBから読み込んでセレクトボックスに反映
 */
async function loadTemplates() {
    const res = await fetch('api.php?action=fetch_templates');
    const templates = await res.json();
    const selector = document.getElementById('modal-template-selector');
    
    if (!selector) return;
    
    selector.innerHTML = '<option value="">-- テンプレートを選んでください --</option>';
    templates.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.text = t.name;
        opt.dataset.title = t.title;
        opt.dataset.detail = t.detail;
        selector.appendChild(opt);
    });
}

/**
 * テンプレート作成モードでモーダルを開く
 */
function openTemplateCreateMode() {
    openTaskModal(false);
    document.getElementById('modalTitle').innerText = "新規テンプレート作成";
    document.getElementById('saveTemplateBtn').style.display = "none";
    document.getElementById('submitBtn').innerText = "テンプレートを保存する";
    
    document.getElementById('submitBtn').onclick = async function() {
        const name = prompt("テンプレート名を入力してください（例：週次報告）");
        if (!name) return;
        
        const data = {
            name: name,
            title: document.getElementById('taskInput').value,
            detail: document.getElementById('taskDetail').value
        };
        
        await fetch('api.php?action=add_template', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        
        closeTaskModal();
        loadTemplates(); // リスト更新
    };
}

/**
 * board.js - タスク操作ロジック (ストップウォッチ機能追加版)
 */

// 実行中のタイマーを管理するオブジェクト
let activeTimers = {};

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
            
            const detailText = task.detail ? escapeHTML(task.detail) : "";
            const hasDetail = task.detail && task.detail.trim().length > 0;
            const savedTime = task.totalTime || 0; // 秒数

            card.innerHTML = `
                <a class="task-edit-link" onclick="openEditModal('${task.id}')">編集</a>
                <div class="task-title">${escapeHTML(task.text)}</div>
                <div class="task-date-info">🗓️ ${task.startDate || '未設定'} 〜 ${task.endDate || '未設定'}</div>
                
                <div id="detail-${task.id}" class="task-detail">${detailText}</div>
                ${hasDetail ? `<span class="toggle-detail-btn" onclick="toggleDetail('${task.id}')" id="btn-toggle-${task.id}">もっと見る</span>` : ''}

                <div class="task-stopwatch">
                    <div class="timer-label">⏱️ 作業時間: <span id="display-time-${task.id}" class="timer-display">${formatSeconds(savedTime)}</span></div>
                    <div class="timer-controls">
                        <button id="start-btn-${task.id}" class="timer-btn start" onclick="startTaskTimer('${task.id}')">Start</button>
                        <button id="stop-btn-${task.id}" class="timer-btn stop" onclick="stopTaskTimer('${task.id}')" disabled>Stop</button>
                    </div>
                </div>
                
                <div class="btn-group">
                    <button class="btn-todo" onclick="updateStatus('${task.id}', 'todo')">未着手</button>
                    <button class="btn-doing" onclick="updateStatus('${task.id}', 'doing')">進行中</button>
                    <button class="btn-done" onclick="updateStatus('${task.id}', 'done')">完了</button>
                    <button class="btn-backlog-sync" onclick="syncToBacklog('${task.id}')">Backlogに追加</button>
                    <button class="btn-delete" onclick="deleteTask('${task.id}')">削除</button>
                </div>
            `;
            list.appendChild(card);
        });
    });
}

// 秒数を「〇分○○秒」形式に変換
function formatSeconds(s) {
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hours > 0) {
        return `${hours}時間${mins}分${secs}秒`;
    }
    return `${mins}分${secs}秒`;
}

// タイマー開始
function startTaskTimer(id) {
    if (activeTimers[id]) return; // 二重起動防止

    const task = tasks.find(t => t.id == id);
    let currentTime = task.totalTime || 0;

    document.getElementById(`start-btn-${id}`).disabled = true;
    document.getElementById(`stop-btn-${id}`).disabled = false;

    activeTimers[id] = setInterval(() => {
        currentTime++;
        document.getElementById(`display-time-${id}`).innerText = formatSeconds(currentTime);
    }, 1000);
}

// タイマー停止 & 保存
async function stopTaskTimer(id) {
    if (!activeTimers[id]) return;

    clearInterval(activeTimers[id]);
    delete activeTimers[id];

    // UI上の最終的な秒数を取得（文字列から解析するより、tasks配列内のデータと経過時間を管理するのが安全）
    // 今回は簡易的に、現在の表示時間を元にするか、activeTimers管理時にカウントを持つ。
    // 再描画で値が飛ばないよう、tasks内の値を更新してからサーバーへ送る。
    const displayEl = document.getElementById(`display-time-${id}`);
    // 文字列を解析して現在の秒数を逆算（またはカウント専用変数を保持）
    // ここでは簡略化のため、再読み込みして最新化する
    
    // 現在の秒数を特定するために、tasksの中身を一旦更新
    const timeStr = displayEl.innerText;
    // 計測が止まった時点の秒数を計算してサーバーに送る
    // (activeTimersにカウントを持たせる方が正確なので修正案として考慮)
    
    // 正確な秒数を反映するために全タスクを再ロード
    await saveTimerToDB(id);
    
    document.getElementById(`start-btn-${id}`).disabled = false;
    document.getElementById(`stop-btn-${id}`).disabled = true;
}

async function saveTimerToDB(id) {
    // 表示されている文字列から秒数を計算（1時間1分1秒 などの形式に対応）
    const displayStr = document.getElementById(`display-time-${id}`).innerText;
    let totalSeconds = 0;
    
    const hMatch = displayStr.match(/(\d+)時間/);
    const mMatch = displayStr.match(/(\d+)分/);
    const sMatch = displayStr.match(/(\d+)秒/);
    
    if (hMatch) totalSeconds += parseInt(hMatch[1]) * 3600;
    if (mMatch) totalSeconds += parseInt(mMatch[1]) * 60;
    if (sMatch) totalSeconds += parseInt(sMatch[1]);

    await fetch('api.php?action=update_task_time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, totalTime: totalSeconds })
    });
    
    // グローバル変数 tasks の該当タスクも更新
    const taskIndex = tasks.findIndex(t => t.id == id);
    if (taskIndex !== -1) tasks[taskIndex].totalTime = totalSeconds;
}