/**
 * Confidential Information Management
 */

// データの読み込み
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
                <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
                    <td style="padding: 12px; font-weight: bold;">${escapeHTML(item.title)}</td>
                    <td style="padding: 12px;">${escapeHTML(item.login_id)}</td>
                    <td style="padding: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span id="pw-text-${item.id}" style="font-family: monospace;">********</span>
                            <button onclick="togglePwView(${item.id}, '${escapeHTML(item.password)}')" class="glass-icon-btn" style="color: #6366f1; padding: 2px 6px; font-size: 0.7rem;">表示</button>
                        </div>
                    </td>
                    <td style="padding: 12px; font-size: 0.8rem; color: #64748b;">${escapeHTML(item.notes || '-')}</td>
                    <td style="padding: 12px; text-align: right; white-space: nowrap;">
                        <button onclick='openEditConfModal(${itemJson})' class="glass-icon-btn" style="color:#818cf8; margin-right:8px;">編集</button>
                        <button onclick="deleteConfidential(${item.id})" class="glass-icon-btn" style="color:#f87171;">削除</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (e) {
        console.error("情報取得エラー:", e);
    }
}

// パスワードの表示切り替え
function togglePwView(id, actualPw) {
    const el = document.getElementById(`pw-text-${id}`);
    if (el.innerText === '********') {
        el.innerText = actualPw;
        event.target.innerText = '隠す';
    } else {
        el.innerText = '********';
        event.target.innerText = '表示';
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

// 保存処理
async function saveConfidentialInfo() {
    const id = document.getElementById('confId').value;
    const data = {
        id: id,
        title: document.getElementById('confTitle').value,
        login_id: document.getElementById('confLoginId').value,
        password: document.getElementById('confPassword').value,
        notes: document.getElementById('confNotes').value
    };

    if (!data.title || !data.login_id || !data.password) return alert("必須項目を入力してください");

    const action = id ? 'edit_confidential' : 'add_confidential';
    await fetch(`api.php?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    closeConfidentialModal();
    loadConfidentialInfo();
}

// 削除処理
async function deleteConfidential(id) {
    if (!confirm("この情報を削除しますか？")) return;
    await fetch('api.php?action=delete_confidential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id })
    });
    loadConfidentialInfo();
}

// 初期ロード
document.addEventListener('DOMContentLoaded', loadConfidentialInfo);