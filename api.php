<?php
require 'db.php';

header('Content-Type: application/json');
$action = $_GET['action'] ?? '';
$user_id = $_SESSION['user_id'] ?? null;

// Backlog連携用設定
$space_id = 'ct-academy';
$api_key = '4Be3aRFWc2Wxax0ewCSXZjsNiWBQ8vqyil3POfnS79W2xKSzjwdjcmJWN6so6WIO';
$project_id = 699087;

if (!$user_id && $action !== 'login_google') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
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

    // --- カテゴリー管理 ---
    case 'fetch_categories':
        $stmt = $pdo->prepare("SELECT id, name FROM categories WHERE user_id = ? ORDER BY name ASC");
        $stmt->execute([$user_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'add_category':
        $d = json_decode(file_get_contents('php://input'), true);
        if (!empty($d['name'])) {
            $stmt = $pdo->prepare("INSERT INTO categories (user_id, name) VALUES (?, ?)");
            $stmt->execute([$user_id, $d['name']]);
            echo json_encode(['success' => true]);
        }
        break;

    // --- タスク管理 ---
    case 'fetch_tasks':
        $sql = "SELECT t.*, c.name as categoryName 
                FROM tasks t 
                LEFT JOIN categories c ON t.category_id = c.id 
                WHERE t.user_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $tasks = array_map(function($r) {
            return [
                'id' => $r['id'], 'text' => $r['title'], 'detail' => $r['detail'],
                'status' => $r['status'], 'startDate' => $r['start_date'],
                'endDate' => $r['end_date'], 'categoryId' => $r['category_id'],
                'categoryName' => $r['categoryName'], 'totalTime' => $r['total_time'],
                'backlogAssigneeId' => $r['backlog_assignee_id'],
                'backlogIssueTypeId' => $r['backlog_issue_type_id']
            ];
        }, $rows);
        echo json_encode($tasks);
        break;

    case 'add_task':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO tasks (user_id, title, detail, start_date, end_date, status, category_id) VALUES (?, ?, ?, ?, ?, 'todo', ?)");
        $stmt->execute([$user_id, $d['title'], $d['detail'], $d['startDate'], $d['endDate'], $d['categoryId']]);
        echo json_encode(['success' => true]);
        break;

    case 'edit_task':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("UPDATE tasks SET title=?, detail=?, start_date=?, end_date=?, category_id=?, backlog_assignee_id=?, backlog_issue_type_id=? WHERE id=? AND user_id=?");
        $stmt->execute([$d['title'], $d['detail'], $d['startDate'], $d['endDate'], $d['categoryId'], $d['backlogAssigneeId'] ?? null, $d['backlogIssueTypeId'] ?? null, $d['id'], $user_id]);
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

    // --- ダッシュボード統計 ---
    case 'get_status_stats':
        $sql = "SELECT status, COUNT(*) as count, SUM(total_time) as total_time FROM tasks WHERE user_id = ? GROUP BY status";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
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

    // --- カテゴリー統計 [新規追加] ---
    case 'get_category_stats':
        $sql = "SELECT c.name, COUNT(t.id) as count 
                FROM categories c 
                LEFT JOIN tasks t ON c.id = t.category_id 
                WHERE c.user_id = ? 
                GROUP BY c.id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;

    // --- Backlog連携 ---
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
        if(!empty($d['assigneeId'])) $post['assigneeId'] = $d['assigneeId'];
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_exec($ch);
        echo json_encode(['success' => (curl_getinfo($ch, CURLINFO_HTTP_CODE) === 201)]);
        curl_close($ch);
        break;

    // --- 定期タスク管理 ---
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
        if (isset($d['id'])) {
            $stmt = $pdo->prepare("DELETE FROM recurring_tasks WHERE id = ? AND user_id = ?");
            $stmt->execute([$d['id'], $user_id]);
            echo json_encode(['success' => true]);
        }
        break;

    // --- CyTechユーザー管理 ---
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

    // --- free book管理 ---
    case 'fetch_free_note':
        $stmt = $pdo->prepare("SELECT content FROM free_notes WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $note = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode(['content' => $note ? $note['content'] : '']);
        break;
    
    case 'save_free_note':
        $d = json_decode(file_get_contents('php://input'), true);
        // ON DUPLICATE KEY UPDATE を使用して存在しなければ挿入、あれば更新
        $stmt = $pdo->prepare("INSERT INTO free_notes (user_id, content) VALUES (?, ?) ON DUPLICATE KEY UPDATE content = ?");
        $stmt->execute([$user_id, $d['content'], $d['content']]);
        echo json_encode(['success' => true]);
        break;

    // --- CyTech進捗統計 [新規追加] ---
    case 'get_cytech_stats':
        $today = date('Y-m-d');
        // 今週の開始日（月曜日）を算出
        $monday = date('Y-m-d', strtotime('monday this week'));
        // 今月の開始日を算出
        $month_first = date('Y-m-01');

        // 今週完了数
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM cytech_users WHERE user_id = ? AND status = 'done' AND end_date >= ?");
        $stmt->execute([$user_id, $monday]);
        $weekDone = $stmt->fetchColumn();

        // 今月完了数
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM cytech_users WHERE user_id = ? AND status = 'done' AND end_date >= ?");
        $stmt->execute([$user_id, $month_first]);
        $monthDone = $stmt->fetchColumn();

        // 現在の処理中（doing）数
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM cytech_users WHERE user_id = ? AND status = 'doing'");
        $stmt->execute([$user_id]);
        $doingCount = $stmt->fetchColumn();

        echo json_encode([
            'success' => true,
            'weekDone' => (int)$weekDone,
            'monthDone' => (int)$monthDone,
            'doingCount' => (int)$doingCount
        ]);
        break;

        // --- 機密情報管理 ---
        case 'fetch_confidential':
            $stmt = $pdo->prepare("SELECT * FROM confidential_info WHERE user_id = ? ORDER BY id DESC");
            $stmt->execute([$user_id]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'add_confidential':
            $d = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("INSERT INTO confidential_info (user_id, title, login_id, password, notes) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$user_id, $d['title'], $d['login_id'], $d['password'], $d['notes']]);
            echo json_encode(['success' => true]);
            break;

        case 'edit_confidential':
            $d = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE confidential_info SET title=?, login_id=?, password=?, notes=? WHERE id=? AND user_id=?");
            $stmt->execute([$d['title'], $d['login_id'], $d['password'], $d['notes'], $d['id'], $user_id]);
            echo json_encode(['success' => true]);
            break;

        case 'delete_confidential':
            $d = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("DELETE FROM confidential_info WHERE id=? AND user_id=?");
            $stmt->execute([$d['id'], $user_id]);
            echo json_encode(['success' => true]);
            break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}