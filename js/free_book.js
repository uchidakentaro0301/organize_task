/**
 * free book (メモ帳) の制御
 */
let saveTimeout = null;

// データの読み込み
async function loadFreeNote() {
    try {
        const res = await fetch('api.php?action=fetch_free_note');
        const data = await res.json();
        document.getElementById('freeNoteArea').value = data.content || "";
    } catch (e) { console.error("メモ取得エラー:", e); }
}

// データの保存
async function saveFreeNote() {
    const content = document.getElementById('freeNoteArea').value;
    const statusEl = document.getElementById('save-status');
    
    statusEl.innerText = "保存中...";
    
    try {
        await fetch('api.php?action=save_free_note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        });
        statusEl.innerText = "変更を保存しました";
    } catch (e) {
        statusEl.innerText = "保存に失敗しました";
    }
}

// 入力時のイベントリスナー
document.getElementById('freeNoteArea').addEventListener('input', () => {
    document.getElementById('save-status').innerText = "入力中...";
    
    // 前のタイマーをクリアして、入力が止まった500ms後に保存
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveFreeNote, 500);
});

// 初期ロード
loadFreeNote();