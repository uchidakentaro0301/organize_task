<?php
require 'db.php';
// エラー表示用（デバッグ時はコメントを外してください）
// ini_set('display_errors', 1);
// error_reporting(E_ALL);
?>
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚙☁ 👀 My little Backlog</title>
    <link rel="icon" href="data:,">
    <?php if (!isset($_SESSION['user_id'])): ?>
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <?php endif; ?>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/board.css">
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
            <div class="login-footer">
                <p>&copy; 2026 My Backlog Team</p>
            </div>
        </div>
    </div>
    <script src="js/blackhole.js"></script>

<?php else: ?>

    <div class="app-container">
        <aside class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <div class="logo-area">
                    <span class="logo-icon">📋</span>
                    <span class="logo-text">My Backlog</span>
                </div>
                <button class="toggle-btn" onclick="toggleSidebar()">
                    <span id="toggle-icon">❮</span>
                </button>
            </div>

            <nav class="sidebar-nav">
                <button type="button" onclick="showView('board')" id="nav-board" class="nav-item active">
                    <span class="icon">🗂️</span> <span class="nav-text">ボード</span>
                </button>
                <button type="button" onclick="showView('dashboard')" id="nav-dashboard" class="nav-item">
                    <span class="icon">📊</span> <span class="nav-text">ダッシュボード</span>
                </button>
                <button type="button" onclick="showView('backlog')" id="nav-backlog" class="nav-item">
                    <span class="icon">🚀</span> <span class="nav-text">Backlog</span>
                </button>
                <button type="button" onclick="showView('recurring')" id="nav-recurring" class="nav-item">
                    <span class="icon">🔄</span> <span class="nav-text">定期タスク</span>
                </button>
            </nav>

            <div class="sidebar-footer">
                <div class="glass-collapsible">
                    <div class="slack-header" onclick="toggleSlackSettings()">
                        <div class="slack-title-combined">
                            <span class="icon">🔗</span>
                            <span class="nav-text">Slack連携</span>
                        </div>
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

                <button type="button" class="glass-action-btn danger" onclick="confirmReset()">
                    <span class="icon">⚠️</span> <span class="nav-text">全リセット</span>
                </button>

                <button type="button" onclick="location.href='logout.php'" class="glass-action-btn logout">
                    <span class="icon">🚪</span> <span class="nav-text">ログアウト</span>
                </button>
            </div>
        </aside>

        <main class="main-content">
            <div id="boardView" class="view active">
                <div class="top-action-area">
                    <button type="button" class="open-modal-btn" onclick="openTaskModal()">
                        <span class="icon">＋</span> 新しいタスクを追加
                    </button>
                    <div style="display: flex; gap: 2px;">
                        <button type="button" class="template-btn" onclick="openTaskModal(true)" style="border-radius: 14px 0 0 14px;">
                            <span class="icon">📋</span> テンプレートから作成
                        </button>
                        <button type="button" class="template-btn" onclick="openTemplateCreateMode()" style="border-radius: 0 14px 14px 0; padding: 0 15px; background: #6366f1;">
                            <span class="icon">＋</span>
                        </button>
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
                        <div class="stat-header"><h3>全タスク</h3></div>
                        <div class="stat-body"><div id="total-count" class="stat-value">0</div></div>
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
                                    <option value="3m">直近3ヶ月</option>
                                    <option value="1y">直近1年</option>
                                </select>
                            </div>
                        </div>
                        <div class="stat-body">
                            <div id="progress-rate" class="stat-value">0%</div>
                            <div id="period-label" class="stat-subtext">全期間の統計</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-header"><h3>期限切れ</h3></div>
                        <div class="stat-body"><div id="overdue-count" class="stat-value">0</div></div>
                    </div>
                </div>
            </div>

            <div id="backlogView" class="view">
                <div class="dashboard-header"><h1>Direct Registration</h1></div>
                <div class="glass-modal" style="max-width: 600px; margin: 0 auto; padding: 30px;">
                    <div class="modal-section">
                        <label>Issue Type & Assignee</label>
                        <div class="modal-date-row" style="display: flex; gap: 10px;">
                            <select id="backlogViewType" class="glass-input-field">
                                <option value="">種別を取得中...</option>
                            </select>
                            <select id="backlogViewAssignee" class="glass-input-field">
                                <option value="">担当者を取得中...</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-section">
                        <label>Task Title</label>
                        <input type="text" id="backlogViewTitle" placeholder="課題のタイトルを入力" class="glass-input-field">
                    </div>
                    <div class="modal-section">
                        <label>Description</label>
                        <textarea id="backlogViewDetail" placeholder="詳細な説明を入力してください" rows="5" class="glass-input-field"></textarea>
                    </div>
                    <button onclick="registerDirectBacklog()" class="glass-submit-btn" style="background:#00a497; margin-top: 20px;">
                        🚀 Backlogに即時登録
                    </button>
                </div>
            </div>

            <div id="recurringView" class="view">
                <div class="dashboard-header">
                    <h1>定期タスク管理</h1>
                    <button type="button" class="open-modal-btn" onclick="openRecurringModal()" style="font-size: 0.8rem; height: 38px;">
                        ＋ 新規定期タスク
                    </button>
                </div>
                
                <div class="glass-modal" style="max-width: 1000px; margin: 0 auto; padding: 25px;">
                    <p style="font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-bottom: 20px;">
                        ※ここに登録したタスクは、平日の自動通知（10:00 / 17:00）の際にSlackへ送信されます。
                    </p>
                    
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; color: #f1f5f9; border-collapse: collapse; min-width: 700px;">
                            <thead>
                                <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); text-align: left; color: rgba(255,255,255,0.7);">
                                    <th style="padding: 15px; font-size: 0.9rem;">タイトル</th>
                                    <th style="padding: 15px; font-size: 0.9rem;">詳細</th>
                                    <th style="padding: 15px; font-size: 0.9rem;">備考(必要資料)</th>
                                    <th style="padding: 15px; width: 120px; text-align: right; font-size: 0.9rem;">操作</th>
                                </tr>
                            </thead>
                            <tbody id="recurringTableBody">
                                </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <div id="recurringModal" class="modal-overlay">
        <div class="glass-modal" style="max-width: 500px;">
            <div class="modal-header">
                <h2 id="recModalTitle">定期タスク登録</h2>
                <button type="button" class="close-modal-btn" onclick="closeRecurringModal()">&times;</button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="recTaskId" value="">
                <div class="modal-section">
                    <label>タイトル</label>
                    <input type="text" id="recTaskInput" class="glass-input-field" placeholder="例：月次報告の確認">
                </div>
                <div class="modal-section">
                    <label>詳細</label>
                    <textarea id="recTaskDetail" class="glass-input-field" rows="3" placeholder="タスクの具体的な手順など"></textarea>
                </div>
                <div class="modal-section">
                    <label>備考(必要資料)</label>
                    <textarea id="recTaskNotes" class="glass-input-field" rows="2" placeholder="例：共有フォルダのパス、参考ドキュメントなど"></textarea>
                </div>
                <button type="button" onclick="saveRecurringTask()" class="glass-submit-btn">保存する</button>
            </div>
        </div>
    </div>

    <div id="taskModal" class="modal-overlay">
        <div class="glass-modal">
            <div class="modal-header">
                <h2 id="modalTitle">Task Editor</h2>
                <button type="button" class="close-modal-btn" onclick="closeTaskModal()">&times;</button>
            </div>
            
            <div class="modal-body">
                <input type="hidden" id="modalTaskId" value="">

                <div id="modalBacklogArea" class="modal-section" style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
                    <label style="color: #00a497; font-weight: bold;">🛰️ Backlog Settings (Sync用)</label>
                    <div class="modal-date-row" style="display: flex; gap: 10px; margin-top: 8px;">
                        <select id="modalBacklogType" class="glass-input-field">
                            <option value="">種別を選択</option>
                        </select>
                        <select id="modalBacklogAssignee" class="glass-input-field">
                            <option value="">担当者を選択</option>
                        </select>
                    </div>
                </div>

                <div id="modalTemplateArea" class="modal-section" style="display: none; margin-top: 15px;">
                    <label>Template</label>
                    <div class="glass-select-wrapper">
                        <select id="modal-template-selector" onchange="handleModalTemplateChange()">
                            <option value="">-- Select Template --</option>
                        </select>
                    </div>
                </div>

                <div class="modal-section">
                    <label>Task Name</label>
                    <input type="text" id="taskInput" placeholder="何を実行しますか？" class="glass-input-field">
                </div>
                
                <div class="modal-section">
                    <label>Schedule</label>
                    <div class="modal-date-row">
                        <input type="date" id="startDate" class="glass-input-field">
                        <span class="date-separator">→</span>
                        <input type="date" id="endDate" class="glass-input-field">
                    </div>
                </div>
                
                <div class="modal-section">
                    <label>Details</label>
                    <textarea id="taskDetail" placeholder="メモ・詳細内容..." rows="4" class="glass-input-field"></textarea>
                </div>
                
                <div class="modal-footer">
                    <button type="button" id="submitBtn" onclick="addTask()" class="glass-submit-btn">
                        Confirm Changes
                    </button>
                    <button type="button" id="saveTemplateBtn" onclick="saveAsTemplate()" class="glass-sub-btn">
                        Save as Template
                    </button>
                </div>
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