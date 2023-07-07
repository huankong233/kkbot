-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- 主机： 127.0.0.1
-- 生成日期： 2023-01-05 10:01:38
-- 服务器版本： 10.4.24-MariaDB
-- PHP 版本： 8.1.5

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------

--
-- 表的结构 `corpus`
--

CREATE TABLE `corpus` (
  `id` double NOT NULL,
  `user_id` double NOT NULL,
  `keyword` text NOT NULL,
  `mode` int(11) NOT NULL,
  `reply` text NOT NULL,
  `scene` text NOT NULL,
  `hide` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 表的结构 `pigeon`
--

CREATE TABLE `pigeon` (
  `user_id` double NOT NULL,
  `pigeon_num` double NOT NULL DEFAULT 0,
  `update_time` double NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 表的结构 `pigeon_history`
--

CREATE TABLE `pigeon_history` (
  `id` int(11) NOT NULL,
  `user_id` double NOT NULL,
  `operation` double NOT NULL,
  `origin_pigeon` double NOT NULL,
  `now_pigeon` double NOT NULL,
  `update_time` double NOT NULL,
  `reason` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 表的结构 `red_packet`
--

CREATE TABLE `red_packet` (
  `id` int(11) NOT NULL,
  `send_user_id` double NOT NULL,
  `redPacket_num` double NOT NULL,
  `pigeon_num` double NOT NULL,
  `code` text NOT NULL,
  `picked_user` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- 表的结构 `setu`
--

CREATE TABLE `setu` (
  `user_id` double NOT NULL,
  `count` int(11) NOT NULL DEFAULT 0,
  `update_time` double NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- 转储表的索引
--

--
-- 表的索引 `corpus`
--
ALTER TABLE `corpus`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `pigeon`
--
ALTER TABLE `pigeon`
  ADD PRIMARY KEY (`user_id`);

--
-- 表的索引 `pigeon_history`
--
ALTER TABLE `pigeon_history`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `red_packet`
--
ALTER TABLE `red_packet`
  ADD PRIMARY KEY (`id`);

--
-- 表的索引 `setu`
--
ALTER TABLE `setu`
  ADD PRIMARY KEY (`user_id`);

--
-- 在导出的表使用AUTO_INCREMENT
--

--
-- 使用表AUTO_INCREMENT `corpus`
--
ALTER TABLE `corpus`
  MODIFY `id` double NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `pigeon_history`
--
ALTER TABLE `pigeon_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `red_packet`
--
ALTER TABLE `red_packet`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
