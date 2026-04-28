/**
 * script.js - アプリ全体の基盤
 */
let tasks = []; // サーバーから取得したデータを保持する配列

const taskTemplates = [
  { id: "meeting", name: "📝 会議の準備", text: "月次・週次・定例会議書名：", detail: "・前回の議事録確認\n\n・アジェンダの送付" },
  { id: "report", name: "📊 週次レポート", text: "週次報告書名：", detail: "・今週の成果集計\n\n・次週の予定策定" },
  { id: "bug", name: "🐛 バグ修正依頼", text: "不具合名：", detail: "発生環境：\n\n再現手順：\n\n期待動作：" },
  { id: "test", name: "📓 テストレビュー", text: "【氏名】", detail: "テスト内容：\n\nテスト結果：\n\nテスト改善：" }
];

/**
 * Slack自動送信ロジックで使う
 * 最後に送信した「時」を記録して、同じ時間に何度も送らないようにする
 */
let lastAutoSentHour = null;

// 1. 初期化処理
document.addEventListener('DOMContentLoaded', () => {
  // ログイン済み（app-containerが存在する）場合のみタスクを読み込む
  if (document.querySelector('.app-container')) {
    loadTasksFromServer();
    loadBacklogMasterData();
  }

  // または showView 関数内（Backlogビューに切り替えた時）
function showView(viewName) {
  // ...既存の処理
  if (viewName === 'backlog' || viewName === 'board') {
    loadBacklogMasterData(); // ビュー切り替え時に最新情報を取得
  }
}

  // テンプレートセレクトの初期化
  const ts = document.getElementById('template-selector');
  if (ts) {
    ts.innerHTML = taskTemplates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }

  // Slack URL復元
  const savedUrl = localStorage.getItem('slackWebhookUrl');
  const slackInput = document.getElementById('slackUrl');
  if (savedUrl && slackInput) {
    slackInput.value = savedUrl;
    slackInput.disabled = true;
  }

  startTitleAnimation();

  // 1分ごとに時刻をチェックするタイマーを起動
  setInterval(checkAutoNotification, 60000);

  // 起動時にも一度チェック
  checkAutoNotification();
});

// 2. サーバーから最新のタスクを取得する
async function loadTasksFromServer() {
  try {
    const response = await fetch('api.php?action=fetch_tasks');
    const data = await response.json();

    // 取得したデータをグローバルのtasksにセット
    tasks = data;

    // 描画と統計の更新
    if (typeof render === 'function') render();
    if (typeof updateDashboard === 'function') updateDashboard();
  } catch (e) {
    console.error("データ取得エラー:", e);
  }
}

// 互換用: 既存呼び出しに対応
function saveAndSync() {
  localStorage.setItem('myBacklogTasks', JSON.stringify(tasks));
  if (typeof render === 'function') render();
  if (typeof updateDashboard === 'function') updateDashboard();
}

// 3. Googleログイン成功時の処理
async function handleCredentialResponse(response) {
  const res = await fetch('api.php?action=login_google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: response.credential })
  });
  const result = await res.json();
  if (result.success) {
    location.reload();
  }
}

// 4. UI制御
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const icon = document.getElementById('toggle-icon');
  sb.classList.toggle('collapsed');
  if (icon) {
    icon.innerText = sb.classList.contains('collapsed') ? '❯' : '❮';
  }
}

function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(viewName + 'View').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.getElementById('nav-' + viewName);
  if (navItem) navItem.classList.add('active');

  if (viewName === 'dashboard' && typeof updateDashboard === 'function') {
    updateDashboard();
  }
}

/**
 * モーダルを開く際の初期化処理
 */
function openTaskModal(isTemplateMode = false) {
  const modal = document.getElementById('taskModal');
  const submitBtn = document.getElementById('submitBtn');
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');

  // 1. モーダルを表示
  modal.classList.add('active');

  // 2. 編集用IDをクリア
  document.getElementById('modalTaskId').value = "";

  // 3. ボタンのリセット
  submitBtn.innerText = "タスク登録";
  submitBtn.onclick = addTask;

  // 4. 入力欄を空にする
  document.getElementById('taskInput').value = "";
  document.getElementById('taskDetail').value = "";
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;

  // 5. モードによる表示切り替え
  if (isTemplateMode) {
    document.getElementById('modalTemplateArea').style.display = "block";
    document.getElementById('modalTitle').innerText = "Template Selection";
    if (saveTemplateBtn) saveTemplateBtn.style.display = "none";
    loadTemplates();
  } else {
    document.getElementById('modalTemplateArea').style.display = "none";
    document.getElementById('modalTitle').innerText = "New Task";
    if (saveTemplateBtn) saveTemplateBtn.style.display = "block";
  }
}

function closeTaskModal() {
  document.getElementById('taskModal').classList.remove('active');
}

function applySelectedTemplate() {
  const id = document.getElementById('template-selector').value;
  const t = taskTemplates.find(x => x.id === id);
  if (t) {
    openTaskModal();
    document.getElementById('taskInput').value = t.text;
    document.getElementById('taskDetail').value = t.detail;
    document.getElementById('taskInput').focus();
  }
}

function handleModalTemplateChange() {
  const selectedId = document.getElementById('modal-template-selector').value;
  const template = taskTemplates.find(t => t.id === selectedId);

  if (template) {
    document.getElementById('taskInput').value = template.text;
    document.getElementById('taskDetail').value = template.detail;

    const fields = [document.getElementById('taskInput'), document.getElementById('taskDetail')];
    fields.forEach(f => {
      f.style.transition = "0.3s";
      f.style.backgroundColor = "rgba(238, 242, 255, 0.2)"; // グラス風に調整
      setTimeout(() => {
        f.style.backgroundColor = "transparent";
      }, 300);
    });
  }
}

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
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

