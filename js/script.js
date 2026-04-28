/**
 * script.js - アプリ全体の基盤 (整理済み最新版)
 */
let tasks = []; 
let lastAutoSentHour = null;

const taskTemplates = [
  { id: "meeting", name: "📝 会議の準備", text: "月次・週次・定例会議書名：", detail: "・前回の議事録確認\n\n・アジェンダの送付" },
  { id: "report", name: "📊 週次レポート", text: "週次報告書名：", detail: "・今週の成果集計\n\n・次週の予定策定" },
  { id: "bug", name: "🐛 バグ修正依頼", text: "不具合名：", detail: "発生環境：\n\n再現手順：\n\n期待動作：" },
  { id: "test", name: "📓 テストレビュー", text: "【氏名】", detail: "テスト内容：\n\nテスト結果：\n\nテスト改善：" }
];

// 1. 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.app-container')) {
    loadTasksFromServer();
    loadBacklogMasterData();
  }

  const ts = document.getElementById('template-selector');
  if (ts) {
    ts.innerHTML = taskTemplates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }

  const savedUrl = localStorage.getItem('slackWebhookUrl');
  const slackInput = document.getElementById('slackUrl');
  if (savedUrl && slackInput) {
    slackInput.value = savedUrl;
    slackInput.disabled = true;
  }

  startTitleAnimation();
  setInterval(checkAutoNotification, 60000);
  checkAutoNotification();
});

// 2. サーバーから最新のタスクを取得する
async function loadTasksFromServer() {
  try {
    const response = await fetch('api.php?action=fetch_tasks');
    tasks = await response.json();
    if (typeof render === 'function') render();
    if (typeof updateDashboard === 'function') updateDashboard();
  } catch (e) {
    console.error("データ取得エラー:", e);
  }
}

// 3. 画面切り替え制御
function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const targetView = document.getElementById(viewName + 'View');
  if (targetView) targetView.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.getElementById('nav-' + viewName);
  if (navItem) navItem.classList.add('active');

  if (viewName === 'recurring') loadRecurringTasks();
  if (viewName === 'backlog') loadBacklogMasterData();
  if (viewName === 'dashboard' && typeof updateDashboard === 'function') updateDashboard();
}

/**
 * 4. 定期タスク CRUD (タイトル・詳細・備考 3項目対応版)
 */
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
    // JSON文字列内のシングルクォート問題を回避
    const taskJson = JSON.stringify(t).replace(/'/g, "&apos;");
    return `
    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;">
      <td style="padding: 15px; color: #f1f5f9; vertical-align: top;">${escapeHTML(t.title)}</td>
      <td style="padding: 15px; color: rgba(241, 245, 249, 0.8); font-size: 0.8rem; vertical-align: top;">${escapeHTML(t.detail).replace(/\n/g, '<br>')}</td>
      <td style="padding: 15px; color: rgba(241, 245, 249, 0.6); font-size: 0.8rem; vertical-align: top;">${escapeHTML(t.notes).replace(/\n/g, '<br>')}</td>
      <td style="padding: 15px; text-align: right; white-space: nowrap; vertical-align: top;">
        <button onclick='openRecurringModal(${t.id}, ${taskJson})' class="glass-icon-btn" style="color:#818cf8; margin-right:8px; background: rgba(255,255,255,0.05);">編集</button>
        <button onclick="deleteRecurringTask(${t.id})" class="glass-icon-btn" style="color:#f87171; background: rgba(255,255,255,0.05);">削除</button>
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
  setTimeout(() => document.getElementById('recTaskInput').focus(), 100);
}

function closeRecurringModal() {
  const modal = document.getElementById('recurringModal');
  if (modal) modal.classList.remove('active');
}

async function saveRecurringTask() {
  const id = document.getElementById('recTaskId').value;
  const title = document.getElementById('recTaskInput').value;
  const detail = document.getElementById('recTaskDetail').value;
  const notes = document.getElementById('recTaskNotes').value;
  
  if (!title) return alert("タイトルを入力してください");

  const action = id ? 'edit_recurring_task' : 'add_recurring_task';
  await fetch(`api.php?action=${action}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id, title, detail, notes })
  });
  closeRecurringModal();
  loadRecurringTasks();
}

async function deleteRecurringTask(id) {
  if (!confirm("削除しますか？")) return;
  await fetch('api.php?action=delete_recurring_task', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ id })
  });
  loadRecurringTasks();
}

/**
 * 5. Backlog 連携機能
 */
async function syncToBacklog(id) {
  const task = tasks.find(t => t.id == id);
  if (!task || !task.backlogAssigneeId || !task.backlogIssueTypeId) {
    return alert("担当者と種別を先に設定して保存してください！");
  }

  const res = await fetch('api.php?action=sync_to_backlog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: task.text,
      detail: task.detail,
      startDate: task.startDate,
      endDate: task.endDate,
      assigneeId: task.backlogAssigneeId,
      issueTypeId: task.backlogIssueTypeId
    })
  });
  const result = await res.json();
  if (result.success) alert("🚀 Backlogへの同期が完了しました！");
}

