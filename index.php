<?php
require 'db.php'; 
// セッションが開始されていない場合は開始
if (session_status() === PHP_SESSION_NONE) { session_start(); }
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚙☁ 👀 My little Backlog</title>
    <link rel="icon" href="data:,">
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/board.css">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap" rel="stylesheet">
    <script src="https://accounts.google.com/gsi/client" async defer></script>

    <script>
    function handleCredentialResponse(response) {
        console.log("Google認証成功、サーバーへ送信中...");
        fetch('api.php?action=login_google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential })
        })
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        })
        .then(data => {
            if (data.success) {
                console.log("ログイン成功、画面をリロードします。");
                window.location.reload(); 
            } else {
                alert('ログインに失敗しました: ' + (data.message || '不明なエラー'));
            }
        })
        .catch(err => {
            console.error('Login error:', err);
            alert('サーバーとの通信に失敗しました。');
        });
    }

    // サイドバー切り替え等の基本関数
    function toggleSidebar() { document.getElementById('sidebar')?.classList.toggle('collapsed'); }
    function toggleSlackSettings() {
        const content = document.getElementById('slackContent');
        if (content) content.style.display = (content.style.display === 'none' || content.style.display === '') ? 'block' : 'none';
    }
    </script>

    <style>
        /* 期間別実績リスト用追加スタイル */
        .period-tab-container {
            display: flex;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            width: 100%;
        }
        .period-tab {
            flex: 1; padding: 12px; border: none; background: none; cursor: pointer;
            font-size: 0.8rem; font-weight: bold; color: #94a3b8; transition: 0.3s;
        }
        .period-tab.active {
            color: #6366f1; border-bottom: 2px solid #6366f1; background: rgba(99, 102, 241, 0.05);
        }
        .completed-task-container {
            width: 100%; max-height: 280px; overflow-y: auto;
        }
        .completed-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px 20px; border-bottom: 1px solid rgba(0, 0, 0, 0.03); font-size: 0.85rem;
        }
        .completed-name { color: #334155; text-align: left; flex: 1; font-weight: 500; }
        .completed-time { font-weight: bold; color: #6366f1; margin-left: 15px; font-family: monospace; }
    </style>
</head>
<body>

<?php if (!isset($_SESSION['user_id'])): ?>
    <div id="login-view">
        <canvas id="blackholeCanvas"></canvas>
        <div class="glass-orb orb-1"></div>
        <div class="glass-orb orb-2"></div>
        <div class="glass-login-card">
            <div class="login-header">
                <span class="login-logo-icon">🚙☁</span>
                <h1>管理しちゃう</h1>
                <p>Smart Task Management</p>
            </div>
            <div class="login-body">
                <div id="g_id_onload"
                     data-client_id="561494858012-hop2mqad9hts9ur2neqtnaei7uisjb7u.apps.googleusercontent.com"
                     data-callback="handleCredentialResponse"
                     data-auto_prompt="false">
                </div>
                <div class="google-btn-wrapper">
                    <div class="g_id_signin" data-type="standard" data-shape="pill" data-theme="outline" data-size="large" data-text="signin_with"></div>
                </div>
            </div>
            <div class="login-footer"><p>&copy; 2026 My Backlog Team</p></div>
        </div>
    </div>
    <script src="js/blackhole.js"></script>

<?php else: ?>

    <div class="app-container">
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="logo-area"><span class="logo-icon">📋</span><span class="logo-text">My Backlog</span></div>
                <button class="toggle-btn" onclick="toggleSidebar()"><span id="toggle-icon">❮</span></button>
            </div>
            <nav class="sidebar-nav">
                <button type="button" onclick="showView('board')" id="nav-board" class="nav-item active"><span class="icon">🗂️</span> <span class="nav-text">ボード</span></button>
                <button type="button" onclick="showView('dashboard')" id="nav-dashboard" class="nav-item"><span class="icon">📊</span> <span class="nav-text">ダッシュボード</span></button>
                <button type="button" onclick="showView('backlog')" id="nav-backlog" class="nav-item"><span class="icon">🚀</span> <span class="nav-text">Backlog</span></button>
                <button type="button" onclick="showView('recurring')" id="nav-recurring" class="nav-item"><span class="icon">🔄</span> <span class="nav-text">定期タスク</span></button>
            </nav>
            <div class="sidebar-footer">
                <div class="glass-collapsible">
                    <div class="slack-header" onclick="toggleSlackSettings()">
                        <div class="slack-title-combined"><span class="icon">🔗</span><span class="nav-text">Slack連携</span></div>
                        <span id="slackArrow" class="nav-text">▼</span>
                    </div>
                    <div id="slackContent" class="slack-body" style="display: none;">
                        <div class="slack-input-group">
                            <input type="password" id="slackUrl" class="glass-input" placeholder="Webhook URL" onchange="saveSlackUrl()" disabled>
                            <button id="slackLockBtn" class="glass-icon-btn" onclick="toggleSlackLock()">🔒</button>
                            <button type="button" class="glass-icon-btn action-test" onclick="sendSlackNotification()">🚀</button>
                        </div>
                    </div>
                </div>
                <button type="button" class="glass-action-btn danger" onclick="confirmReset()"><span class="icon">⚠️</span> <span class="nav-text">全リセット</span></button>
                <button type="button" onclick="location.href='logout.php'" class="glass-action-btn logout"><span class="icon">🚪</span> <span class="nav-text">ログアウト</span></button>
            </div>
        </aside>

        <main class="main-content">
            <div id="boardView" class="view active">
                <div class="top-action-area">
                    <button type="button" class="open-modal-btn" onclick="openTaskModal()"><span class="icon">＋</span> 新しいタスクを追加</button>
                    <div style="display: flex; gap: 2px;">
                        <button type="button" class="template-btn" onclick="openTaskModal(true)" style="border-radius: 14px 0 0 14px;"><span class="icon">📋</span> テンプレート</button>
                        <button type="button" class="template-btn" onclick="openTemplateCreateMode()" style="border-radius: 0 14px 14px 0; padding: 0 15px; background: #6366f1;"><span class="icon">＋</span></button>
                    </div>
                </div>
                <div class="board">
                    <div class="column" id="todo"><h2>未着手</h2><div class="task-list"></div></div>
                    <div class="column" id="doing"><h2>進行中</h2><div class="task-list"></div></div>
                    <div class="column" id="done"><h2>完了</h2><div class="task-list"></div></div>
                </div>
            </div>

            <div id="dashboardView" class="view">
                <div class="dashboard-header"><h1>ダッシュボード</h1></div>
                <div class="dashboard-grid">
                    <div class="stat-card">
                        <div class="stat-header"><h3>総タスク数</h3></div>
                        <div class="stat-body"><div id="total-count" class="stat-value">0</div></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header"><h3>作業密度 (平均)</h3></div>
                        <div class="stat-body"><div id="average-task-time" class="stat-value" style="font-size: 1.8rem;">0s</div></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header"><h3>残タスク</h3></div>
                        <div class="stat-body"><div id="remaining-count" class="stat-value">0</div></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header">
                            <h3>完了率</h3>
                            <div class="custom-select-wrapper">
                                <select id="period-selector" onchange="updateDashboard()">
                                    <option value="all">全期間</option>
                                    <option value="1w">直近1週間</option>
                                    <option value="1m">直近1ヶ月</option>
                                </select>
                            </div>
                        </div>
                        <div class="stat-body"><div id="progress-rate" class="stat-value">0%</div></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header"><h3>期限切れ</h3></div>
                        <div class="stat-body"><div id="overdue-count" class="stat-value">0</div></div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header"><h3>時間消費分析</h3></div>
                        <div class="stat-body" style="padding: 10px;">
                            <div id="time-ranking-container" class="placeholder-box"></div>
                        </div>
                    </div>

                    <div class="stat-card wide">
                        <div class="stat-header"><h3>🏁 完了タスク実績詳細</h3></div>
                        <div class="stat-body" style="padding: 0; align-items: stretch;">
                            <div class="period-tab-container">
                                <button onclick="switchPeriodList('weekly')" class="period-tab active" id="tab-weekly">今週</button>
                                <button onclick="switchPeriodList('monthly')" class="period-tab" id="tab-monthly">今月</button>
                                <button onclick="switchPeriodList('quarterly')" class="period-tab" id="tab-quarterly">四半期</button>
                            </div>
                            <div id="period-completed-list" class="completed-task-container">
                                </div>
                        </div>
                    </div>

                    <div class="stat-card wide">
                        <div class="stat-header"><h3>ステータス配分状況</h3></div>
                        <div class="stat-body">
                            <div id="status-distribution-container" class="placeholder-box"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="backlogView" class="view">
                <div class="dashboard-header"><h1>Direct Registration</h1></div>
                <div class="glass-modal" style="max-width: 600px; margin: 0 auto; padding: 30px;">
                    <div class="modal-section">
                        <label>Issue Type & Assignee</label>
                        <div class="modal-date-row" style="display: flex; gap: 10px;">
                            <select id="backlogViewType" class="glass-input-field"></select>
                            <select id="backlogViewAssignee" class="glass-input-field"></select>
                        </div>
                    </div>
                    <div class="modal-section"><label>Task Title</label><input type="text" id="backlogViewTitle" class="glass-input-field"></div>
                    <div class="modal-section"><label>Description</label><textarea id="backlogViewDetail" rows="5" class="glass-input-field"></textarea></div>
                    <button onclick="registerDirectBacklog()" class="glass-submit-btn" style="background:#00a497; margin-top: 20px;">🚀 Backlogに即時登録</button>
                </div>
            </div>

            <div id="recurringView" class="view">
                <div class="dashboard-header"><h1>定期タスク管理</h1><button type="button" class="open-modal-btn" onclick="openRecurringModal()" style="font-size: 0.8rem; height: 38px;">＋ 新規定期タスク</button></div>
                <div class="glass-modal" style="max-width: 1000px; margin: 0 auto; padding: 25px;"><div style="overflow-x: auto;"><table style="width: 100%; color: #f1f5f9; border-collapse: collapse;"><tbody id="recurringTableBody"></tbody></table></div></div>
            </div>
        </main>
    </div>

    <div id="taskModal" class="modal-overlay">
        <div class="glass-modal">
            <div class="modal-header"><h2>Task Editor</h2><button type="button" class="close-modal-btn" onclick="closeTaskModal()">&times;</button></div>
            <div class="modal-body">
                <input type="hidden" id="modalTaskId">
                <div id="modalBacklogArea" class="modal-section" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px;"><div class="modal-date-row" style="display: flex; gap: 10px;"><select id="modalBacklogType" class="glass-input-field"></select><select id="modalBacklogAssignee" class="glass-input-field"></select></div></div>
                <div class="modal-section"><label>Task Name</label><input type="text" id="taskInput" class="glass-input-field"></div>
                <div class="modal-section"><label>Schedule</label><div class="modal-date-row"><input type="date" id="startDate" class="glass-input-field"><span>→</span><input type="date" id="endDate" class="glass-input-field"></div></div>
                <div class="modal-section"><label>Details</label><textarea id="taskDetail" rows="4" class="glass-input-field"></textarea></div>
                <div class="modal-footer"><button type="button" id="submitBtn" onclick="addTask()" class="glass-submit-btn">Confirm Changes</button></div>
            </div>
        </div>
    </div>

    <script src="js/script.js"></script>
    <script src="js/board.js"></script>
    <script src="js/dashboard.js"></script>
<?php endif; ?>

<svg style="display: none;">
  <defs>
    <filter id="glass-distortion">
      <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="10" />
    </filter>
  </defs>
</svg>
</body>
</html>