/**
 * Slack設定の表示/非表示を切り替える
 */
function toggleSlackSettings() {
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('slackContent');
  const arrow = document.getElementById('slackArrow');

  if (sidebar.classList.contains('collapsed')) {
    toggleSidebar();
  }

  if (content.style.display === 'none' || content.style.display === '') {
    content.style.display = 'block';
    if (arrow) arrow.innerText = '▲';
  } else {
    content.style.display = 'none';
    if (arrow) arrow.innerText = '▼';
  }
}

/**
 * Slack入力欄の編集ロックを切り替える
 */
function toggleSlackLock() {
  const input = document.getElementById('slackUrl');
  const btn = document.getElementById('slackLockBtn');

  if (!input || !btn) return;

  if (input.disabled) {
    input.disabled = false;
    btn.innerText = '🔓';
    btn.title = "編集をロックする";
    btn.classList.add('unlocked');
    input.focus();
  } else {
    input.disabled = true;
    btn.innerText = '🔒';
    btn.title = "編集ロックを解除";
    btn.classList.remove('unlocked');
  }
}

function saveSlackUrl() {
  const url = document.getElementById('slackUrl').value;
  localStorage.setItem('slackWebhookUrl', url);
  toggleSlackLock();
  console.log("Slack URLを保存しました");
}

async function sendSlackNotification() {
  const url = localStorage.getItem('slackWebhookUrl');
  if (!url) {
    alert("Slack Webhook URLが設定されていません。");
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const deadlineToday = tasks.filter(t => t.status !== 'done' && t.endDate === today);
  const overdue = tasks.filter(t => t.status !== 'done' && t.endDate && t.endDate < today);

  if (deadlineToday.length === 0 && overdue.length === 0) {
    alert("今日〆切、または期限切れのタスクはありません。");
    return;
  }

  let message = "🔔 *タスク状況のお知らせ*\n";
  if (overdue.length > 0) message += "🚨 *期限切れ:* " + overdue.length + "件\n";
  if (deadlineToday.length > 0) message += "📅 *本日〆切:* " + deadlineToday.length + "件\n";

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
    alert("Slackに通知を送信しました！");
  } catch (e) {
    console.error("Slack送信エラー:", e);
    alert("通知の送信に失敗しました。");
  }
}

function confirmReset() {
  if (confirm("全てのタスクをリセットしますか？")) {
    tasks = [];
    saveAndSync();
    if (typeof render === 'function') render();
    if (typeof updateDashboard === 'function') updateDashboard();
  }
}

function checkAutoNotification() {
  const now = new Date();
  const day = now.getDay();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  const isWeekday = (day >= 1 && day <= 5);
  const isTargetHour = (hours === 10 || hours === 17);
  const isTargetMinute = (minutes === 0);

  if (isWeekday && isTargetHour && isTargetMinute) {
    if (lastAutoSentHour !== hours) {
      sendSlackNotification();
      lastAutoSentHour = hours;
    }
  }

  if (minutes !== 0) {
    lastAutoSentHour = null;
  }
}

/**
 * Backlogのマスターデータ読み込み
 */
async function loadBacklogMasterData() {
  try {
      const uRes = await fetch('api.php?action=fetch_backlog_users');
      const users = await uRes.json();

      const tRes = await fetch('api.php?action=fetch_backlog_types');
      const types = await tRes.json();

      // 取得したデータが配列であることを確認してから処理する
      const updateSelect = (ids, data) => {
          if (!Array.isArray(data)) {
              console.error("Backlogからのデータが配列ではありません:", data);
              return;
          }
          ids.forEach(id => {
              const el = document.getElementById(id);
              if (!el) return;
              el.innerHTML = data.map(item => `<option value="${item.id}">${item.name}</option>`).join('');
          });
      };

      updateSelect(['modalBacklogAssignee', 'backlogViewAssignee'], users);
      updateSelect(['modalBacklogType', 'backlogViewType'], types);
  } catch (e) {
      console.error("Backlogデータ取得失敗:", e);
  }
}

async function syncToBacklog(id) {
  const task = tasks.find(t => t.id == id);
  if (!task.backlogAssigneeId || !task.backlogIssueTypeId) {
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
      // フォームリセット等の処理
    }
  } catch (e) {
    console.error("Backlog直接登録エラー:", e);
  }
}

/**
 * js/script.js
 * モーダルを開く際の初期化処理を修正
 */
function openTaskModal(isTemplateMode = false) {
  const modal = document.getElementById('taskModal');
  const submitBtn = document.getElementById('submitBtn');
  const saveTemplateBtn = document.getElementById('saveTemplateBtn');
  const backlogArea = document.getElementById('modalBacklogArea'); // 追加

  modal.classList.add('active');
  document.getElementById('modalTaskId').value = "";

  // 「新しいタスク」作成時は Backlog 設定を隠す
  if (backlogArea) backlogArea.style.display = "none";

  submitBtn.innerText = "タスク登録";
  submitBtn.onclick = addTask;

  document.getElementById('taskInput').value = "";
  document.getElementById('taskDetail').value = "";
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;

  if (isTemplateMode) {
    document.getElementById('modalTemplateArea').style.display = "block";
    document.getElementById('modalTitle').innerText = "Template Selection";
    if (saveTemplateBtn) saveTemplateBtn.style.display = "none";
    loadTemplates();
  } else {
    document.getElementById('modalTemplateArea').style.display = "none";
    document.getElementById('modalTitle').innerText = "New Task";
    if (saveTemplateBtn) saveTemplateBtn.style.display = "block";
  }
}