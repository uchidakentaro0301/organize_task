-- phpMyAdmin SQL Dump
-- version 5.1.2
-- https://www.phpmyadmin.net/
--
-- ホスト: localhost:3306
-- 生成日時: 2026-05-02 04:26:40
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
-- テーブルの構造 `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- テーブルのデータのダンプ `categories`
--

INSERT INTO `categories` (`id`, `user_id`, `name`) VALUES
(1, 1, 'テストレビュー'),
(2, 1, '依頼・調査'),
(3, 1, 'DX');

-- --------------------------------------------------------

--
-- テーブルの構造 `cytech_users`
--

CREATE TABLE `cytech_users` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `step` varchar(50) DEFAULT NULL,
  `count` int(11) DEFAULT '0',
  `status` enum('doing','done') DEFAULT 'doing',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- テーブルのデータのダンプ `cytech_users`
--

INSERT INTO `cytech_users` (`id`, `user_id`, `username`, `step`, `count`, `status`, `start_date`, `end_date`, `created_at`) VALUES
(1, 1, '星野 春花', '9', 1, 'done', '2026-04-30', '2026-04-30', '2026-04-30 04:45:19'),
(5, 1, '旧_上野雅さん', '7', 1, 'doing', '2026-04-01', '2026-04-30', '2026-04-30 05:10:41'),
(6, 1, 'Java_上原大輝さん', 'Java', 2, 'done', '2026-04-30', '2026-04-30', '2026-04-30 05:11:15'),
(7, 1, '旧_藤田芙柚伽さん', '7', 2, 'done', '2026-04-20', '2026-04-23', '2026-04-30 05:12:23'),
(8, 1, 'Java_清水征弘さん', 'Java', 1, 'done', '2026-04-30', '2026-04-30', '2026-04-30 05:12:52'),
(9, 1, 'Java_三浦豊晴', 'Java', 1, 'done', '2026-04-16', '2026-04-30', '2026-04-30 05:14:39'),
(10, 1, '星野 春花さん', '9 ', 2, 'done', '2026-04-19', '2026-04-19', '2026-04-30 05:15:07'),
(11, 1, '旧_下垣つくし', '7', 3, 'doing', '2026-04-01', '2026-04-30', '2026-04-30 05:15:44'),
(12, 1, '中野 雪華さん', '9', 2, 'doing', '2026-04-28', '2026-04-28', '2026-04-30 05:16:16'),
(13, 1, '田中 直佳さん', '9', 1, 'done', '2026-04-30', '2026-04-30', '2026-04-30 05:17:47');

-- --------------------------------------------------------

--
-- テーブルの構造 `free_notes`
--

CREATE TABLE `free_notes` (
  `user_id` int(11) NOT NULL,
  `content` longtext,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- テーブルのデータのダンプ `free_notes`
--

INSERT INTO `free_notes` (`user_id`, `content`, `updated_at`) VALUES
(1, '<br>', '2026-04-30 17:32:15');

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
  `total_time` int(11) DEFAULT '0',
  `category_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- テーブルのデータのダンプ `tasks`
--