async function registerDirectBacklog() {
  const title = document.getElementById('backlogViewTitle').value;
  const assigneeId = document.getElementById('backlogViewAssignee').value;
  const typeId = document.getElementById('backlogViewType').value;

  if (!title || !assigneeId || !typeId) {
    alert("必須項目を入力してください");
    return;
  }

  const data = {
    title: title,
    detail: document.getElementById('backlogViewDetail').value,
    assigneeId: assigneeId,
    issueTypeId: typeId,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  };

  try {
    const res = await fetch('api.php?action=sync_to_backlog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.success) {
      alert("Backlogに直接登録しました！");
      document.getElementById('backlogViewTitle').value = "";
      document.getElementById('backlogViewDetail').value = "";
    }
  } catch (e) {
    console.error("Backlog直接登録エラー:", e);
  }
}

/**
 * 6. 共通モーダル & 通知
 */
function openTaskModal(isTemplateMode = false) {
  const modal = document.getElementById('taskModal');
  const backlogArea = document.getElementById('modalBacklogArea');
  if (!modal) return;
  modal.classList.add('active');
  document.getElementById('modalTaskId').value = "";

  // 「新しいタスク」作成時は Backlog 設定を隠す
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

function closeTaskModal() {
  const modal = document.getElementById('taskModal');
  if (modal) modal.classList.remove('active');
}

async function sendSlackNotification() {
  const url = localStorage.getItem('slackWebhookUrl');
  if (!url) return;
  const today = new Date().toISOString().split('T')[0];
  const deadlineToday = tasks.filter(t => t.status !== 'done' && t.endDate === today);
  const overdue = tasks.filter(t => t.status !== 'done' && t.endDate && t.endDate < today);
  
  let recTasks = [];
  try {
    const recRes = await fetch('api.php?action=fetch_recurring_tasks');
    recTasks = await recRes.json();
  } catch (e) {
    console.error("定期タスク取得エラー:", e);
  }

  if (deadlineToday.length === 0 && overdue.length === 0 && recTasks.length === 0) return;

  let message = "🔔 *本日のタスク状況のお知らせ*\n";
  if (overdue.length > 0) message += "\n🚨 *【至急】期限切れ:* " + overdue.length + "件";
  if (deadlineToday.length > 0) message += "\n📅 *本日〆切:* " + deadlineToday.length + "件";
  
  if (recTasks.length > 0) {
    message += "\n\n🔄 *【定期ルーティン】*";
    recTasks.forEach(rt => {
        message += `\n・*${rt.title}*`;
        if(rt.detail) message += `\n　└ ${rt.detail.replace(/\n/g, '\n　　')}`;
    });
  }

  try {
    await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: message }) });
  } catch (e) {
    console.error("Slack送信エラー:", e);
  }
}

function checkAutoNotification() {
  const now = new Date();
  if (now.getDay() >= 1 && now.getDay() <= 5 && now.getMinutes() === 0 && (now.getHours() === 10 || now.getHours() === 17)) {
    if (lastAutoSentHour !== now.getHours()) {
      sendSlackNotification();
      lastAutoSentHour = now.getHours();
    }
  } else if (now.getMinutes() !== 0) {
    lastAutoSentHour = null;
  }
}

async function loadBacklogMasterData() {
  try {
    const [uRes, tRes] = await Promise.all([
      fetch('api.php?action=fetch_backlog_users'),
      fetch('api.php?action=fetch_backlog_types')
    ]);
    const users = await uRes.json();
    const types = await tRes.json();
    
    const update = (ids, data) => {
      if (!Array.isArray(data)) return;
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = data.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
      });
    };
    update(['modalBacklogAssignee', 'backlogViewAssignee'], users);
    update(['modalBacklogType', 'backlogViewType'], types);
  } catch (e) {
    console.error(e);
  }
}

/**
 * 7. ユーティリティ
 */
function startTitleAnimation() {
  const txt = " 🚙☁ 👀 🚙☁ 👀 ";
  let p = 0;
  setInterval(() => {
    document.title = txt.substring(p) + txt.substring(0, p);
    p = (p + 1) % txt.length;
  }, 400);
}

function escapeHTML(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (sb) sb.classList.toggle('collapsed');
}

function toggleSlackSettings() {
  const content = document.getElementById('slackContent');
  if (content) content.style.display = (content.style.display === 'none' || content.style.display === '') ? 'block' : 'none';
}

function toggleSlackLock() {
  const input = document.getElementById('slackUrl');
  if (input) input.disabled = !input.disabled;
}

function saveSlackUrl() {
  const input = document.getElementById('slackUrl');
  if (input) {
    localStorage.setItem('slackWebhookUrl', input.value);
    toggleSlackLock();
  }
}

function confirmReset() {
  if (confirm("全リセットしますか？")) {
    tasks = [];
    loadTasksFromServer();
  }
}