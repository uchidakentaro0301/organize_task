<div class="dashboard-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
    <h1>🔒 機密情報管理</h1>
    <button type="button" class="open-modal-btn" onclick="openConfidentialModal()" style="font-size: 0.8rem; height: 38px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
        <span class="icon">＋</span> 新規情報登録
    </button>
</div>

<div class="glass-modal" style="max-width: 100%; margin: 0 auto; padding: 25px;">
    <div style="overflow-x: auto;">
        <table class="cytech-table" style="width: 100%; color: rgb(0, 0, 0); border-collapse: collapse; font-size: 0.9rem;">
            <thead>
                <tr style="border-bottom: 2px solid rgba(0, 0, 0, 0.1); text-align: left; background: rgba(0, 0, 0, 0.05);">
                    <th style="padding: 15px;">サービス/サイト名</th>
                    <th style="padding: 15px;">ログインID</th>
                    <th style="padding: 15px;">パスワード</th>
                    <th style="padding: 15px;">備考</th>
                    <th style="padding: 15px; text-align: right;">操作</th>
                </tr>
            </thead>
            <tbody id="confidentialTableBody">
                </tbody>
        </table>
    </div>
</div>

<div id="confidentialModal" class="modal-overlay">
    <div class="glass-modal">
        <div class="modal-header">
            <h2 id="confidentialModalTitle">機密情報登録</h2>
            <button type="button" class="close-modal-btn" onclick="closeConfidentialModal()">&times;</button>
        </div>
        <div class="modal-body">
            <input type="hidden" id="confId">
            <div class="modal-section">
                <label>サービス/サイト名</label>
                <input type="text" id="confTitle" class="glass-input-field" placeholder="例: AWS, GitHubなど">
            </div>
            <div class="modal-section">
                <label>ログインID / メールアドレス</label>
                <input type="text" id="confLoginId" class="glass-input-field">
            </div>
            <div class="modal-section">
                <label>パスワード</label>
                <input type="password" id="confPassword" class="glass-input-field">
            </div>
            <div class="modal-section">
                <label>備考 (URLなど)</label>
                <textarea id="confNotes" rows="3" class="glass-input-field"></textarea>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="saveConfidentialInfo()" class="glass-submit-btn" style="background: #334155;">保存する</button>
            </div>
        </div>
    </div>
</div>

<script src="js/confidential.js"></script>