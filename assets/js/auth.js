/**
 * Google 認証成功時のコールバック処理
 */
function handleCredentialResponse(response) {
    console.log("Google認証成功、サーバーへ送信中...");
    fetch('api.php?action=login_google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential })
    })
    .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
    })
    .then(data => {
        if (data.success) {
            console.log("ログイン成功、画面をリロードします。");
            window.location.reload(); 
        } else {
            alert('ログインに失敗しました: ' + (data.message || '不明なエラー'));
        }
    })
    .catch(err => {
        console.error('Login error:', err);
        alert('サーバーとの通信に失敗しました。');
    });
}