INSERT INTO `tasks` (`id`, `user_id`, `title`, `detail`, `status`, `backlog_assignee_id`, `backlog_issue_type_id`, `start_date`, `end_date`, `created_at`, `total_time`, `category_id`) VALUES
(4, 1, '【氏名】星野 春花さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', '', '', '2026-04-19', '2026-04-19', '2026-04-19 03:06:31', 0, 1),
(5, 1, '【氏名】上野雅貴さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', '', '', '2026-04-06', '2026-04-08', '2026-04-19 03:06:58', 0, 1),
(6, 1, '【氏名】上原大輝', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', '', '', '2026-04-06', '2026-04-08', '2026-04-19 03:07:18', 0, 1),
(7, 1, '【氏名】藤田芙柚伽さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', '', '', '2026-04-13', '2026-04-15', '2026-04-19 03:07:44', 0, 1),
(8, 1, '【氏名】清水征弘さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', '', '', '2026-04-16', '2026-04-20', '2026-04-19 03:08:04', 0, 1),
(9, 1, '【氏名】三浦豊晴', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', '', '', '2026-04-16', '2026-04-20', '2026-04-19 03:08:22', 0, 1),
(10, 1, '【氏名】星野 春花さん', 'テスト内容：\n\nテスト結果：\n\nテスト改善：', 'done', '', '', '2026-04-19', '2026-04-19', '2026-04-19 03:43:12', 0, 1),
(12, 1, '人事評価制度テスト運用', '', 'done', NULL, NULL, '2026-04-19', '2026-04-20', '2026-04-19 10:25:26', 0, NULL),
(14, 1, '上野雅貴さんテストレビュー', 'https://github.com/MasakiUeno/Cytech-Step7/tree/main', 'done', '', '', '2026-04-28', '2026-04-28', '2026-04-28 02:16:34', 1307, 1),
(15, 1, '下垣つくしさんテストレビュー', 'https://github.com/tsusann/jihanki.git', 'done', '', '', '2026-04-28', '2026-04-28', '2026-04-28 02:16:57', 868, 1),
(16, 1, '倉松惇さんテストレビュー', 'https://github.com/Kura-J/Cytech_Spring_EC', 'done', '', '', '2026-04-28', '2026-05-01', '2026-04-28 02:17:19', 353, 1),
(17, 1, 'テストレビュー中野 雪華さん', 'https://github.com/Nakano-25/nakano-yuka_STEP9', 'done', '', '', '2026-04-28', '2026-04-28', '2026-04-28 07:12:48', 970, 1),
(18, 1, 'テストレビュー・田中 直佳さん', 'https://github.com/NaokaTanaka/tanaka-naoka_STEP9/pull/1', 'done', '', '', '2026-04-30', '2026-04-30', '2026-04-30 02:11:22', 178, 1),
(20, 1, 'CTアシスタント希望者', '三浦 豊晴さん（北海道）', 'doing', '', '', '2026-05-01', '2026-05-04', '2026-04-30 04:00:26', 0, 2),
(22, 1, '災害時のSlack自動連係について', '柳生さん依頼\nWebhoocがすでにいっぱいだから何を消して対応するか質問をする。', 'doing', '', '', '2026-04-30', '2026-05-04', '2026-04-30 06:46:10', 16, 2),
(23, 1, '重要度②_広報SNSインサート自動集計', '柳生さん依頼', 'todo', '', '', '2026-04-30', '2026-05-08', '2026-04-30 06:47:06', 0, 2),
(24, 1, '口コミデータ集計', '柳生さん依頼', 'doing', '', '', '2026-04-30', '2026-05-08', '2026-04-30 07:06:43', 5, 2),
(25, 1, '上野雅貴さん', 'https://github.com/MasakiUeno/Cytech-Step7/tree/main', 'todo', NULL, NULL, '2026-05-01', '2026-05-05', '2026-05-01 01:25:23', 0, 1),
(26, 1, '髙原 梓さん', 'https://github.com/azu-tk/takahara-azusa_STEP9.git', 'done', NULL, NULL, '2026-05-01', '2026-05-05', '2026-05-01 01:26:49', 5648, 1),
(27, 1, '髙原 梓さん', 'https://github.com/azu-tk/takahara-azusa_STEP9.git', 'todo', NULL, NULL, '2026-05-01', '2026-05-05', '2026-05-01 07:37:05', 0, 1),
(28, 1, 'フォルダの整理', '', 'todo', NULL, NULL, '2026-05-01', '2026-05-03', '2026-05-01 09:14:52', 0, 3);

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
-- テーブルのインデックス `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- テーブルのインデックス `cytech_users`
--
ALTER TABLE `cytech_users`
  ADD PRIMARY KEY (`id`);

--
-- テーブルのインデックス `free_notes`
--
ALTER TABLE `free_notes`
  ADD PRIMARY KEY (`user_id`);

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
-- テーブルの AUTO_INCREMENT `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- テーブルの AUTO_INCREMENT `cytech_users`
--
ALTER TABLE `cytech_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- テーブルの AUTO_INCREMENT `recurring_tasks`
--
ALTER TABLE `recurring_tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- テーブルの AUTO_INCREMENT `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

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
-- テーブルの制約 `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
