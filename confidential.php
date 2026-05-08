<?php
// confidential.php - 機密情報専用カテゴリー分離・必須化・アコーディオンフォルダ整理版
?>
<div id="confidential-lock-screen" style="display: none; height: calc(100vh - 200px); flex-direction: column; align-items: center; justify-content: center; color: white;">
    <div class="glass-modal" style="text-align: center; max-width: 400px; padding: 40px;">
        <div style="font-size: 4rem; margin-bottom: 20px;">🔒</div>
        <h2 id="lock-title" style="margin-bottom: 10px;">機密情報ロック</h2>
        <p id="lock-msg" style="font-size: 0.85rem; color: rgba(255, 0, 0, 0.6); margin-bottom: 25px; line-height: 1.5;">
            このセクションを表示するにはパスワードが必要です
        </p>
        <div class="modal-section">
            <input type="password" id="masterPasswordInput" class="glass-input-field" placeholder="パスワードを入力..." style="text-align: center;">
        </div>
        <button type="button" onclick="handleAuthSubmit()" class="glass-submit-btn" id="authSubmitBtn" style="margin-top: 10px;">解除する</button>
    </div>
</div>

<div id="confidential-main-content" style="display: none;">
    <div class="dashboard-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <h1>🔒 機密情報管理</h1>
        <div style="display: flex; gap: 10px;">
            <div style="display: flex; gap: 2px;">
                <button type="button" class="template-btn" onclick="openConfCategoryModal()" style="border-radius: 14px 0 0 14px; background: #10b981; font-size: 0.8rem; height: 38px;">
                    <span class="icon">🏷️</span> カテゴリ追加
                </button>
                <button type="button" class="template-btn" onclick="openConfCategoryModal()" style="border-radius: 0 14px 14px 0; padding: 0 15px; background: #059669; font-size: 0.8rem; height: 38px;">
                    <span class="icon">＋</span>
                </button>
            </div>
            
            <button type="button" class="open-modal-btn" onclick="openConfidentialModal()" style="font-size: 0.8rem; height: 38px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%);">
                <span class="icon">＋</span> 新規情報登録
            </button>
        </div>
    </div>

    <div id="confidential-folders-container"></div>
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
                <label>カテゴリー (必須)</label>
                <select id="confCategory" class="glass-input-field">
                    <option value="">-- カテゴリーを選択 --</option>
                </select>
            </div>

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
                <input type="text" id="confPassword" class="glass-input-field">
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

<div id="confCategoryModal" class="modal-overlay">
    <div class="glass-modal">
        <div class="modal-header">
            <h2>機密用カテゴリー追加</h2>
            <button type="button" class="close-modal-btn" onclick="closeConfCategoryModal()">&times;</button>
        </div>
        <div class="modal-body">
            <div class="modal-section">
                <label>Category Name</label>
                <input type="text" id="confCategoryInput" class="glass-input-field" placeholder="機密用カテゴリー名を入力...">
            </div>
            <div class="modal-footer">
                <button type="button" onclick="saveConfCategory()" class="glass-submit-btn" style="background: #10b981;">Save Category</button>
            </div>
        </div>
    </div>
</div>