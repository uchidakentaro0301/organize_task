<?php
require 'db.php'; 

header('Content-Type: application/json');
$action = $_GET['action'] ?? '';
$user_id = $_SESSION['user_id'] ?? null;

$space_id = 'ct-academy'; 
$api_key = '4Be3aRFWc2Wxax0ewCSXZjsNiWBQ8vqyil3POfnS79W2xKSzjwdjcmJWN6so6WIO';
$project_id = 699087;

if (!$user_id && $action !== 'login_google') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

function backlog_payload_id(array $d, $key1, $key2): ?int {
    $val = $d[$key1] ?? $d[$key2] ?? null;
    return ($val === null || $val === '') ? null : (int)$val;
}

switch ($action) {
    case 'login_google':
        $data = json_decode(file_get_contents('php://input'), true);
        $res = file_get_contents("https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($data['token']));
        $payload = json_decode($res, true);
        if (isset($payload['sub'])) {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE google_id = ?");
            $stmt->execute([$payload['sub']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$user) {
                $stmt = $pdo->prepare("INSERT INTO users (google_id, email, username) VALUES (?, ?, ?)");
                $stmt->execute([$payload['sub'], $payload['email'] ?? '', $payload['name'] ?? '']);
                $user_id = $pdo->lastInsertId();
            } else { $user_id = $user['id']; }
            $_SESSION['user_id'] = $user_id;
            echo json_encode(['success' => true]);
        }
        break;

    case 'fetch_tasks':
        // total_time(秒数)を必ず取得するように修正
        $sql = "SELECT id, title as text, detail, status, start_date as startDate, 
                end_date as endDate, backlog_assignee_id as backlogAssigneeId,
                backlog_issue_type_id as backlogIssueTypeId, total_time as totalTime
                FROM tasks WHERE user_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC) ?: []);
        break;

    case 'add_task':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO tasks (user_id, title, detail, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, 'todo')");
        $stmt->execute([$user_id, $d['title'], $d['detail'], $d['startDate'], $d['endDate']]);
        echo json_encode(['success' => true]);
        break;

    case 'edit_task':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE tasks SET title=?, detail=?, start_date=?, end_date=?, backlog_assignee_id=?, backlog_issue_type_id=? WHERE id=? AND user_id=?");
        $stmt->execute([$d['title'], $d['detail'], $d['startDate'], $d['endDate'], $d['backlogAssigneeId'], $d['backlogIssueTypeId'], $d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;

    case 'update_status':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$d['status'], $d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;

    case 'update_task_time':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE tasks SET total_time = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$d['totalTime'], $d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;

    case 'delete_task':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?");
        $stmt->execute([$d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;

    case 'fetch_backlog_users':
        $url = "https://{$space_id}.backlog.com/api/v2/projects/{$project_id}/users?apiKey=".urlencode($api_key);
        echo @file_get_contents($url) ?: json_encode([]);
        break;

    case 'fetch_backlog_types':
        $url = "https://{$space_id}.backlog.com/api/v2/projects/{$project_id}/issueTypes?apiKey=".urlencode($api_key);
        echo @file_get_contents($url) ?: json_encode([]);
        break;

    case 'sync_to_backlog':
        $d = json_decode(file_get_contents('php://input'), true);
        $url = "https://{$space_id}.backlog.com/api/v2/issues?apiKey=".urlencode($api_key);
        $post = ['projectId'=>$project_id, 'summary'=>$d['title'], 'description'=>$d['detail'], 'startDate'=>$d['startDate'], 'dueDate'=>$d['endDate'], 'issueTypeId'=>$d['issueTypeId'], 'priorityId'=>3];
        if($d['assigneeId']) $post['assigneeId'] = $d['assigneeId'];
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        echo json_encode(['success' => (curl_getinfo($ch, CURLINFO_HTTP_CODE) === 201)]);
        curl_close($ch);
        break;

    case 'fetch_recurring_tasks':
        $stmt = $pdo->prepare("SELECT id, title, detail, notes FROM recurring_tasks WHERE user_id = ? ORDER BY id DESC");
        $stmt->execute([$user_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'add_recurring_task':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO recurring_tasks (user_id, title, detail, notes) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user_id, $d['title'], $d['detail'], $d['notes']]);
        echo json_encode(['success' => true]);
        break;

    case 'edit_recurring_task':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE recurring_tasks SET title=?, detail=?, notes=? WHERE id=? AND user_id=?");
        $stmt->execute([$d['title'], $d['detail'], $d['notes'], $d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;

    case 'delete_recurring_task':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM recurring_tasks WHERE id=? AND user_id=?");
        $stmt->execute([$d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;

    case 'fetch_cytech_users':
        $stmt = $pdo->prepare("SELECT * FROM cytech_users WHERE user_id = ? ORDER BY id DESC");
        $stmt->execute([$user_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;
        
    case 'add_cytech_user':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO cytech_users (user_id, username, step, count, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$user_id, $d['username'], $d['step'], $d['count'], $d['status'], $d['startDate'], $d['endDate']]);
        echo json_encode(['success' => true]);
        break;

    case 'edit_cytech_user':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE cytech_users SET username=?, step=?, count=?, status=?, start_date=?, end_date=? WHERE id=? AND user_id=?");
        $stmt->execute([$d['username'], $d['step'], $d['count'], $d['status'], $d['startDate'], $d['endDate'], $d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;
    
    case 'delete_cytech_user':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("DELETE FROM cytech_users WHERE id=? AND user_id=?");
        $stmt->execute([$d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;
    
    case 'update_cytech_status':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE cytech_users SET status=? WHERE id=? AND user_id=?");
        $stmt->execute([$d['status'], $d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;

    case 'get_status_stats':
        $user_id = $_SESSION['user_id'];
        // ステータスごとの件数と合計時間を集計
        $sql = "SELECT status, COUNT(*) as count, SUM(total_time) as total_time FROM tasks WHERE user_id = ? GROUP BY status";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // フロントエンドで扱いやすいように初期化
        $stats = [
            'todo' => 0, 'doing' => 0, 'done' => 0, 'total' => 0,
            'todo_time' => 0, 'doing_time' => 0, 'done_time' => 0
        ];
        
        foreach ($results as $row) {
            $status = $row['status'];
            $stats[$status] = (int)$row['count'];
            $stats[$status . '_time'] = (int)($row['total_time'] ?? 0);
            $stats['total'] += (int)$row['count'];
        }
        
        echo json_encode(['success' => true, 'data' => $stats]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;

        case 'get_status_stats':
            $user_id = $_SESSION['user_id'];
            // ステータスごとの件数を集計
            $sql = "SELECT status, COUNT(*) as count FROM tasks WHERE user_id = ? GROUP BY status";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user_id]);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
            // フロントエンドで扱いやすいように整形
            $stats = [
                'todo' => 0,
                'doing' => 0,
                'done' => 0,
                'total' => 0
            ];
        
            foreach ($results as $row) {
                $stats[$row['status']] = (int)$row['count'];
                $stats['total'] += (int)$row['count'];
            }
        
            echo json_encode(['success' => true, 'data' => $stats]);
            break;
}