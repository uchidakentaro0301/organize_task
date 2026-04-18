// 1. 共通データ管理 (ここだけで宣言)
let tasks = JSON.parse(localStorage.getItem('myBacklogTasks')) || [];

const taskTemplates = [
  { id: "meeting", name: "📝 定例会議の準備", text: "定例会議：資料作成", detail: "・前回の議事録確認\n・アジェンダの送付" },
  { id: "report", name: "📊 週次レポート", text: "週次報告書の作成", detail: "・今週の成果集計\n・次週の予定策定" },
  { id: "bug", name: "🐛 バグ修正依頼", text: "【不具合】名称未設定", detail: "発生環境：\n再現手順：\n期待動作：" }
];

/**
 * Slack自動送信ロジックで使う
 * 最後に送信した「時」を記録して、同じ時間に何度も送らないようにする
 */
let lastAutoSentHour = null;

// 2. 初期化
document.addEventListener('DOMContentLoaded', () => {
  if (typeof render === 'function') render();
  if (typeof updateDashboard === 'function') updateDashboard();

  // テンプレートセレクトの初期化
  const ts = document.getElementById('template-selector');
  if (ts) {
    ts.innerHTML = taskTemplates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }

  // Slack URL復元
  const savedUrl = localStorage.getItem('slackWebhookUrl');
  if (savedUrl && document.getElementById('slackUrl')) {
    document.getElementById('slackUrl').value = savedUrl;
  }

  startTitleAnimation();

  // 1分ごとに時刻をチェックするタイマーを起動
  setInterval(checkAutoNotification, 60000);

  // 起動時にも一度チェック（ちょうど10時や17時に開いた場合のため）
  checkAutoNotification();
});

// 3. 共通ロジック
function saveAndSync() {
  localStorage.setItem('myBacklogTasks', JSON.stringify(tasks));
  if (typeof render === 'function') render();
  if (typeof updateDashboard === 'function') updateDashboard();
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

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const icon = document.getElementById('toggle-icon');
  sb.classList.toggle('collapsed');
  icon.innerText = sb.classList.contains('collapsed') ? '❯' : '❮';
}

function openTaskModal() {
  document.getElementById('taskModal').classList.add('active');
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;
  document.getElementById('taskInput').value = "";
  document.getElementById('taskDetail').value = "";
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
 * Webhook URLを保存する
 */
function saveSlackUrl() {
  const url = document.getElementById('slackUrl').value;
  localStorage.setItem('slackWebhookUrl', url);
  console.log("Slack URLを保存しました");
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
    // Slack WebhookへPOST送信
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Webhookの仕様に合わせて設定
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
  }
}

/**
 * =================================================================
 * Slack自動送信ロジック（平日10時・17時）
 * =================================================================
 */

/**
 * 現在時刻をチェックして、条件に合えば送信する
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

  // 3. 同じ時間に送信済みでないか確認（1分間に何度も実行されるのを防ぐ）
  if (isWeekday && isTargetHour && isTargetMinute) {
    if (lastAutoSentHour !== hours) {
      console.log(`自動通知を実行します: ${hours}時0分`);
      sendSlackNotification(); // 既存の送信関数を実行
      lastAutoSentHour = hours; // 送信済みとして時間を記録
    }
  }

  // 時間が変わったら記録をリセット（次の送信に備える）
  if (minutes !== 0) {
    lastAutoSentHour = null;
  }
}

/**
 * モーダルを開く（isTemplateMode が true ならテンプレート選択を表示）
 */
function openTaskModal(isTemplateMode = false) {
  const modal = document.getElementById('taskModal');
  const templateArea = document.getElementById('modalTemplateArea');
  const selector = document.getElementById('modal-template-selector');
  
  // 入力欄を初期化
  document.getElementById('taskInput').value = "";
  document.getElementById('taskDetail').value = "";
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('startDate').value = today;
  document.getElementById('endDate').value = today;

  if (isTemplateMode) {
      // テンプレートモード：選択エリアを表示し、セレクトボックスを初期化
      templateArea.style.display = "block";
      selector.value = ""; 
      document.getElementById('modalTitle').innerText = "テンプレートから作成";
      
      // セレクトボックスの中身を最新の taskTemplates から生成（未作成なら実行）
      selector.innerHTML = '<option value="">-- テンプレートを選んでください --</option>' + 
          taskTemplates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  } else {
      // 通常モード：選択エリアを隠す
      templateArea.style.display = "none";
      document.getElementById('modalTitle').innerText = "新しいタスクを登録";
  }

  modal.classList.add('active');
}

/**
* モーダル内のセレクトボックスが変わった時の処理
*/
function handleModalTemplateChange() {
  const selectedId = document.getElementById('modal-template-selector').value;
  const template = taskTemplates.find(t => t.id === selectedId);
  
  if (template) {
      // 選択されたテンプレートの内容を各入力欄に反映
      document.getElementById('taskInput').value = template.text;
      document.getElementById('taskDetail').value = template.detail;
      
      // 反映させたあとに少し光らせるような演出（任意）
      const fields = [document.getElementById('taskInput'), document.getElementById('taskDetail')];
      fields.forEach(f => {
          f.style.transition = "0.3s";
          f.style.backgroundColor = "#eef2ff";
          setTimeout(() => f.style.backgroundColor = "#fff", 300);
      });
  }
}

/**
 * Slack入力欄の編集ロックを切り替える
 */
function toggleSlackLock() {
  const input = document.getElementById('slackUrl');
  const btn = document.getElementById('slackLockBtn');

  if (input.disabled) {
      // ロック解除
      input.disabled = false;
      btn.innerText = '🔓';
      btn.title = "編集をロックする";
      btn.classList.add('unlocked');
      input.focus(); // すぐに編集できるようにフォーカス
  } else {
      // ロック
      input.disabled = true;
      btn.innerText = '🔒';
      btn.title = "編集ロックを解除";
      btn.classList.remove('unlocked');
  }
}

/**
* 初期化処理 (DOMContentLoaded内に追加)
*/
document.addEventListener('DOMContentLoaded', () => {
  // ...既存の処理...

  // Slack URLが既に入っているなら、編集不可の状態で表示する
  const savedUrl = localStorage.getItem('slackWebhookUrl');
  const slackInput = document.getElementById('slackUrl');
  if (savedUrl && slackInput) {
      slackInput.value = savedUrl;
      slackInput.disabled = true; // 確実にロック
  }
});

/**
* URLを保存したあとに自動でロックする設定（お好みで）
*/
function saveSlackUrl() {
  const url = document.getElementById('slackUrl').value;
  localStorage.setItem('slackWebhookUrl', url);
  
  // 保存したら自動でロックに戻す
  toggleSlackLock();
  console.log("Slack URLを保存し、ロックしました");
}