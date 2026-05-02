/**
 * free book (メモ帳) 拡張ロジック
 */
let saveTimeout = null;

// 基本コマンド実行
function execCommand(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('freeNoteArea').focus();
    handleInput(); 
}

// リンク挿入
function insertLink() {
    const url = prompt("リンク先のURLを入力してください:");
    if (url) execCommand("createLink", url);
}

// コードブロック挿入
function insertCodeBlock() {
    const html = `<pre><code>\n// ここにコードを貼り付け\n</code></pre><p><br></p>`;
    document.execCommand('insertHTML', false, html);
}

// テーブル挿入
function insertTable() {
    const rows = prompt("行数:", "2");
    const cols = prompt("列数:", "2");
    if (!rows || !cols) return;
    let table = '<table>';
    for (let i = 0; i < rows; i++) {
        table += '<tr>';
        for (let j = 0; j < cols; j++) {
            table += i === 0 ? '<th>見出し</th>' : '<td>データ</td>';
        }
        table += '</tr>';
    }
    table += '</table><p><br></p>';
    document.execCommand('insertHTML', false, table);
}

// チェックリスト挿入
function insertChecklist() {
    const html = `
        <div class="checklist-item" contenteditable="false">
            <input type="checkbox" onchange="this.nextElementSibling.style.textDecoration = this.checked ? 'line-through' : 'none'">
            <span contenteditable="true">チェック項目</span>
        </div>
    `;
    document.execCommand('insertHTML', false, html);
}

// クラウドからのロード
async function loadFreeNote() {
    const area = document.getElementById('freeNoteArea');
    try {
        const res = await fetch('api.php?action=fetch_free_note');
        const data = await res.json();
        area.innerHTML = data.content || "";
    } catch (e) { console.error("データ取得エラー:", e); }
}

// クラウドへの保存
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
        statusEl.innerText = "保存に失敗しました";
        statusEl.style.color = "#ff5252";
    }
}

function handleInput() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveFreeNote, 1500); // 1.5秒停止で保存
}

// 初期化
loadFreeNote();