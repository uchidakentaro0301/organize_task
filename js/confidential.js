// 画面の初期化と認証状態のチェック
async function initConfidentialView() {
    const lockScreen = document.getElementById('confidential-lock-screen');
    const mainContent = document.getElementById('confidential-main-content');
    
    if (!lockScreen || !mainContent) return;

    try {
        const res = await fetch('api.php?action=check_confidential_status');
        const status = await res.json();

        if (status.isUnlocked) {
            // 解除済みの場合
            lockScreen.style.display = 'none';
            mainContent.style.display = 'block';
            loadConfidentialInfo();
        } else {
            // ロック中の場合
            lockScreen.style.display = 'flex';
            mainContent.style.display = 'none';
            
            if (!status.hasPassword) {
                // パスワードが未設定の場合
                document.getElementById('lock-title').innerText = "初期パスワード設定";
                document.getElementById('lock-msg').innerText = "機密情報セクション用のマスターパスワードを設定してください。";
                document.getElementById('authSubmitBtn').innerText = "パスワードを設定";
            } else {
                // 設定済みのロック画面
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
            passwordInput.value = ""; // 入力欄をクリア
            initConfidentialView();   // 画面を再読み込みして解除
        } else {
            alert(result.message || "エラーが発生しました");
        }
    } catch (e) {
        console.error("認証リクエストエラー:", e);
    }
}

// 情報一覧のロード
async function loadConfidentialInfo() {
    const tbody = document.getElementById('confidentialTableBody');
    if (!tbody) return;

    try {
        const res = await fetch('api.php?action=fetch_confidential');
        const data = await res.json();

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 30px; text-align: center; color: #94a3b8;">登録された情報はありません</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => {
            const itemJson = JSON.stringify(item).replace(/'/g, "&apos;");
            return `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <td style="padding: 12px; font-weight: bold; color: #000;">${escapeHTML(item.title)}</td>
                    <td style="padding: 12px; color: #000;">${escapeHTML(item.login_id)}</td>
                    <td style="padding: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span id="pw-text-${item.id}" style="font-family: monospace; color: #000;">********</span>
                            <button onclick="togglePwView(${item.id}, '${escapeHTML(item.password)}')" class="glass-icon-btn" style="color: #6366f1; padding: 2px 6px; font-size: 0.7rem;">表示</button>
                        </div>
                    </td>
                    <td style="padding: 12px; font-size: 0.8rem; color: rgba(0,0,0,0.6);">${escapeHTML(item.notes || '-')}</td>
                    <td style="padding: 12px; text-align: right; white-space: nowrap;">
                        <button onclick='openEditConfModal(${itemJson})' class="glass-icon-btn" style="color:#818cf8; margin-right:8px;">編集</button>
                        <button onclick="deleteConfidential(${item.id})" class="glass-icon-btn" style="color:#f87171;">削除</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error("データ取得エラー:", e);
    }
}

// パスワードの伏せ字切り替え
function togglePwView(id, actualPw) {
    const el = document.getElementById(`pw-text-${id}`);
    const btn = event.target;
    if (el.innerText === '********') {
        el.innerText = actualPw;
        btn.innerText = '隠す';
    } else {
        el.innerText = '********';
        btn.innerText = '表示';
    }
}

// モーダル操作
function openConfidentialModal() {
    document.getElementById('confidentialModal').classList.add('active');
    document.getElementById('confId').value = "";
    document.getElementById('confTitle').value = "";
    document.getElementById('confLoginId').value = "";
    document.getElementById('confPassword').value = "";
    document.getElementById('confNotes').value = "";
    document.getElementById('confidentialModalTitle').innerText = "機密情報登録";
}

function openEditConfModal(item) {
    document.getElementById('confidentialModal').classList.add('active');
    document.getElementById('confId').value = item.id;
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
    const data = {
        id: id,
        title: document.getElementById('confTitle').value,
        login_id: document.getElementById('confLoginId').value,
        password: document.getElementById('confPassword').value,
        notes: document.getElementById('confNotes').value
    };

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
    // 初回ロード時に状態確認
    if (document.getElementById('confidential-lock-screen')) {
        initConfidentialView();
    }
});