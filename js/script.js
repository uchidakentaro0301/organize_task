let tasks = []; 
let lastAutoSentHour = null;

const taskTemplates = [
  { id: "meeting", name: "📝 会議の準備", text: "月次・週次・定例会議書名：", detail: "・前回の議事録確認\n\n・アジェンダの送付" },
  { id: "report", name: "📊 週次レポート", text: "週次報告書名：", detail: "・今週の成果集計\n\n・次週の予定策定" },
  { id: "bug", name: "🐛 バグ修正依頼", text: "不具合名：", detail: "発生環境：\n\n再現手順：\n\n期待動作：" },
  { id: "test", name: "📓 テストレビュー", text: "【氏名】", detail: "テスト内容：\n\nテスト結果：\n\nテスト改善：" }
];

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.app-container')) {
    loadTasksFromServer();
    loadBacklogMasterData();
  }
  const ts = document.getElementById('template-selector');
  if (ts) ts.innerHTML = taskTemplates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  
  const savedUrl = localStorage.getItem('slackWebhookUrl');
  if (savedUrl && document.getElementById('slackUrl')) {
    document.getElementById('slackUrl').value = savedUrl;
    document.getElementById('slackUrl').disabled = true;
  }
  startTitleAnimation();
  setInterval(checkAutoNotification, 60000);
  checkAutoNotification();
});

async function loadTasksFromServer() {
  try {
    const response = await fetch('api.php?action=fetch_tasks');
    tasks = await response.json();
    if (typeof render === 'function') render();
    if (typeof updateDashboard === 'function') updateDashboard();
  } catch (e) { console.error("データ取得エラー:", e); }
}

/**
 * 画面切り替え制御
 */
function showView(viewName) {
  // すべてのビューを非表示にする
  const views = document.querySelectorAll('.view');
  views.forEach(view => {
      view.classList.remove('active');
  });

  // すべてのナビゲーションアイテムから active クラスを削除
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
      item.classList.remove('active');
  });

  // 対象のビューを表示
  const targetView = document.getElementById(viewName + 'View');
  if (targetView) {
      targetView.classList.add('active');
  }

  // 対象のナビボタンをアクティブ化
  const targetNav = document.getElementById('nav-' + viewName);
  if (targetNav) {
      targetNav.classList.add('active');
  }

  // 各ビューに応じた初期化処理
  switch (viewName) {
      case 'board':
          if (typeof loadTasksFromServer === 'function') loadTasksFromServer();
          break;
      case 'dashboard':
          if (typeof updateDashboard === 'function') updateDashboard();
          break;
      case 'cytech_users':
          if (typeof loadCyTechUsers === 'function') loadCyTechUsers();
          break;
      case 'recurring':
          if (typeof loadRecurringTasks === 'function') loadRecurringTasks();
          break;
      case 'free_book':
          // メモ帳のデータをロード
          if (typeof loadFreeNote === 'function') {
              loadFreeNote();
          }
          break;
      case 'confidential':
          if (typeof loadConfidentialInfo === 'function') loadConfidentialInfo();
          break;
  }
}

/**
* 初期表示
*/
document.addEventListener('DOMContentLoaded', () => {
  // デフォルトはボードを表示
  showView('board');
});

/* ==========================================================================
   定期タスク管理
   ========================================================================== */
async function loadRecurringTasks() {
  const res = await fetch('api.php?action=fetch_recurring_tasks');
  const data = await res.json();
  const tbody = document.getElementById('recurringTableBody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="padding: 30px; text-align: center; color: rgba(255,255,255,0.3);">登録された定期タスクはありません</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(t => {
    const taskJson = JSON.stringify(t).replace(/'/g, "&apos;");
    return `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
      <td style="padding: 15px; color: #f1f5f9; vertical-align: top;">${escapeHTML(t.title)}</td>
      <td style="padding: 15px; color: rgba(241, 245, 249, 0.8); font-size: 0.8rem; vertical-align: top;">${escapeHTML(t.detail).replace(/\n/g, '<br>')}</td>
      <td style="padding: 15px; color: rgba(241, 245, 249, 0.6); font-size: 0.8rem; vertical-align: top;">${escapeHTML(t.notes).replace(/\n/g, '<br>')}</td>
      <td style="padding: 15px; text-align: right; white-space: nowrap; vertical-align: top;">
        <button onclick='openRecurringModal(${t.id}, ${taskJson})' class="glass-icon-btn" style="color:#818cf8; margin-right:8px;">編集</button>
        <button onclick="deleteRecurringTask(${t.id})" class="glass-icon-btn" style="color:#f87171;">削除</button>
      </td>
    </tr>
  `}).join('');
}

function openRecurringModal(id = null, task = null) {
  const modal = document.getElementById('recurringModal');
  if (!modal) return;
  modal.classList.add('active');
  document.getElementById('recTaskId').value = id || '';
  document.getElementById('recTaskInput').value = task ? task.title : '';
  document.getElementById('recTaskDetail').value = task ? task.detail : '';
  document.getElementById('recTaskNotes').value = task ? task.notes : '';
  document.getElementById('recModalTitle').innerText = id ? '定期タスク編集' : '定期タスク登録';
}

