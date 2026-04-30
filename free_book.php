<div class="dashboard-header" style="margin-bottom: 20px;">
    <h1 style="color: #fff; text-shadow: 0 0 10px rgb(0, 0, 0);">📖 free book</h1>
    <div id="save-status" style="font-size: 0.8rem; color: rgba(0, 0, 0, 0.6); font-weight: bold; letter-spacing: 0.05em;">変更を保存しました</div>
</div>

<div class="toolbar" style="
    display: flex; 
    gap: 10px; 
    margin-bottom: 15px; 
    padding: 10px; 
    background: rgba(255, 255, 255, 0.05); 
    backdrop-filter: blur(10px); 
    -webkit-backdrop-filter: blur(10px); 
    border: 1px solid rgba(255, 255, 255, 0.1); 
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
">
    <button class="glass-btn" onclick="execCommand('bold')" title="太字"><b>B</b></button>
    <button class="glass-btn" onclick="execCommand('italic')" title="斜体"><i>I</i></button>
    <button class="glass-btn" onclick="execCommand('underline')" title="下線"><u>U</u></button>
    <button class="glass-btn" onclick="execCommand('strikeThrough')" title="取り消し線"><strike>S</strike></button>
</div>

<div class="glass-editor-container" style="
    flex: 1; 
    width: 100%; 
    height: calc(100vh - 280px); 
    background: rgba(255, 255, 255, 0.03); 
    backdrop-filter: blur(15px); 
    -webkit-backdrop-filter: blur(15px); 
    border: 1px solid rgba(255, 255, 255, 0.1); 
    border-radius: 20px; 
    padding: 5px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
">
    <div id="freeNoteArea" 
         contenteditable="true"
         style="
            height: 100%; 
            width: 100%; 
            padding: 25px; 
            color:rgb(0, 0, 0); 
            font-size: 1.1rem; 
            line-height: 1.8; 
            outline: none; 
            overflow-y: auto; 
            font-family: 'Helvetica Neue', Arial, sans-serif;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.2) transparent;
         "
         oninput="handleInput()"
         placeholder="ここに自由にメモを残してください...">
    </div>
</div>

<style>
/* グラスモーフィズム用ボタンスタイル */
.glass-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: black;
    padding: 8px 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
}

.glass-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.glass-btn:active {
    transform: translateY(0);
}

/* プレースホルダーの擬似的な実装 */
[contenteditable]:empty:before {
    content: attr(placeholder);
    color: rgba(255, 255, 255, 0.3);
    cursor: text;
}
</style>

<script src="js/free_book.js"></script>