/**
 * board.js - タスク操作ロジック
 */

// タスク追加
async function addTask() {
    const title = document.getElementById('taskInput').value;
    if (!title) return alert("タスク名を入力してください");

    const data = {
        text: title,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        detail: document.getElementById('taskDetail').value
    };

    const response = await fetch('api.php?action=add_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        closeTaskModal();
        loadTasksFromServer(); // 最新情報を再取得して描画
    }
}

// ステータス更新
async function updateStatus(id, newStatus) {
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

/**
 * 描画関数：カードの右上に編集ボタンを配置
 */
function render() {
    const columns = ['todo', 'doing', 'done'];
    columns.forEach(status => {
        const list = document.querySelector(`#${status} .task-list`);
        if (!list) return;
        list.innerHTML = '';

        // board.js の一部抜粋
        filteredTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${status}`;
            card.innerHTML = `
                <a class="task-edit-link" onclick="openEditModal('${task.id}')">編集</a>
                <div class="task-title">${escapeHTML(task.text)}</div>
                <div class="task-date-info">🗓️ ${task.startDate || '-'} 〜 ${task.endDate || '-'}</div>
                <div class="task-detail">${escapeHTML(task.detail)}</div>
                
                <div class="btn-group">
                    <button class="btn-todo" onclick="updateStatus('${task.id}', 'todo')">未</button>
                    <button class="btn-doing" onclick="updateStatus('${task.id}', 'doing')">中</button>
                    <button class="btn-done" onclick="updateStatus('${task.id}', 'done')">済</button>
                    <button class="btn-backlog-sync" onclick="syncToBacklog('${task.id}')">Backlogに追加</button>
                    <button class="btn-delete" onclick="deleteTask('${task.id}')">削</button>
                </div>
            `;
            list.appendChild(card);
        });
    });
}

/**
 * js/board.js
 * 編集モーダルを開く際も確実に登録機能を紐付ける
 */
function openEditModal(id) {
    const task = tasks.find(t => t.id == id);
    if (!task) return;

    // 通常のモーダルを開く処理を呼ぶ（これで初期化される）
    openTaskModal(false);
    
    // 編集用の設定に上書き
    document.getElementById('modalTitle').innerText = "Edit Task";
    document.getElementById('modalTaskId').value = task.id;
    document.getElementById('taskInput').value = task.text;
    document.getElementById('taskDetail').value = task.detail;
    document.getElementById('startDate').value = task.startDate;
    document.getElementById('endDate').value = task.endDate;
    
    // 編集時も「保存」は addTask 関数が（IDを判別して）担当する
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.innerText = "Update Task";
    submitBtn.onclick = addTask; 
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
        // データを要素に持たせておく
        opt.dataset.title = t.title;
        opt.dataset.detail = t.detail;
        selector.appendChild(opt);
    });
}

/**
 * テンプレート選択時の反映処理
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
 * テンプレート作成モードでモーダルを開く
 */
function openTemplateCreateMode() {
    openTaskModal(false);
    document.getElementById('modalTitle').innerText = "新規テンプレート作成";
    document.getElementById('saveTemplateBtn').style.display = "none"; // テンプレート作成中にテンプレート保存ボタンは出さない
    document.getElementById('submitBtn').innerText = "テンプレートを保存する";
    
    // submitBtnのonclickを一時的にテンプレート保存用に書き換える
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
 * js/board.js - タスクの描画処理
 */
function render() {
    const columns = ['todo', 'doing', 'done'];
    
    columns.forEach(status => {
        const list = document.querySelector(`#${status} .task-list`);
        if (!list) return;
        list.innerHTML = '';

        // 現在のステータスに該当するタスクをフィルタリング
        const filteredTasks = tasks.filter(t => t.status === status);

        filteredTasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${status}`;
            
            // task.text, task.startDate など、api.phpで指定した名前を使用
            card.innerHTML = `
                <a class="task-edit-link" onclick="openEditModal('${task.id}')">編集</a>
                <div class="task-title">${escapeHTML(task.text)}</div>
                <div class="task-date-info">🗓️ ${task.startDate || '未設定'} 〜 ${task.endDate || '未設定'}</div>
                <div class="task-detail">${escapeHTML(task.detail)}</div>
                
                <div class="btn-group">
                    <button class="btn-todo" onclick="updateStatus('${task.id}', 'todo')">未</button>
                    <button class="btn-doing" onclick="updateStatus('${task.id}', 'doing')">中</button>
                    <button class="btn-done" onclick="updateStatus('${task.id}', 'done')">済</button>
                    <button class="btn-backlog-sync" onclick="syncToBacklog('${task.id}')">Backlogに追加</button>
                    <button class="btn-delete" onclick="deleteTask('${task.id}')">削</button>
                </div>
            `;
            list.appendChild(card);
        });
    });
}