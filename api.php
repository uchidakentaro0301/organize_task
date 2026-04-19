<?php

require 'db.php'; // session_start() が入っている前提

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';
$user_id = $_SESSION['user_id'] ?? null;

// ログインしていない場合はエラーを返す
if (!$user_id && $action !== 'login_google') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

switch ($action) {
    case 'login_google':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['token'])) {
            echo json_encode(['success' => false, 'message' => 'Token is required']);
            break;
        }

        // 本来はライブラリで検証するが、簡易的に検証
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
        $stmt = $pdo->prepare("SELECT id, title as text, detail, status, start_date as startDate, end_date as endDate FROM tasks WHERE user_id = ?");
        $stmt->execute([$user_id]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        break;

    case 'add_task':
        $d = json_decode(file_get_contents('php://input'), true);
        if (!isset($d['text'], $d['detail'], $d['startDate'], $d['endDate'])) {
            echo json_encode(['success' => false, 'message' => 'Missing required fields']);
            break;
        }

        $stmt = $pdo->prepare("INSERT INTO tasks (user_id, title, detail, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, 'todo')");
        $stmt->execute([$user_id, $d['text'], $d['detail'], $d['startDate'], $d['endDate']]);
        echo json_encode(['success' => true]);
        break;

    case 'edit_task':
        $d = json_decode(file_get_contents('php://input'), true);
        // SQLで指定されたIDのタスクを更新
        $stmt = $pdo->prepare("UPDATE tasks SET title = ?, detail = ?, start_date = ?, end_date = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([
            $d['title'],
            $d['detail'],
            $d['startDate'],
            $d['endDate'],
            $d['id'],
            $user_id
        ]);
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

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}