function closeRecurringModal() { document.getElementById('recurringModal').classList.remove('active'); }

async function saveRecurringTask() {
  const id = document.getElementById('recTaskId').value;
  const title = document.getElementById('recTaskInput').value;
  const detail = document.getElementById('recTaskDetail').value;
  const notes = document.getElementById('recTaskNotes').value;
  if (!title) return alert("タイトルを入力してください");
  const action = id ? 'edit_recurring_task' : 'add_recurring_task';
  await fetch(`api.php?action=${action}`, { method: 'POST', body: JSON.stringify({ id, title, detail, notes }) });
  closeRecurringModal();
  loadRecurringTasks();
}

async function deleteRecurringTask(id) {
  if (!confirm("削除しますか？")) return;
  await fetch('api.php?action=delete_recurring_task', { method: 'POST', body: JSON.stringify({ id }) });
  loadRecurringTasks();
}

/* ==========================================================================
   CyTech ユーザー管理 (CRUD)
   ========================================================================== */

// データの読み込み
async function loadCyTechUsers() {
  const res = await fetch('api.php?action=fetch_cytech_users');
  const users = await res.json();
  const tbody = document.getElementById('cytechUserTableBody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding: 30px; text-align: center; color: #94a3b8;">登録されたユーザーはいません</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => {
      const userJson = JSON.stringify(u).replace(/'/g, "&apos;");
      // ステータスに応じた背景色設定
      const statusBg = u.status === 'done' ? '#10b981' : '#f87171';
      
      return `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); color:rgb(0, 0, 0);">
          <td style="padding: 12px;">${escapeHTML(u.username)}</td>
          <td style="padding: 12px;">${escapeHTML(u.step)}</td>
          <td style="padding: 12px; text-align: center;">${u.count}</td>
          <td style="padding: 12px;">
              <select onchange="updateCyStatus(${u.id}, this.value)" 
                      style="background: ${statusBg}; 
                             color: #000000; 
                             border: 1px solid rgba(0,0,0,0.1); 
                             border-radius: 20px; 
                             padding: 4px 12px; 
                             font-weight: 800; 
                             font-size: 0.75rem; 
                             cursor: pointer; 
                             outline: none;
                             box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                             appearance: auto;">
                  <option value="doing" ${u.status === 'doing' ? 'selected' : ''} style="color: #000;">処理中</option>
                  <option value="done" ${u.status === 'done' ? 'selected' : ''} style="color: #000;">完了</option>
              </select>
          </td>
          <td style="padding: 12px;">${u.start_date || '-'}</td>
          <td style="padding: 12px;">${u.end_date || '-'}</td>
          <td style="padding: 12px; text-align: right; white-space: nowrap;">
              <button onclick='openEditCyUserModal(${userJson})' class="glass-icon-btn" style="color:#818cf8; margin-right:8px;">編集</button>
              <button onclick="deleteCyUser(${u.id})" class="glass-icon-btn" style="color:#f87171;">削除</button>
          </td>
      </tr>
  `}).join('');
}

