// 画面の初期化と認証状態のチェック
async function initConfidentialView() {
    const lockScreen = document.getElementById('confidential-lock-screen');
    const mainContent = document.getElementById('confidential-main-content');
    
    if (!lockScreen || !mainContent) return;

    try {
        const res = await fetch('api.php?action=check_confidential_status');
        const status = await res.json();

        if (status.isUnlocked) {
            lockScreen.style.display = 'none';
            mainContent.style.display = 'block';
            loadConfidentialInfo();
        } else {
            lockScreen.style.display = 'flex';
            mainContent.style.display = 'none';
            
            if (!status.hasPassword) {
                document.getElementById('lock-title').innerText = "初期パスワード設定";
                document.getElementById('lock-msg').innerText = "機密情報セクション用のマスターパスワードを設定してください。";
                document.getElementById('authSubmitBtn').innerText = "パスワードを設定";
            } else {
                document.getElementById('lock-title').innerText = "機密情報ロック";
                document.getElementById('lock-msg').innerText = "このセクションを表示するにはパスワードが必要です";
                document.getElementById('authSubmitBtn').innerText = "解除する";
            }
        }
    } catch (e) {
        console.error("認証状態取得エラー:", e);
    }
}

// 認証ボタン押下時の処理
async function handleAuthSubmit() {
    const passwordInput = document.getElementById('masterPasswordInput');
    const password = passwordInput.value;
    if (!password) return alert("パスワードを入力してください");

    const lockTitle = document.getElementById('lock-title').innerText;
    const action = (lockTitle === "初期パスワード設定") ? 'set_master_password' : 'verify_master_password';

    try {
        const res = await fetch(`api.php?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: password })
        });
        const result = await res.json();

        if (result.success) {
            passwordInput.value = ""; 
            initConfidentialView();   
        } else {
            alert(result.message || "エラーが発生しました");
        }
    } catch (e) {
        console.error("認証リクエストエラー:", e);
    }
}

// --- 専用カテゴリー管理機能 ---

function openConfCategoryModal() {
    const modal = document.getElementById('confCategoryModal');
    if (modal) modal.classList.add('active');
    const input = document.getElementById('confCategoryInput');
    if (input) input.value = "";
}

function closeConfCategoryModal() {
    const modal = document.getElementById('confCategoryModal');
    if (modal) modal.classList.remove('active');
}

async function saveConfCategory() {
    const name = document.getElementById('confCategoryInput').value;
    if (!name) return alert("カテゴリー名を入力してください");

    const response = await fetch('api.php?action=add_confidential_category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name })
    });

    if (response.ok) {
        closeConfCategoryModal();
        loadConfidentialCategories(); // セレクトボックスを更新
        alert("機密用カテゴリーを追加しました");
    }
}

// 専用カテゴリー一覧のロード
async function loadConfidentialCategories() {
    try {
        const res = await fetch('api.php?action=fetch_confidential_categories');
        const categories = await res.json();
        const selector = document.getElementById('confCategory');
        if (!selector) return;

        selector.innerHTML = '<option value="">-- カテゴリーを選択 --</option>';
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            selector.appendChild(opt);
        });
    } catch (e) {
        console.error("カテゴリーロードエラー:", e);
    }
}

// --- 情報表示・処理 ---

// 情報一覧のロード（カテゴリー別フォルダーアコーディオン表示）
async function loadConfidentialInfo() {
    const container = document.getElementById('confidential-folders-container');
    if (!container) return;

    try {
        const res = await fetch('api.php?action=fetch_confidential');
        const data = await res.json();

        if (data.length === 0) {
            container.innerHTML = `<div class="glass-modal" style="padding: 30px; text-align: center; color: #94a3b8;">登録された情報はありません</div>`;
            return;
        }

        // カテゴリー別にデータをグループ化
        const grouped = {};
        data.forEach(item => {
            const catName = item.categoryName || '未分類';
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(item);
        });

        // フォルダのレンダリング
        let html = '';
        for (const catName in grouped) {
            const items = grouped[catName];
            
            const rowsHtml = items.map(item => {
                const itemJson = JSON.stringify(item).replace(/'/g, "&apos;");
                return `
                    <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                        <td style="padding: 12px; font-weight: bold; color: #000; width: 25%;">${escapeHTML(item.title)}</td>
                        <td style="padding: 12px; color: #000; width: 25%;">${escapeHTML(item.login_id)}</td>
                        <td style="padding: 12px; width: 20%;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span id="pw-text-${item.id}" style="font-family: monospace; color: #000;">********</span>
                                <button onclick="togglePwView(this, ${item.id}, '${escapeHTML(item.password)}')" class="glass-icon-btn" style="color: #6366f1; padding: 2px 6px; font-size: 0.7rem;">表示</button>
                            </div>
                        </td>
                        <td style="padding: 12px; font-size: 0.8rem; color: rgba(0,0,0,0.6); width: 20%;">${escapeHTML(item.notes || '-')}</td>
                        <td style="padding: 12px; text-align: right; white-space: nowrap; width: 10%;">
                            <button onclick='openEditConfModal(${itemJson})' class="glass-icon-btn" style="color:#818cf8; margin-right:8px;">編集</button>
                            <button onclick="deleteConfidential(${item.id})" class="glass-icon-btn" style="color:#f87171;">削除</button>
                        </td>
                    </tr>
                `;
            }).join('');

            html += `
                <div class="category-folder" style="margin-bottom: 20px;">
                    <div class="category-folder-header" onclick="this.nextElementSibling.style.display = (this.nextElementSibling.style.display === 'none' ? 'block' : 'none')">
                        <span>📂 ${escapeHTML(catName)} (${items.length}件)</span>
                        <span style="font-size: 0.7rem; background: rgba(0,0,0,0.1); padding: 2px 8px; border-radius: 10px;">表示切替</span>
                    </div>
                    <div class="category-folder-content" style="padding: 15px; background: rgba(255, 255, 255, 0.85);">
                        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                            <thead>
                                <tr style="border-bottom: 2px solid rgba(0, 0, 0, 0.1); text-align: left; background: rgba(0, 0, 0, 0.05); color: #475569;">
                                    <th style="padding: 10px 12px;">サービス/サイト名</th>
                                    <th style="padding: 10px 12px;">ログインID</th>
                                    <th style="padding: 10px 12px;">パスワード</th>
                                    <th style="padding: 10px 12px;">備考</th>
                                    <th style="padding: 10px 12px; text-align: right;">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

    } catch (e) {
        console.error("データ取得エラー:", e);
    }
}

// パスワードの伏せ字切り替え
function togglePwView(btn, id, actualPw) {
    const el = document.getElementById(`pw-text-${id}`);
    if (el.innerText === '********') {
        el.innerText = actualPw;
        btn.innerText = '隠す';
    } else {
        el.innerText = '********';
        btn.innerText = '表示';
    }
}

// モーダル操作
async function openConfidentialModal() {
    await loadConfidentialCategories(); // カテゴリーを最新化
    document.getElementById('confidentialModal').classList.add('active');
    document.getElementById('confId').value = "";
    document.getElementById('confCategory').value = "";
    document.getElementById('confTitle').value = "";
    document.getElementById('confLoginId').value = "";
    document.getElementById('confPassword').value = "";
    document.getElementById('confNotes').value = "";
    document.getElementById('confidentialModalTitle').innerText = "機密情報登録";
}

async function openEditConfModal(item) {
    await loadConfidentialCategories(); // カテゴリーを最新化
    document.getElementById('confidentialModal').classList.add('active');
    document.getElementById('confId').value = item.id;
    // 専用の confidential_category_id にマッピング
    document.getElementById('confCategory').value = item.confidential_category_id || "";
    document.getElementById('confTitle').value = item.title;
    document.getElementById('confLoginId').value = item.login_id;
    document.getElementById('confPassword').value = item.password;
    document.getElementById('confNotes').value = item.notes;
    document.getElementById('confidentialModalTitle').innerText = "機密情報編集";
}

function closeConfidentialModal() {
    document.getElementById('confidentialModal').classList.remove('active');
}

// 保存
async function saveConfidentialInfo() {
    const id = document.getElementById('confId').value;
    const categoryId = document.getElementById('confCategory').value;
    const data = {
        id: id,
        category_id: categoryId,
        title: document.getElementById('confTitle').value,
        login_id: document.getElementById('confLoginId').value,
        password: document.getElementById('confPassword').value,
        notes: document.getElementById('confNotes').value
    };

    if (!data.category_id) return alert("カテゴリーを選択してください（必須）");
    if (!data.title || !data.login_id || !data.password) return alert("タイトル、ID、パスワードは必須です");

    const action = id ? 'edit_confidential' : 'add_confidential';
    try {
        const res = await fetch(`api.php?action=${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            closeConfidentialModal();
            loadConfidentialInfo();
        }
    } catch (e) { console.error(e); }
}

// 削除
async function deleteConfidential(id) {
    if (!confirm("この情報を削除しますか？")) return;
    try {
        await fetch('api.php?action=delete_confidential', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        loadConfidentialInfo();
    } catch (e) { console.error(e); }
}

// ビュー切り替え時に初期化を走らせるための設定
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('confidential-lock-screen')) {
        initConfidentialView();
    }
});