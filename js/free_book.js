/**
 * free book (メモ帳) Glassmorphism Edition
 */
let saveTimeout = null;

// 装飾コマンドの実行
function execCommand(command) {
    document.execCommand(command, false, null);
    document.getElementById('freeNoteArea').focus();
    handleInput(); 
}

// データの読み込み
async function loadFreeNote() {
    const area = document.getElementById('freeNoteArea');
    try {
        const res = await fetch('api.php?action=fetch_free_note');
        const data = await res.json();
        area.innerHTML = data.content || "";
    } catch (e) { 
        console.error("メモ取得エラー:", e); 
    }
}

// データの保存
async function saveFreeNote() {
    const content = document.getElementById('freeNoteArea').innerHTML;
    const statusEl = document.getElementById('save-status');
    
    statusEl.style.color = "rgba(255, 255, 255, 0.4)";
    statusEl.innerText = "Saving...";
    
    try {
        await fetch('api.php?action=save_free_note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        });
        statusEl.innerText = "Saved to cloud";
        statusEl.style.color = "rgb(0, 0, 0)"; // 保存完了時は少し青緑っぽく
    } catch (e) {
        statusEl.innerText = "Save failed";
        statusEl.style.color = "#ff5252";
    }
}

// 入力時のハンドリング
function handleInput() {
    const statusEl = document.getElementById('save-status');
    statusEl.innerText = "Typing...";
    statusEl.style.color = "rgba(255, 255, 255, 0.6)";
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveFreeNote, 1000); // 入力停止から1秒後に保存
}

// 初期ロード
loadFreeNote();