// 登録モーダルを開く (リセット)
function openCyTechUserModal() {
  const modal = document.getElementById('cytechUserModal');
  if (!modal) return;
  modal.classList.add('active');
  document.getElementById('cyUserId').value = "";
  document.getElementById('cyUsername').value = "";
  document.getElementById('cyStep').value = "";
  document.getElementById('cyCount').value = "1";
  document.getElementById('cyStatus').value = "doing";
  document.getElementById('cyStartDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('cyEndDate').value = "";
  document.getElementById('cytechModalTitle').innerText = "新規ユーザー登録";
}

// 編集モーダルを開く
function openEditCyUserModal(user) {
  const modal = document.getElementById('cytechUserModal');
  if (!modal) return;
  modal.classList.add('active');
  document.getElementById('cyUserId').value = user.id;
  document.getElementById('cyUsername').value = user.username;
  document.getElementById('cyStep').value = user.step;
  document.getElementById('cyCount').value = user.count;
  document.getElementById('cyStatus').value = user.status;
  document.getElementById('cyStartDate').value = user.start_date;
  document.getElementById('cyEndDate').value = user.end_date;
  document.getElementById('cytechModalTitle').innerText = "ユーザー編集";
}

function closeCyTechUserModal() {
  document.getElementById('cytechUserModal').classList.remove('active');
}

// 保存処理 (新規登録と編集の共通)
async function saveCyTechUser() {
  const id = document.getElementById('cyUserId').value;
  const data = {
      id: id,
      username: document.getElementById('cyUsername').value,
      step: document.getElementById('cyStep').value,
      count: document.getElementById('cyCount').value,
      status: document.getElementById('cyStatus').value,
      startDate: document.getElementById('cyStartDate').value,
      endDate: document.getElementById('cyEndDate').value
  };
  
  if (!data.username) return alert("ユーザー名を入力してください");

  const action = id ? 'edit_cytech_user' : 'add_cytech_user';
  
  try {
    await fetch(`api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    closeCyTechUserModal();
    loadCyTechUsers();
  } catch (e) { console.error("保存エラー:", e); }
}

// ステータスの即時更新
async function updateCyStatus(id, newStatus) {
  await fetch('api.php?action=update_cytech_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, status: newStatus })
  });
  loadCyTechUsers(); 
}

// 削除処理
async function deleteCyUser(id) {
  if (!confirm("このユーザーを削除しますか？")) return;
  await fetch('api.php?action=delete_cytech_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
  });
  loadCyTechUsers();
}

/* ==========================================================================
   既存のユーティリティ・外部連携
   ========================================================================== */

function openTaskModal(isTemplateMode = false) {
  const modal = document.getElementById('taskModal');
  const backlogArea = document.getElementById('modalBacklogArea');
  if (!modal) return;
  modal.classList.add('active');
  document.getElementById('modalTaskId').value = "";
  if (backlogArea) backlogArea.style.display = "none";
  document.getElementById('submitBtn').innerText = "タスク登録";
  document.getElementById('submitBtn').onclick = addTask;
  document.getElementById('taskInput').value = "";
  document.getElementById('taskDetail').value = "";
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;

  if (isTemplateMode) {
    document.getElementById('modalTemplateArea').style.display = "block";
    document.getElementById('modalTitle').innerText = "Template Selection";
    if (typeof loadTemplates === 'function') loadTemplates();
  } else {
    document.getElementById('modalTemplateArea').style.display = "none";
    document.getElementById('modalTitle').innerText = "New Task";
  }
}

function closeTaskModal() { document.getElementById('taskModal').classList.remove('active'); }

async function sendSlackNotification() {
  const url = localStorage.getItem('slackWebhookUrl');
  if (!url) return;
  const today = new Date().toISOString().split('T')[0];
  const deadlineToday = tasks.filter(t => t.status !== 'done' && t.endDate === today);
  const overdue = tasks.filter(t => t.status !== 'done' && t.endDate && t.endDate < today);
  const recRes = await fetch('api.php?action=fetch_recurring_tasks');
  const recTasks = await recRes.json();

  if (deadlineToday.length === 0 && overdue.length === 0 && recTasks.length === 0) return;

  let message = "🔔 *本日のタスク状況のお知らせ*\n";
  if (overdue.length > 0) message += "\n🚨 *【至急】期限切れ:* " + overdue.length + "件";
  if (deadlineToday.length > 0) message += "\n📅 *本日〆切:* " + deadlineToday.length + "件";
  if (recTasks.length > 0) {
    message += "\n\n🔄 *【定期ルーティン】*";
    recTasks.forEach(rt => message += `\n・*${rt.title}*`);
  }
  try {
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: message }) });
  } catch (e) { console.error("Slack送信エラー:", e); }
}

function checkAutoNotification() {
  const now = new Date();
  if (now.getDay() >= 1 && now.getDay() <= 5 && now.getMinutes() === 0 && (now.getHours() === 10 || now.getHours() === 17)) {
    if (lastAutoSentHour !== now.getHours()) { sendSlackNotification(); lastAutoSentHour = now.getHours(); }
  } else if (now.getMinutes() !== 0) { lastAutoSentHour = null; }
}

async function loadBacklogMasterData() {
  try {
    const [uRes, tRes] = await Promise.all([fetch('api.php?action=fetch_backlog_users'), fetch('api.php?action=fetch_backlog_types')]);
    const users = await uRes.json();
    const types = await tRes.json();
    const update = (ids, data) => {
      if (!Array.isArray(data)) return;
      ids.forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = data.map(item => `<option value="${item.id}">${item.name}</option>`).join(''); });
    };
    update(['modalBacklogAssignee', 'backlogViewAssignee'], users);
    update(['modalBacklogType', 'backlogViewType'], types);
  } catch (e) { console.error(e); }
}

async function syncToBacklog(id) {
  const task = tasks.find(t => t.id == id);
  if (!task || !task.backlogAssigneeId || !task.backlogIssueTypeId) {
    return alert("担当者と種別を先に設定して保存してください！");
  }
  const res = await fetch('api.php?action=sync_to_backlog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: task.text, detail: task.detail, startDate: task.startDate, endDate: task.endDate, assigneeId: task.backlogAssigneeId, issueTypeId: task.backlogIssueTypeId })
  });
  const result = await res.json();
  if (result.success) alert("🚀 Backlogへの同期が完了しました！");
}

function startTitleAnimation() {
  const txt = " 🚙☁ 👀 🚙☁ 👀 "; let p = 0;
  setInterval(() => { document.title = txt.substring(p) + txt.substring(0, p); p = (p + 1) % txt.length; }, 400);
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }
function toggleSlackSettings() {
  const content = document.getElementById('slackContent');
  if (content) content.style.display = (content.style.display === 'none' || content.style.display === '') ? 'block' : 'none';
}
function toggleSlackLock() { document.getElementById('slackUrl').disabled = !document.getElementById('slackUrl').disabled; }
function saveSlackUrl() { localStorage.setItem('slackWebhookUrl', document.getElementById('slackUrl').value); toggleSlackLock(); }
function confirmReset() { if (confirm("全リセットしますか？")) { tasks = []; loadTasksFromServer(); } }