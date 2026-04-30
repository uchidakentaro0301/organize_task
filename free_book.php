<div class="dashboard-header">
    <h1>📖 free book</h1>
    <div id="save-status" style="font-size: 0.8rem; color: rgb(0, 0, 0); font-weight: bold;">変更を保存しました</div>
</div>

<div class="glass-modal" style="max-width: 100%; height: calc(100vh - 200px); margin: 0 auto; padding: 20px; display: flex; flex-direction: column;">
    <textarea id="freeNoteArea" 
              style="flex: 1; width: 100%; background: rgb(255, 255, 255); 
                    color:rgb(0, 0, 0); /* 文字の色 */
                     border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; 
                     padding: 20px; font-size: 1rem; line-height: 1.6; outline: none; 
                     resize: none; font-family: 'Helvetica Neue', sans-serif;" 
              placeholder="ここに自由にメモを残してください...（自動で保存されます）"></textarea>
</div>

<script src="js/free_book.js"></script>