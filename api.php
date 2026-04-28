<?php

require 'db.php'; // session_start() が入っている前提

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$user_id = $_SESSION['user_id'] ?? null;

// Backlog 連携（環境に合わせて書き換え）
$space_id = 'ct-academy';
$api_key = '4Be3aRFWc2Wxax0ewCSXZjsNiWBQ8vqyil3POfnS79W2xKSzjwdjcmJWN6so6WIO';
$project_id = 699087;

// ログインしていない場合はエラーを返す
if (!$user_id && $action !== 'login_google') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

/**
 * リクエストボディから Backlog 担当者 ID（未指定は null）
 */
function backlog_assignee_from_payload(array $d): ?int
{
    $key = $d['assigneeId'] ?? $d['backlogAssigneeId'] ?? null;
    if ($key === null || $key === '') {
        return null;
    }
    return (int) $key;
}

/**
 * リクエストボディから Backlog 課題種別 ID（未指定は null）
 */
function backlog_issue_type_from_payload(array $d): ?int
{
    $key = $d['issueTypeId'] ?? $d['backlogIssueTypeId'] ?? null;
    if ($key === null || $key === '') {
        return null;
    }
    return (int) $key;
}

switch ($action) {
    // api.php 内の switch 文の中に追加
    case 'fetch_templates':
        $stmt = $pdo->prepare("SELECT id, name, title_template as title, detail_template as detail FROM templates WHERE user_id = ?");
        $stmt->execute([$user_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'add_template':
        $d = json_decode(file_get_contents('php://input'), true);
        $stmt = $pdo->prepare("INSERT INTO templates (user_id, name, title_template, detail_template) VALUES (?, ?, ?, ?)");
        $stmt->execute([$user_id, $d['name'], $d['title'], $d['detail']]);
        echo json_encode(['success' => true]);
        break;

    case 'login_google':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['token'])) {
            echo json_encode(['success' => false, 'message' => 'Token is required']);
            break;
        }

        $res = file_get_contents("https://oauth2.googleapis.com/tokeninfo?id_token=" . urlencode($data['token']));
        $payload = json_decode($res, true);

        if (isset($payload['sub'])) {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE google_id = ?");
            $stmt->execute([$payload['sub']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                $stmt = $pdo->prepare("INSERT INTO users (google_id, email, username) VALUES (?, ?, ?)");
                $stmt->execute([
                    $payload['sub'],
                    $payload['email'] ?? '',
                    $payload['name'] ?? ''
                ]);
                $user_id = $pdo->lastInsertId();
            } else {
                $user_id = $user['id'];
            }

            $_SESSION['user_id'] = $user_id;
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid Google token']);
        }
        break;

        case 'fetch_tasks':
            $sql = "SELECT id, title as text, detail, status, start_date as startDate, 
                    end_date as endDate, backlog_assignee_id as backlogAssigneeId,
                    backlog_issue_type_id as backlogIssueTypeId
                    FROM tasks WHERE user_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$user_id]); // $uid を $user_id に修正
            $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($res ? $res : []);
            break;

    case 'add_task':
        $d = json_decode(file_get_contents('php://input'), true) ?: [];
        $title = $d['text'] ?? $d['title'] ?? '';
        if ($title === '' || !isset($d['detail'], $d['startDate'], $d['endDate'])) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            break;
        }

        $assignee = backlog_assignee_from_payload($d);
        $issueType = backlog_issue_type_from_payload($d);
        $stmt = $pdo->prepare("INSERT INTO tasks (user_id, title, detail, start_date, end_date, status, backlog_assignee_id, backlog_issue_type_id) VALUES (?, ?, ?, ?, ?, 'todo', ?, ?)");
        $stmt->execute([$user_id, $title, $d['detail'], $d['startDate'], $d['endDate'], $assignee, $issueType]);
        echo json_encode(['success' => true]);
        break;

    case 'edit_task':
        $d = json_decode(file_get_contents('php://input'), true) ?: [];
        if (!isset($d['id'])) {
            echo json_encode(['success' => false, 'message' => 'Task ID is required']);
            break;
        }
        $title = $d['title'] ?? $d['text'] ?? '';
        if ($title === '' || !isset($d['detail'], $d['startDate'], $d['endDate'])) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            break;
        }
        $assignee = backlog_assignee_from_payload($d);
        $issueType = backlog_issue_type_from_payload($d);
        $stmt = $pdo->prepare("UPDATE tasks SET title = ?, detail = ?, start_date = ?, end_date = ?, backlog_assignee_id = ?, backlog_issue_type_id = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$title, $d['detail'], $d['startDate'], $d['endDate'], $assignee, $issueType, $d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;

    case 'update_status':
        $d = json_decode(file_get_contents('php://input'), true);
        if (!isset($d['status'], $d['id'])) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            break;
        }

        $stmt = $pdo->prepare("UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([$d['status'], $d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;

    case 'delete_task':
        $d = json_decode(file_get_contents('php://input'), true);
        if (!isset($d['id'])) {
            echo json_encode(['success' => false, 'message' => 'Task ID is required']);
            break;
        }

        $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?");
        $stmt->execute([$d['id'], $user_id]);
        echo json_encode(['success' => true]);
        break;

        case 'fetch_backlog_users':
            // space_id を小文字にし、ハイフンを使用するのが一般的です
            $url = "https://{$space_id}.backlog.com/api/v2/projects/{$project_id}/users?apiKey=" . urlencode($api_key);
            $raw = @file_get_contents($url);
            if ($raw === false) {
                echo json_encode([]); 
                break;
            }
            echo $raw;
            break;
        
        case 'fetch_backlog_types':
            $url = "https://ct-academy.backlog.com/api/v2/projects/{$project_id}/issueTypes?apiKey=" . urlencode($api_key);
            $raw = @file_get_contents($url);
            if ($raw === false) {
                echo json_encode([]); 
                break;
            }
            echo $raw;
            break;

    case 'sync_to_backlog':
        $d = json_decode(file_get_contents('php://input'), true) ?: [];
        if (!isset($d['title'], $d['detail'], $d['startDate'], $d['endDate'])) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            break;
        }
        $issueTypeId = backlog_issue_type_from_payload($d);
        if ($issueTypeId === null) {
            echo json_encode(['success' => false, 'message' => 'issueTypeId is required']);
            break;
        }

        $url = "https://{$space_id}.backlog.com/api/v2/issues?apiKey=" . urlencode($api_key);
        $post_data = [
            'projectId' => $project_id,
            'summary' => $d['title'],
            'description' => $d['detail'] . "\n\n(My Backlogより送信)",
            'startDate' => $d['startDate'],
            'dueDate' => $d['endDate'],
            'issueTypeId' => $issueTypeId,
            'priorityId' => 3,
        ];
        $aid = backlog_assignee_from_payload($d);
        if ($aid !== null) {
            $post_data['assigneeId'] = $aid;
        }

        if (!function_exists('curl_init')) {
            echo json_encode(['success' => false, 'message' => 'cURL is not available']);
            break;
        }

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($post_data));
        curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        echo json_encode(['success' => ($code === 201)]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;

        case 'fetch_recurring_tasks':
            $stmt = $pdo->prepare("SELECT id, title FROM recurring_tasks WHERE user_id = ? ORDER BY id DESC");
            $stmt->execute([$user_id]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
        
        case 'add_recurring_task':
            $d = json_decode(file_get_contents('php://input'), true);
            if (!isset($d['title']) || $d['title'] === '') {
                echo json_encode(['success' => false]);
                break;
            }
            $stmt = $pdo->prepare("INSERT INTO recurring_tasks (user_id, title) VALUES (?, ?)");
            $stmt->execute([$user_id, $d['title']]);
            echo json_encode(['success' => true]);
            break;
        
        case 'delete_recurring_task':
            $d = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("DELETE FROM recurring_tasks WHERE id = ? AND user_id = ?");
            $stmt->execute([$d['id'], $user_id]);
            echo json_encode(['success' => true]);
            break;
}