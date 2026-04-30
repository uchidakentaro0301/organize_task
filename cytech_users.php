<div class="dashboard-header">
    <h1>CyTechユーザー一覧</h1>
</div>

<div class="glass-modal" style="max-width: 100%; margin: 0 auto; padding: 25px;">
    <div style="overflow-x: auto;">
        <table class="cytech-table" style="width: 100%; color: #f1f5f9; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
                <tr style="border-bottom: 2px solid rgba(255,255,255,0.1); text-align: left; background: rgba(255,255,255,0.05);">
                    <th style="padding: 15px; border: 1px solid rgba(255,255,255,0.1);">ユーザー名</th>
                    <th style="padding: 15px; border: 1px solid rgba(255,255,255,0.1);">ステップ</th>
                    <th style="padding: 15px; border: 1px solid rgba(255,255,255,0.1);">ボタン</th>
                    <th style="padding: 15px; border: 1px solid rgba(255,255,255,0.1);">回数</th>
                    <th style="padding: 15px; border: 1px solid rgba(255,255,255,0.1);">状態</th>
                    <th style="padding: 15px; border: 1px solid rgba(255,255,255,0.1);">開始日</th>
                    <th style="padding: 15px; border: 1px solid rgba(255,255,255,0.1);">終了日</th>
                </tr>
            </thead>
            <tbody id="cytechUserTableBody">
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 12px; border: 1px solid rgba(255,255,255,0.05);">内田 健太郎</td>
                    <td style="padding: 12px; border: 1px solid rgba(255,255,255,0.05);">Step 9</td>
                    <td style="padding: 12px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">1</td>
                    <td style="padding: 12px; border: 1px solid rgba(255,255,255,0.05);"><span style="background: #10b981; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">稼働中</span></td>
                    <td style="padding: 12px; border: 1px solid rgba(255,255,255,0.05);">2026-04-01</td>
                    <td style="padding: 12px; border: 1px solid rgba(255,255,255,0.05);">2026-04-30</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<style>
    .cytech-table th { font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
    .cytech-table td { color: #e2e8f0; }
</style>