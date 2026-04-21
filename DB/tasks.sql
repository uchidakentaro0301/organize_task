-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- ホスト: localhost:3306
-- 生成日時: 2026-04-21 10:00:49
-- サーバのバージョン： 5.7.24
-- PHP のバージョン: 8.1.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- データベース: `organize_task`
--

-- --------------------------------------------------------

--
-- テーブルの構造 `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `detail` text,
  `status` enum('todo','doing','done') DEFAULT 'todo',
  `backlog_assignee_id` varchar(50) DEFAULT NULL,
  `backlog_issue_type_id` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- テーブルのデータのダンプ `tasks`
--

INSERT INTO `tasks` (`id`, `user_id`, `title`, `detail`, `status`, `backlog_assignee_id`, `backlog_issue_type_id`, `start_date`, `end_date`, `created_at`) VALUES
(4, 1, '【氏名】星野 春花さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-19', '2026-04-19', '2026-04-19 03:06:31'),
(5, 1, '【氏名】上野雅貴さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-06', '2026-04-08', '2026-04-19 03:06:58'),
(6, 1, '【氏名】上原大輝', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-06', '2026-04-08', '2026-04-19 03:07:18'),
(7, 1, '【氏名】藤田芙柚伽さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-13', '2026-04-15', '2026-04-19 03:07:44'),
(8, 1, '【氏名】清水征弘さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-16', '2026-04-20', '2026-04-19 03:08:04'),
(9, 1, '【氏名】三浦豊晴', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-16', '2026-04-20', '2026-04-19 03:08:22'),
(10, 1, '【氏名】星野 春花さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-19', '2026-04-19', '2026-04-19 03:43:12'),
(12, 1, '人事評価制度テスト運用', '', 'todo', NULL, NULL, '2026-04-19', '2026-04-20', '2026-04-19 10:25:26');

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
