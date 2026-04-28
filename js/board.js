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