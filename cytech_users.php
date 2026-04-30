<div class="dashboard-header">
    <h1>CyTechユーザー管理</h1>
    <button type="button" class="open-modal-btn" onclick="openCyTechUserModal()" style="font-size: 0.8rem; height: 38px;">
        <span class="icon">＋</span> 新規ユーザー登録
    </button>
</div>

<div class="glass-modal" style="max-width: 100%; margin: 0 auto; padding: 25px;">
    <div style="overflow-x: auto;">
        <table class="cytech-table" style="width: 100%; color:rgb(0, 0, 0); border-collapse: collapse; font-size: 0.9rem;">
            <thead>
                <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); text-align: left; background: rgba(255,255,255,0.05);">
                    <th style="padding: 15px;">ユーザー名</th>
                    <th style="padding: 15px;">ステップ</th>
                    <th style="padding: 15px;">回数</th>
                    <th style="padding: 15px;">状態</th>
                    <th style="padding: 15px;">開始日</th>
                    <th style="padding: 15px;">終了日</th>
                    <th style="padding: 15px;">操作</th>
                </tr>
            </thead>
            <tbody id="cytechUserTableBody">
                </tbody>
        </table>
    </div>
</div>

<div id="cytechUserModal" class="modal-overlay">
    <div class="glass-modal">
        <div class="modal-header">
            <h2 id="cytechModalTitle">ユーザー登録</h2>
            <button type="button" class="close-modal-btn" onclick="closeCyTechUserModal()">&times;</button>
        </div>
        <div class="modal-body">
            <input type="hidden" id="cyUserId">
            <div class="modal-section"><label>ユーザー名</label><input type="text" id="cyUsername" class="glass-input-field"></div>
            <div class="modal-section"><label>ステップ</label><input type="text" id="cyStep" class="glass-input-field" placeholder="Step 7 など"></div>
            <div class="modal-section"><label>回数</label><input type="number" id="cyCount" class="glass-input-field" value="1"></div>
            <div class="modal-section">
                <label>状態</label>
                <select id="cyStatus" class="glass-input-field">
                    <option value="doing">処理中</option>
                    <option value="done">完了</option>
                </select>
            </div>
            <div class="modal-section">
                <label>期間</label>
                <div class="modal-date-row">
                    <input type="date" id="cyStartDate" class="glass-input-field">
                    <span>→</span>
                    <input type="date" id="cyEndDate" class="glass-input-field">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="saveCyTechUser()" class="glass-submit-btn">保存する</button>
            </div>
        </div>
    </div>
</div>