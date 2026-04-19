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

  // 起動時にも一度チェック（ちょうど10時や17時に開いた場合のため）
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
  document.getElementById('nav-' + viewName).classList.add('active');
  if (viewName === 'dashboard' && typeof updateDashboard === 'function') {
    updateDashboard();
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
  
  // 1. モーダルを表示
  modal.classList.add('active');

  // 2. 編集用IDをクリア（新規登録状態にする）
  document.getElementById('modalTaskId').value = "";
  
  // 3. 【重要】ボタンの役割を「タスク登録」にリセット
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
      saveTemplateBtn.style.display = "none";
      loadTemplates();
  } else {
      document.getElementById('modalTemplateArea').style.display = "none";
      document.getElementById('modalTitle').innerText = "New Task";
      saveTemplateBtn.style.display = "block";
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
      f.style.backgroundColor = "#eef2ff";
      setTimeout(() => {
        f.style.backgroundColor = "#fff";
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

  // サイドバーが閉じているなら、まずサイドバーを開く
  if (sidebar.classList.contains('collapsed')) {
    toggleSidebar();
  }

  // 設定欄の開閉切り替え
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
    // ロック解除
    input.disabled = false;
    btn.innerText = '🔓';
    btn.title = "編集をロックする";
    btn.classList.add('unlocked');
    input.focus();
  } else {
    // ロック
    input.disabled = true;
    btn.innerText = '🔒';
    btn.title = "編集ロックを解除";
    btn.classList.remove('unlocked');
  }
}

/**
 * Webhook URLを保存する（保存後は自動でロック）
 */
function saveSlackUrl() {
  const url = document.getElementById('slackUrl').value;
  localStorage.setItem('slackWebhookUrl', url);
  toggleSlackLock();
  console.log("Slack URLを保存し、ロックしました");
}

/**
 * Slack通知を送信する
 */
async function sendSlackNotification() {
  const url = localStorage.getItem('slackWebhookUrl');
  if (!url) {
    alert("Slack Webhook URLが設定されていません。");
    return;
  }

  // 通知内容の構築（期限切れや今日のタスクなど）
  const today = new Date().toISOString().split('T')[0];
  const deadlineToday = tasks.filter(t => t.status !== 'done' && t.endDate === today);
  const overdue = tasks.filter(t => t.status !== 'done' && t.endDate && t.endDate < today);

  if (deadlineToday.length === 0 && overdue.length === 0) {
    alert("今日〆切、または期限切れのタスクはありません。通知は送信されません。");
    return;
  }

  let message = "🔔 *タスク状況のお知らせ*\n";
  if (overdue.length > 0) {
    message += "🚨 *期限切れ:* " + overdue.length + "件\n";
  }
  if (deadlineToday.length > 0) {
    message += "📅 *本日〆切:* " + deadlineToday.length + "件\n";
  }

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
    alert("通知の送信に失敗しました。URLを確認してください。");
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

/**
 * =================================================================
 * Slack自動送信ロジック（平日10時・17時）
 * =================================================================
 */
function checkAutoNotification() {
  const now = new Date();
  const day = now.getDay(); // 0:日, 1:月, ..., 6:土
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // 1. 平日（月〜金：1〜5）であることを確認
  const isWeekday = (day >= 1 && day <= 5);

  // 2. 指定の時間（10時または17時）且つ 0分 であることを確認
  const isTargetHour = (hours === 10 || hours === 17);
  const isTargetMinute = (minutes === 0);

  // 3. 同じ時間に送信済みでないか確認
  if (isWeekday && isTargetHour && isTargetMinute) {
    if (lastAutoSentHour !== hours) {
      console.log(`自動通知を実行します: ${hours}時0分`);
      sendSlackNotification();
      lastAutoSentHour = hours;
    }
  }

  // 時間が変わったら記録をリセット（次の送信に備える）
  if (minutes !== 0) {
    lastAutoSentHour = null;
  }
}