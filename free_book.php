<div class="dashboard-header" style="margin-bottom: 20px;">
    <h1 style="color: #fff; text-shadow: 0 0 10px rgb(0, 0, 0);">📖 free book</h1>
    <div id="save-status" style="font-size: 0.8rem; color: rgba(0, 0, 0, 0.6); font-weight: bold; letter-spacing: 0.05em;">変更を保存しました</div>
</div>

<div class="toolbar-container">
    <div class="toolbar-group">
        <button class="glass-btn" onclick="execCommand('bold')" title="太字"><b>B</b></button>
        <button class="glass-btn" onclick="execCommand('italic')" title="斜体"><i>I</i></button>
        <button class="glass-btn" onclick="execCommand('underline')" title="下線"><u>U</u></button>
        <button class="glass-btn" onclick="execCommand('strikeThrough')" title="取り消し線"><strike>S</strike></button>
    </div>

    <div class="toolbar-group">
        <select onchange="execCommand('fontSize', this.value)" class="glass-select">
            <option value="3">サイズ: 中</option>
            <option value="1">小</option>
            <option value="2">やや小</option>
            <option value="4">やや大</option>
            <option value="5">大</option>
            <option value="6">特大</option>
            <option value="7">最大</option>
        </select>
        <input type="color" onchange="execCommand('foreColor', this.value)" class="glass-color-picker" title="文字色">
    </div>

    <div class="toolbar-group">
        <button class="glass-btn" onclick="execCommand('insertUnorderedList')" title="箇条書き">UL</button>
        <button class="glass-btn" onclick="execCommand('insertOrderedList')" title="番号付きリスト">OL</button>
        <button class="glass-btn" onclick="insertChecklist()" title="チェックリスト">☑</button>
    </div>

    <div class="toolbar-group">
        <button class="glass-btn" onclick="insertLink()" title="リンク挿入">🔗</button>
        <button class="glass-btn" onclick="insertTable()" title="テーブル挿入">📊</button>
        <button class="glass-btn" onclick="insertCodeBlock()" title="コードブロック">Code</button>
    </div>
    
    <button class="glass-btn danger-text" onclick="execCommand('removeFormat')" title="書式クリア">書式クリア</button>
</div>

<div class="glass-editor-container">
    <div id="freeNoteArea" 
         contenteditable="true"
         oninput="handleInput()"
         placeholder="ここに自由にメモを残してください...">
    </div>
</div>

<link rel="stylesheet" href="css/free_book.css">
<script src="js/free_book.js"></script>