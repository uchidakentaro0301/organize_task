/**
 * free book (メモ帳) 改善版ロジック
 */
let saveTimeout = null;

// エディタへのフォーカスを保証するヘルパー
function ensureEditorFocus() {
    const area = document.getElementById('freeNoteArea');
    area.focus();
}

// 基本コマンド実行
function execCommand(command, value = null) {
    ensureEditorFocus(); // 実行前にフォーカスを強制
    document.execCommand(command, false, value);
    handleInput(); 
}

// リンク挿入
function insertLink() {
    const url = prompt("リンク先のURLを入力してください:");
    if (url) {
        ensureEditorFocus();
        document.execCommand("createLink", false, url);
        handleInput();
    }
}

// コードブロック挿入
function insertCodeBlock() {
    ensureEditorFocus();
    // HTMLとして挿入
    const html = `<pre style="background:#1e1e1e; color:#dcdcdc; padding:15px; border-radius:8px; font-family:monospace; margin:10px 0;"><code>\n// ここにコードを入力\n</code></pre><p><br></p>`;
    document.execCommand('insertHTML', false, html);
    handleInput();
}

// テーブル挿入
function insertTable() {
    const rows = prompt("行数:", "2");
    const cols = prompt("列数:", "2");
    if (!rows || !cols) return;

    ensureEditorFocus();
    let table = '<table style="border-collapse:collapse; width:100%; margin:10px 0; border:1px solid rgba(0,0,0,0.2);">';
    for (let i = 0; i < rows; i++) {
        table += '<tr>';
        for (let j = 0; j < cols; j++) {
            table += `<td style="border:1px solid rgba(0,0,0,0.2); padding:8px;">${i === 0 ? '見出し' : 'データ'}</td>`;
        }
        table += '</tr>';
    }
    table += '</table><p><br></p>';
    document.execCommand('insertHTML', false, table);
    handleInput();
}

// チェックリスト挿入
function insertChecklist() {
    ensureEditorFocus();
    const id = "check-" + Date.now();
    const html = `
        <div class="checklist-row" style="display:flex; align-items:center; gap:8px; margin-bottom:5px;">
            <input type="checkbox" onchange="this.nextElementSibling.style.textDecoration = this.checked ? 'line-through' : 'none'; this.nextElementSibling.style.opacity = this.checked ? '0.5' : '1';">
            <span contenteditable="true" style="outline:none;">チェック項目</span>
        </div>
    `;
    document.execCommand('insertHTML', false, html);
    handleInput();
}

// 以下、ロード・保存処理（既存と同様）
async function loadFreeNote() {
    const area = document.getElementById('freeNoteArea');
    try {
        const res = await fetch('api.php?action=fetch_free_note');
        const data = await res.json();
        area.innerHTML = data.content || "";
    } catch (e) { console.error("データ取得エラー:", e); }
}

async function saveFreeNote() {
    const content = document.getElementById('freeNoteArea').innerHTML;
    const statusEl = document.getElementById('save-status');
    statusEl.innerText = "Saving...";
    try {
        await fetch('api.php?action=save_free_note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        });
        statusEl.innerText = "クラウドに保存しました";
        statusEl.style.color = "rgb(0, 0, 0)";
    } catch (e) {
        statusEl.innerText = "保存失敗";
        statusEl.style.color = "#ff5252";
    }
}

function handleInput() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveFreeNote, 1500);
}

loadFreeNote();