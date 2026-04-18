/**
 * タスクの登録
 */
function addTask() {
    const title = document.getElementById('taskInput').value;
    if (!title) return alert("タスク名を入力してください");

    const newTask = {
        id: Date.now().toString(),
        text: title,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        detail: document.getElementById('taskDetail').value,
        status: 'todo'
    };

    tasks.push(newTask); // script.jsのグローバルなtasksを更新
    saveAndSync();       // 保存と画面更新
    closeTaskModal();    // モーダルを閉じる
}

/**
 * 描画 (render)
 */
function render() {
    const columns = ['todo', 'doing', 'done'];
    columns.forEach(status => {
        const listEl = document.querySelector(`#${status} .task-list`);
        if (!listEl) return;
        listEl.innerHTML = '';

        tasks.filter(t => t.status === status).forEach(task => {
            const card = document.createElement('div');
            card.className = `task-card ${status}`;
            card.innerHTML = `
                <div class="task-title">${escapeHTML(task.text)}</div>
                <div class="task-date-info">🗓️ ${task.startDate} 〜 ${task.endDate}</div>
                <div class="task-detail">${escapeHTML(task.detail)}</div>
                <div class="btn-group">
                    ${status !== 'todo' ? `<button onclick="updateStatus('${task.id}', 'todo')">未着手</button>` : ''}
                    ${status !== 'doing' ? `<button onclick="updateStatus('${task.id}', 'doing')">進行中</button>` : ''}
                    ${status !== 'done' ? `<button onclick="updateStatus('${task.id}', 'done')">完了</button>` : ''}
                    <button class="delete-btn" onclick="deleteTask('${task.id}')">削除</button>
                </div>
            `;
            listEl.appendChild(card);
        });
    });
}

function updateStatus(id, newStatus) {
    const t = tasks.find(x => x.id === id);
    if (t) { t.status = newStatus; saveAndSync(); }
}

function deleteTask(id) {
    if (confirm("削除しますか？")) {
        tasks = tasks.filter(x => x.id !== id);
        saveAndSync();
    }
}