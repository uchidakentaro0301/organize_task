<div class="dashboard-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
    <div style="display: flex; align-items: center; gap: 20px;">
        <h1 style="margin: 0;">CyTech業務管理</h1>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="open-modal-btn" 
                    onclick="window.open('https://engineer.cytech.online/admin/login', '_blank')" 
                    style="font-size: 0.75rem; height: 34px; padding: 0 18px; 
                           background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); 
                           border-radius: 10px; 
                           box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);
                           border: 1px solid rgba(255, 255, 255, 0.1);
                           transition: all 0.3s ease;">
                <span class="icon" style="margin-right: 6px;">💬</span> 旧CyTech（チャット）
            </button>

            <button type="button" class="open-modal-btn" 
                    onclick="window.open('https://admin.cytech.online/login', '_blank')" 
                    style="font-size: 0.75rem; height: 34px; padding: 0 18px; 
                           background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); 
                           border-radius: 10px; 
                           box-shadow: 0 4px 15px rgba(8, 145, 178, 0.4);
                           border: 1px solid rgba(255, 255, 255, 0.1);
                           transition: all 0.3s ease;">
                <span class="icon" style="margin-right: 6px;">⚙️</span> 旧CyTech管理画面
            </button>

            <button type="button" class="open-modal-btn" 
                    onclick="window.open('https://user.cytech.online/home#slide-1', '_blank')" 
                    style="font-size: 0.75rem; height: 34px; padding: 0 18px; 
                           background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                           border-radius: 10px; 
                           box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
                           border: 1px solid rgba(255, 255, 255, 0.1);
                           transition: all 0.3s ease;">
                <span class="icon" style="margin-right: 6px;">👤</span> 旧CyTech（ユーザー）
            </button>

            <button type="button" class="open-modal-btn" 
                    onclick="window.open('https://tng-cytech-dashboard.com/home', '_blank')" 
                    style="font-size: 0.75rem; height: 34px; padding: 0 18px; 
                           background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); 
                           border-radius: 10px; 
                           box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
                           border: 1px solid rgba(255, 255, 255, 0.1);
                           transition: all 0.3s ease;">
                <span class="icon" style="margin-right: 6px;">📊</span> 新CyTech（管理画面）
            </button>

            <button type="button" class="open-modal-btn" 
                    onclick="window.open('https://tng-cytech.com/', '_blank')" 
                    style="font-size: 0.75rem; height: 34px; padding: 0 18px; 
                           background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
                           border-radius: 10px; 
                           box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
                           border: 1px solid rgba(255, 255, 255, 0.1);
                           transition: all 0.3s ease;">
                <span class="icon" style="margin-right: 6px;">🏠</span> 新CyTech（ユーザー画面）
            </button>
        </div>
    </div>
    
    <button type="button" class="open-modal-btn" onclick="openCyTechUserModal()" style="font-size: 0.8rem; height: 38px;">
        <span class="icon">＋</span> 新規ユーザー登録
    </button>
</div>

<div class="glass-modal" style="max-width: 100%; margin: 0 auto; padding: 25px;">
    <div style="overflow-x: auto;">
    <table class="cytech-table" style="width: 100%; color:rgb(0, 0, 0); border-collapse: collapse; font-size: 0.9rem;">
        <thead>
            <tr style="border-bottom: 2px solid rgba(0, 0, 0, 0.1); text-align: left; background: rgba(0, 0, 0, 0.05);">
                <th style="padding: 15px;">ユーザー名</th>
                <th style="padding: 15px;">ステップ</th>
                <th style="padding: 15px; text-align: center;">回数</th>
                <th style="padding: 15px;">状態</th>
                <th style="padding: 15px;">開始日</th>
                <th style="padding: 15px;">終了日</th>
                <th style="padding: 15px; text-align: right;">操作</th>
            </tr>
        </thead>
        <tbody id="cytechUserTableBody"></tbody>
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