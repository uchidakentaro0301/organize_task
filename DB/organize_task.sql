-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- ホスト: localhost:3306
-- 生成日時: 2026-04-29 06:47:55
-- サーバのバージョン： 5.7.24
-- PHP のバージョン: 7.3.19

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
-- テーブルの構造 `recurring_tasks`
--

CREATE TABLE `recurring_tasks` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `detail` text,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- テーブルのデータのダンプ `recurring_tasks`
--

INSERT INTO `recurring_tasks` (`id`, `user_id`, `title`, `detail`, `notes`, `created_at`) VALUES
(2, 1, 'KPI資料記入', '毎週金曜日にKOIの資料を記入します。', 'https://docs.google.com/document/d/1gg8UBNB9H4IvJAqrVPJXUCxl5fu93uZKbGocHRVlTf8/edit?tab=t.mldvcfywbghm', '2026-04-28 07:19:57'),
(3, 1, 'CyTechupdateについて', '毎週金曜日にCyTechのアップデートについて話します。', 'https://docs.google.com/document/d/1nD_wWI7DtrrjLfj5MW0SkLHdd8nonPHPhBipmkKVqRg/edit?tab=t.3co4sci8ebwm#heading=h.bl864epa0muo', '2026-04-28 07:20:41'),
(4, 1, 'ICT × CyTech　定例MTG', '月の最後にMTGを行います。', 'https://docs.google.com/document/d/1m6C4CCuQuYRzvOZ4SodtRCEN1rF43Z0kvVZZ18S-tZk/edit?tab=t.51g9pejissia', '2026-04-28 07:22:03');

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
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_time` int(11) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- テーブルのデータのダンプ `tasks`
--

INSERT INTO `tasks` (`id`, `user_id`, `title`, `detail`, `status`, `backlog_assignee_id`, `backlog_issue_type_id`, `start_date`, `end_date`, `created_at`, `total_time`) VALUES
(4, 1, '【氏名】星野 春花さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-19', '2026-04-19', '2026-04-19 03:06:31', 0),
(5, 1, '【氏名】上野雅貴さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-06', '2026-04-08', '2026-04-19 03:06:58', 0),
(6, 1, '【氏名】上原大輝', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-06', '2026-04-08', '2026-04-19 03:07:18', 0),
(7, 1, '【氏名】藤田芙柚伽さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-13', '2026-04-15', '2026-04-19 03:07:44', 0),
(8, 1, '【氏名】清水征弘さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-16', '2026-04-20', '2026-04-19 03:08:04', 0),
(9, 1, '【氏名】三浦豊晴', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-16', '2026-04-20', '2026-04-19 03:08:22', 0),
(10, 1, '【氏名】星野 春花さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', NULL, NULL, '2026-04-19', '2026-04-19', '2026-04-19 03:43:12', 0),
(12, 1, '人事評価制度テスト運用', '', 'done', NULL, NULL, '2026-04-19', '2026-04-20', '2026-04-19 10:25:26', 0),
(14, 1, '上野雅貴さんテストレビュー', 'https://github.com/MasakiUeno/Cytech-Step7/tree/main', 'doing', NULL, NULL, '2026-04-28', '2026-04-28', '2026-04-28 02:16:34', 8),
(15, 1, '下垣つくしさんテストレビュー', 'https://github.com/tsusann/jihanki.git', 'todo', NULL, NULL, '2026-04-28', '2026-04-28', '2026-04-28 02:16:57', 9),
(16, 1, '倉松惇さんテストレビュー', 'https://github.com/Kura-J/Cytech_Spring_EC', 'todo', NULL, NULL, '2026-04-28', '2026-04-30', '2026-04-28 02:17:19', 0),
(17, 1, 'テストレビュー中野 雪華さん', 'https://github.com/Nakano-25/nakano-yuka_STEP9', 'todo', NULL, NULL, '2026-04-28', '2026-04-28', '2026-04-28 07:12:48', 0);

-- --------------------------------------------------------

--
-- テーブルの構造 `templates`
--

CREATE TABLE `templates` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `title_template` varchar(255) DEFAULT NULL,
  `detail_template` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- テーブルの構造 `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `google_id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `slack_webhook_url` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- テーブルのデータのダンプ `users`
--

INSERT INTO `users` (`id`, `google_id`, `email`, `username`, `slack_webhook_url`, `created_at`) VALUES
(1, '112498829329066004274', 'k.uchida@thenewgate.co.jp', 'Kentaro Uchida', NULL, '2026-04-18 16:38:20');

--
-- ダンプしたテーブルのインデックス
--

--
-- テーブルのインデックス `recurring_tasks`
--
ALTER TABLE `recurring_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- テーブルのインデックス `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- テーブルのインデックス `templates`
--
ALTER TABLE `templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- テーブルのインデックス `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `google_id` (`google_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- ダンプしたテーブルの AUTO_INCREMENT
--

--
-- テーブルの AUTO_INCREMENT `recurring_tasks`
--
ALTER TABLE `recurring_tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- テーブルの AUTO_INCREMENT `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- テーブルの AUTO_INCREMENT `templates`
--
ALTER TABLE `templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- テーブルの AUTO_INCREMENT `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- ダンプしたテーブルの制約
--

--
-- テーブルの制約 `recurring_tasks`
--
ALTER TABLE `recurring_tasks`
  ADD CONSTRAINT `recurring_tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- テーブルの制約 `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- テーブルの制約 `templates`
--
ALTER TABLE `templates`
  ADD CONSTRAINT `templates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
