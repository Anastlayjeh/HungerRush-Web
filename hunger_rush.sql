-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 14, 2026 at 12:51 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hunger_rush`
--

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(191) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(191) NOT NULL,
  `owner` varchar(191) NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `carts`
--

CREATE TABLE `carts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `restaurant_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `cart_id` bigint(20) UNSIGNED NOT NULL,
  `menu_item_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `delivery_tasks`
--

CREATE TABLE `delivery_tasks` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `driver_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('unassigned','assigned','accepted','picked_up','delivered','failed') NOT NULL DEFAULT 'unassigned',
  `assigned_at` timestamp NULL DEFAULT NULL,
  `picked_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `drivers`
--

CREATE TABLE `drivers` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `vehicle_type` varchar(255) DEFAULT NULL,
  `verification_status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  `online_status` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `driver_locations`
--

CREATE TABLE `driver_locations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `driver_id` bigint(20) UNSIGNED NOT NULL,
  `lat` decimal(10,7) NOT NULL,
  `lng` decimal(10,7) NOT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(191) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(191) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_members`
--

CREATE TABLE `loyalty_members` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `restaurant_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `points` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `orders_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `tier` varchar(255) NOT NULL DEFAULT 'bronze',
  `last_activity_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `loyalty_members`
--

INSERT INTO `loyalty_members` (`id`, `restaurant_id`, `customer_id`, `points`, `orders_count`, `tier`, `last_activity_at`, `created_at`, `updated_at`) VALUES
(19, 1, 2, 3000, 8, 'gold', '2026-04-13 19:36:48', '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(20, 1, 54, 2550, 7, 'silver', '2026-04-12 19:36:48', '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(21, 1, 55, 2100, 6, 'silver', '2026-04-11 19:36:48', '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(22, 1, 56, 1650, 5, 'bronze', '2026-04-10 19:36:48', '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(23, 1, 57, 1200, 4, 'bronze', '2026-04-09 19:36:48', '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(24, 1, 1, 750, 3, 'bronze', '2026-04-08 19:36:48', '2026-04-13 19:36:48', '2026-04-13 19:36:48');

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_redemptions`
--

CREATE TABLE `loyalty_redemptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `restaurant_id` bigint(20) UNSIGNED NOT NULL,
  `loyalty_member_id` bigint(20) UNSIGNED NOT NULL,
  `loyalty_reward_id` bigint(20) UNSIGNED DEFAULT NULL,
  `points_spent` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `loyalty_redemptions`
--

INSERT INTO `loyalty_redemptions` (`id`, `restaurant_id`, `loyalty_member_id`, `loyalty_reward_id`, `points_spent`, `created_at`, `updated_at`) VALUES
(10, 1, 19, 10, 300, '2026-04-12 19:36:48', '2026-04-12 19:36:48'),
(11, 1, 20, 10, 300, '2026-04-11 19:36:48', '2026-04-11 19:36:48'),
(12, 1, 21, 10, 300, '2026-04-10 19:36:48', '2026-04-10 19:36:48');

-- --------------------------------------------------------

--
-- Table structure for table `loyalty_rewards`
--

CREATE TABLE `loyalty_rewards` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `restaurant_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `points_required` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `reward_type` enum('discount','free_item','free_delivery','cashback','custom') NOT NULL DEFAULT 'custom',
  `status` enum('active','draft','archived') NOT NULL DEFAULT 'draft',
  `usage_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `loyalty_rewards`
--

INSERT INTO `loyalty_rewards` (`id`, `restaurant_id`, `name`, `description`, `points_required`, `reward_type`, `status`, `usage_count`, `created_at`, `updated_at`) VALUES
(10, 1, '10% Off Loyal Special', 'Unlocked after 5 completed orders.', 300, 'discount', 'active', 124, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(11, 1, 'Free Dessert Voucher', 'Redeem for any dessert item.', 500, 'free_item', 'draft', 0, '2026-04-13 19:36:48', '2026-04-13 19:43:31'),
(12, 1, 'Free Delivery Weekend', 'No delivery fee for premium members.', 700, 'free_delivery', 'archived', 52, '2026-04-13 19:36:48', '2026-04-13 19:44:13');

-- --------------------------------------------------------

--
-- Table structure for table `menu_categories`
--

CREATE TABLE `menu_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `restaurant_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `sort_order` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `menu_categories`
--

INSERT INTO `menu_categories` (`id`, `restaurant_id`, `name`, `sort_order`, `created_at`, `updated_at`) VALUES
(21, 1, 'Desserts', 3, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(20, 1, 'Drinks', 2, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(19, 1, 'Burgers', 1, '2026-04-13 19:36:48', '2026-04-13 19:36:48');

-- --------------------------------------------------------

--
-- Table structure for table `menu_items`
--

CREATE TABLE `menu_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`image_urls`)),
  `price` decimal(10,2) NOT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `prep_time` int(10) UNSIGNED NOT NULL DEFAULT 15,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `ingredients` text DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `menu_items`
--

INSERT INTO `menu_items` (`id`, `category_id`, `name`, `description`, `image_urls`, `price`, `is_available`, `prep_time`, `created_at`, `updated_at`, `ingredients`) VALUES
(27, 21, 'Lava Cake', 'Ea cupiditate nostrum illum reiciendis fugiat praesentium alias.', '[\"https:\\/\\/images.unsplash.com\\/photo-1617305855058-336d24456869?auto=format&fit=crop&w=900&q=80\",\"https:\\/\\/images.unsplash.com\\/photo-1602351447937-745cb720612f?auto=format&fit=crop&w=900&q=80\"]', 7.25, 1, 12, '2026-04-13 19:36:48', '2026-04-13 19:36:48', 'Chicken, garlic, lemon, olive oil, black pepper'),
(26, 20, 'Cola', 'Nihil qui laudantium ut velit.', '[\"https:\\/\\/images.unsplash.com\\/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=900&q=80\"]', 3.50, 1, 5, '2026-04-13 19:36:48', '2026-04-13 19:36:48', 'Chicken, garlic, lemon, olive oil, black pepper'),
(25, 19, 'Double Cheese Blaze', 'Nihil non quia maxime commodi.', '[\"https:\\/\\/images.unsplash.com\\/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80\",\"https:\\/\\/images.unsplash.com\\/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=900&q=80\"]', 15.75, 1, 22, '2026-04-13 19:36:48', '2026-04-13 19:36:48', 'Fresh vegetables, herbs, and house seasoning'),
(24, 19, 'Classic Burger', 'Dolores suscipit et repellat molestias maxime eum.', '[\"https:\\/\\/images.unsplash.com\\/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80\",\"https:\\/\\/images.unsplash.com\\/photo-1550317138-10000687a72b?auto=format&fit=crop&w=900&q=80\"]', 12.50, 1, 20, '2026-04-13 19:36:48', '2026-04-13 19:36:48', 'Beef, onion, tomato, lettuce, signature sauce');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_03_24_061508_create_personal_access_tokens_table', 1),
(5, '2026_03_24_061529_create_restaurant_branches_table', 1),
(6, '2026_03_24_061529_create_restaurants_table', 1),
(7, '2026_03_24_061530_create_menu_categories_table', 1),
(8, '2026_03_24_061530_create_menu_items_table', 1),
(9, '2026_03_24_061530_create_orders_table', 1),
(10, '2026_03_24_061531_create_drivers_table', 1),
(11, '2026_03_24_061531_create_order_items_table', 1),
(12, '2026_03_24_061531_create_order_status_histories_table', 1),
(13, '2026_03_24_061532_create_delivery_tasks_table', 1),
(14, '2026_03_24_061532_create_driver_locations_table', 1),
(15, '2026_03_24_061532_create_videos_table', 1),
(16, '2026_03_24_061533_create_video_engagements_table', 1),
(17, '2026_03_24_063830_create_cart_items_table', 1),
(18, '2026_03_24_063830_create_carts_table', 1),
(19, '2026_04_05_000001_add_video_metadata_columns', 2),
(20, '2026_04_05_000002_create_reviews_table', 3),
(21, '2026_04_05_000003_add_settings_to_restaurants_table', 3),
(22, '2026_04_05_000004_create_loyalty_rewards_table', 3),
(23, '2026_04_05_000005_create_loyalty_members_table', 3),
(24, '2026_04_05_000006_create_loyalty_redemptions_table', 3),
(25, '2026_04_05_000007_add_image_urls_to_menu_items_table', 4),
(26, '2026_04_05_000008_add_is_quick_order_to_orders_table', 5),
(27, '2026_04_08_000001_add_phone_to_restaurant_branches_table', 6),
(28, '2026_04_08_000002_add_ingredients_to_menu_items_table', 7),
(29, '2026_04_08_000003_backfill_missing_menu_item_ingredients', 7);

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `restaurant_id` bigint(20) UNSIGNED NOT NULL,
  `branch_id` bigint(20) UNSIGNED DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `fees` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('pending','accepted','rejected','preparing','ready_for_pickup','picked_up','on_the_way','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `payment_status` enum('unpaid','authorized','paid','refunded','failed') NOT NULL DEFAULT 'unpaid',
  `is_quick_order` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `customer_id`, `restaurant_id`, `branch_id`, `subtotal`, `fees`, `total`, `status`, `payment_status`, `is_quick_order`, `created_at`, `updated_at`) VALUES
(2194, 56, 1, NULL, 50.75, 5.08, 55.83, 'delivered', 'paid', 0, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(2193, 55, 1, NULL, 32.25, 3.23, 35.48, 'delivered', 'paid', 0, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(2192, 54, 1, NULL, 19.25, 1.93, 21.18, 'delivered', 'paid', 0, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(2191, 2, 1, NULL, 44.75, 4.48, 49.23, 'delivered', 'paid', 0, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(2190, 57, 1, NULL, 35.00, 3.50, 38.50, 'delivered', 'paid', 0, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(2189, 56, 1, NULL, 19.75, 1.98, 21.73, 'on_the_way', 'unpaid', 0, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(2188, 55, 1, NULL, 50.75, 5.08, 55.83, 'ready_for_pickup', 'unpaid', 0, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(2187, 54, 1, NULL, 32.25, 3.23, 35.48, 'preparing', 'unpaid', 0, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(2186, 2, 1, NULL, 19.25, 1.93, 21.18, 'accepted', 'unpaid', 0, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(2185, 2, 1, NULL, 16.00, 1.60, 17.60, 'pending', 'unpaid', 0, '2026-04-13 19:36:48', '2026-04-13 19:36:48');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `menu_item_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `menu_item_id`, `quantity`, `unit_price`, `notes`, `created_at`, `updated_at`) VALUES
(4438, 2194, 26, 1, 3.50, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4437, 2194, 25, 3, 15.75, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4436, 2193, 27, 1, 7.25, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4435, 2193, 24, 2, 12.50, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4434, 2192, 26, 1, 3.50, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4433, 2192, 25, 1, 15.75, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4432, 2191, 27, 1, 7.25, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4431, 2191, 24, 3, 12.50, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4430, 2190, 26, 1, 3.50, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4429, 2190, 25, 2, 15.75, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4428, 2189, 27, 1, 7.25, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4427, 2189, 24, 1, 12.50, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4426, 2188, 26, 1, 3.50, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4425, 2188, 25, 3, 15.75, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4424, 2187, 27, 1, 7.25, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4422, 2186, 26, 1, 3.50, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4423, 2187, 24, 2, 12.50, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4421, 2186, 25, 1, 15.75, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4420, 2185, 26, 1, 3.50, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(4419, 2185, 24, 1, 12.50, NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48');

-- --------------------------------------------------------

--
-- Table structure for table `order_status_histories`
--

CREATE TABLE `order_status_histories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED NOT NULL,
  `status` varchar(255) NOT NULL,
  `changed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_status_histories`
--

INSERT INTO `order_status_histories` (`id`, `order_id`, `status`, `changed_by`, `changed_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'accepted', 1, '2026-03-24 05:22:40', '2026-03-24 05:22:40', '2026-03-24 05:22:40'),
(2, 1, 'preparing', 1, '2026-03-24 05:22:44', '2026-03-24 05:22:44', '2026-03-24 05:22:44'),
(3, 1, 'ready_for_pickup', 1, '2026-03-24 05:22:46', '2026-03-24 05:22:46', '2026-03-24 05:22:46'),
(4, 1, 'picked_up', 1, '2026-03-24 05:22:48', '2026-03-24 05:22:48', '2026-03-24 05:22:48'),
(5, 1, 'on_the_way', 1, '2026-03-24 05:22:51', '2026-03-24 05:22:51', '2026-03-24 05:22:51'),
(6, 1, 'delivered', 1, '2026-03-24 05:22:53', '2026-03-24 05:22:53', '2026-03-24 05:22:53'),
(7, 7, 'accepted', 1, '2026-03-24 05:49:44', '2026-03-24 05:49:44', '2026-03-24 05:49:44'),
(8, 2, 'accepted', 1, '2026-03-24 05:50:27', '2026-03-24 05:50:27', '2026-03-24 05:50:27'),
(9, 2, 'preparing', 1, '2026-03-24 05:50:29', '2026-03-24 05:50:29', '2026-03-24 05:50:29'),
(10, 4, 'ready_for_pickup', 1, '2026-03-24 05:50:30', '2026-03-24 05:50:30', '2026-03-24 05:50:30'),
(11, 6, 'delivered', 1, '2026-03-24 05:50:31', '2026-03-24 05:50:31', '2026-03-24 05:50:31'),
(12, 10, 'picked_up', 1, '2026-03-24 06:00:34', '2026-03-24 06:00:34', '2026-03-24 06:00:34'),
(13, 4, 'picked_up', 1, '2026-03-24 06:00:52', '2026-03-24 06:00:52', '2026-03-24 06:00:52'),
(14, 4, 'on_the_way', 1, '2026-03-24 06:01:26', '2026-03-24 06:01:26', '2026-03-24 06:01:26'),
(15, 7, 'preparing', 1, '2026-04-02 19:06:12', '2026-04-02 19:06:12', '2026-04-02 19:06:12'),
(16, 7, 'ready_for_pickup', 1, '2026-04-02 19:06:16', '2026-04-02 19:06:16', '2026-04-02 19:06:16'),
(17, 11, 'delivered', 1, '2026-04-04 19:22:25', '2026-04-04 19:22:25', '2026-04-04 19:22:25'),
(18, 10, 'on_the_way', 1, '2026-04-04 19:22:26', '2026-04-04 19:22:26', '2026-04-04 19:22:26'),
(19, 10, 'delivered', 1, '2026-04-04 19:22:27', '2026-04-04 19:22:27', '2026-04-04 19:22:27'),
(20, 9, 'ready_for_pickup', 1, '2026-04-04 19:22:28', '2026-04-04 19:22:28', '2026-04-04 19:22:28'),
(21, 9, 'picked_up', 1, '2026-04-04 19:22:29', '2026-04-04 19:22:29', '2026-04-04 19:22:29'),
(22, 9, 'on_the_way', 1, '2026-04-04 19:22:30', '2026-04-04 19:22:30', '2026-04-04 19:22:30'),
(23, 9, 'delivered', 1, '2026-04-04 19:22:30', '2026-04-04 19:22:30', '2026-04-04 19:22:30'),
(24, 12, 'accepted', 1, '2026-04-04 19:30:00', '2026-04-04 19:30:00', '2026-04-04 19:30:00'),
(25, 12, 'preparing', 1, '2026-04-04 19:30:02', '2026-04-04 19:30:02', '2026-04-04 19:30:02'),
(26, 12, 'ready_for_pickup', 1, '2026-04-04 19:30:02', '2026-04-04 19:30:02', '2026-04-04 19:30:02'),
(27, 12, 'picked_up', 1, '2026-04-04 19:30:02', '2026-04-04 19:30:02', '2026-04-04 19:30:02'),
(28, 12, 'on_the_way', 1, '2026-04-04 19:30:03', '2026-04-04 19:30:03', '2026-04-04 19:30:03'),
(29, 12, 'delivered', 1, '2026-04-04 19:30:04', '2026-04-04 19:30:04', '2026-04-04 19:30:04'),
(30, 34, 'pending', 1, '2026-04-04 20:39:41', '2026-04-04 20:39:41', '2026-04-04 20:39:41'),
(31, 34, 'accepted', 1, '2026-04-04 20:39:57', '2026-04-04 20:39:57', '2026-04-04 20:39:57'),
(32, 34, 'preparing', 1, '2026-04-04 20:39:58', '2026-04-04 20:39:58', '2026-04-04 20:39:58'),
(33, 34, 'ready_for_pickup', 1, '2026-04-04 20:39:58', '2026-04-04 20:39:58', '2026-04-04 20:39:58'),
(34, 34, 'picked_up', 1, '2026-04-04 20:40:00', '2026-04-04 20:40:00', '2026-04-04 20:40:00'),
(35, 34, 'on_the_way', 1, '2026-04-04 20:40:01', '2026-04-04 20:40:01', '2026-04-04 20:40:01'),
(36, 34, 'delivered', 1, '2026-04-04 20:40:02', '2026-04-04 20:40:02', '2026-04-04 20:40:02'),
(37, 35, 'pending', 1, '2026-04-04 20:54:46', '2026-04-04 20:54:46', '2026-04-04 20:54:46'),
(38, 35, 'accepted', 1, '2026-04-05 08:02:52', '2026-04-05 08:02:52', '2026-04-05 08:02:52'),
(39, 35, 'preparing', 1, '2026-04-05 08:02:52', '2026-04-05 08:02:52', '2026-04-05 08:02:52'),
(40, 35, 'ready_for_pickup', 1, '2026-04-05 08:02:53', '2026-04-05 08:02:53', '2026-04-05 08:02:53'),
(41, 35, 'picked_up', 1, '2026-04-05 08:02:53', '2026-04-05 08:02:53', '2026-04-05 08:02:53'),
(42, 35, 'on_the_way', 1, '2026-04-05 08:02:54', '2026-04-05 08:02:54', '2026-04-05 08:02:54'),
(43, 35, 'delivered', 1, '2026-04-05 08:02:55', '2026-04-05 08:02:55', '2026-04-05 08:02:55'),
(44, 31, 'delivered', 1, '2026-04-05 08:04:06', '2026-04-05 08:04:06', '2026-04-05 08:04:06'),
(45, 27, 'accepted', 1, '2026-04-05 08:04:11', '2026-04-05 08:04:11', '2026-04-05 08:04:11'),
(46, 27, 'preparing', 1, '2026-04-05 08:04:13', '2026-04-05 08:04:13', '2026-04-05 08:04:13'),
(47, 27, 'ready_for_pickup', 1, '2026-04-05 08:04:15', '2026-04-05 08:04:15', '2026-04-05 08:04:15'),
(48, 27, 'picked_up', 1, '2026-04-05 08:04:20', '2026-04-05 08:04:20', '2026-04-05 08:04:20'),
(49, 27, 'on_the_way', 1, '2026-04-05 08:04:22', '2026-04-05 08:04:22', '2026-04-05 08:04:22'),
(50, 27, 'delivered', 1, '2026-04-05 08:04:26', '2026-04-05 08:04:26', '2026-04-05 08:04:26'),
(51, 2177, 'pending', 1, '2026-04-05 10:59:53', '2026-04-05 10:59:53', '2026-04-05 10:59:53'),
(52, 2178, 'pending', 1, '2026-04-06 14:16:00', '2026-04-06 14:16:00', '2026-04-06 14:16:00'),
(53, 2177, 'accepted', 1, '2026-04-07 18:10:57', '2026-04-07 18:10:57', '2026-04-07 18:10:57'),
(54, 2177, 'preparing', 1, '2026-04-07 18:10:58', '2026-04-07 18:10:58', '2026-04-07 18:10:58'),
(55, 2177, 'ready_for_pickup', 1, '2026-04-07 18:10:59', '2026-04-07 18:10:59', '2026-04-07 18:10:59'),
(56, 2177, 'picked_up', 1, '2026-04-07 18:10:59', '2026-04-07 18:10:59', '2026-04-07 18:10:59'),
(57, 2177, 'on_the_way', 1, '2026-04-07 18:10:59', '2026-04-07 18:10:59', '2026-04-07 18:10:59'),
(58, 2177, 'delivered', 1, '2026-04-07 18:11:00', '2026-04-07 18:11:00', '2026-04-07 18:11:00'),
(59, 2178, 'accepted', 1, '2026-04-07 18:11:01', '2026-04-07 18:11:01', '2026-04-07 18:11:01'),
(60, 2178, 'preparing', 1, '2026-04-07 18:11:01', '2026-04-07 18:11:01', '2026-04-07 18:11:01'),
(61, 2178, 'ready_for_pickup', 1, '2026-04-07 18:11:01', '2026-04-07 18:11:01', '2026-04-07 18:11:01'),
(62, 2178, 'picked_up', 1, '2026-04-07 18:11:02', '2026-04-07 18:11:02', '2026-04-07 18:11:02'),
(63, 2178, 'on_the_way', 1, '2026-04-07 18:11:02', '2026-04-07 18:11:02', '2026-04-07 18:11:02'),
(64, 2178, 'delivered', 1, '2026-04-07 18:11:03', '2026-04-07 18:11:03', '2026-04-07 18:11:03'),
(65, 2179, 'pending', 1, '2026-04-07 18:11:15', '2026-04-07 18:11:15', '2026-04-07 18:11:15'),
(66, 2179, 'accepted', 1, '2026-04-07 18:11:42', '2026-04-07 18:11:42', '2026-04-07 18:11:42'),
(67, 2179, 'preparing', 1, '2026-04-07 18:11:42', '2026-04-07 18:11:42', '2026-04-07 18:11:42'),
(68, 2179, 'ready_for_pickup', 1, '2026-04-07 18:11:43', '2026-04-07 18:11:43', '2026-04-07 18:11:43'),
(69, 2179, 'picked_up', 1, '2026-04-07 18:11:43', '2026-04-07 18:11:43', '2026-04-07 18:11:43'),
(70, 2179, 'on_the_way', 1, '2026-04-07 18:11:43', '2026-04-07 18:11:43', '2026-04-07 18:11:43'),
(71, 2179, 'delivered', 1, '2026-04-07 18:11:44', '2026-04-07 18:11:44', '2026-04-07 18:11:44'),
(72, 2180, 'pending', 1, '2026-04-07 18:13:33', '2026-04-07 18:13:33', '2026-04-07 18:13:33'),
(73, 2180, 'accepted', 1, '2026-04-07 18:13:35', '2026-04-07 18:13:35', '2026-04-07 18:13:35'),
(74, 2180, 'preparing', 1, '2026-04-07 18:13:35', '2026-04-07 18:13:35', '2026-04-07 18:13:35'),
(75, 2180, 'ready_for_pickup', 1, '2026-04-07 18:13:36', '2026-04-07 18:13:36', '2026-04-07 18:13:36'),
(76, 2180, 'picked_up', 1, '2026-04-07 18:13:37', '2026-04-07 18:13:37', '2026-04-07 18:13:37'),
(77, 2180, 'on_the_way', 1, '2026-04-07 18:13:38', '2026-04-07 18:13:38', '2026-04-07 18:13:38'),
(78, 2180, 'delivered', 1, '2026-04-07 18:13:39', '2026-04-07 18:13:39', '2026-04-07 18:13:39'),
(79, 2181, 'pending', 1, '2026-04-09 08:21:33', '2026-04-09 08:21:33', '2026-04-09 08:21:33'),
(80, 2181, 'cancelled', 1, '2026-04-09 08:21:43', '2026-04-09 08:21:43', '2026-04-09 08:21:43'),
(81, 2182, 'pending', 1, '2026-04-09 08:21:55', '2026-04-09 08:21:55', '2026-04-09 08:21:55'),
(82, 2182, 'accepted', 1, '2026-04-09 08:33:08', '2026-04-09 08:33:08', '2026-04-09 08:33:08'),
(83, 2183, 'pending', 1, '2026-04-09 08:33:52', '2026-04-09 08:33:52', '2026-04-09 08:33:52'),
(84, 2182, 'preparing', 1, '2026-04-09 08:34:19', '2026-04-09 08:34:19', '2026-04-09 08:34:19'),
(85, 2182, 'ready_for_pickup', 1, '2026-04-09 08:34:20', '2026-04-09 08:34:20', '2026-04-09 08:34:20'),
(86, 2182, 'picked_up', 1, '2026-04-09 08:34:20', '2026-04-09 08:34:20', '2026-04-09 08:34:20'),
(87, 2182, 'on_the_way', 1, '2026-04-09 08:34:20', '2026-04-09 08:34:20', '2026-04-09 08:34:20'),
(88, 2182, 'delivered', 1, '2026-04-09 08:34:20', '2026-04-09 08:34:20', '2026-04-09 08:34:20'),
(89, 2183, 'accepted', 1, '2026-04-09 08:34:22', '2026-04-09 08:34:22', '2026-04-09 08:34:22'),
(90, 2183, 'preparing', 1, '2026-04-09 08:34:22', '2026-04-09 08:34:22', '2026-04-09 08:34:22'),
(91, 2183, 'ready_for_pickup', 1, '2026-04-09 08:34:22', '2026-04-09 08:34:22', '2026-04-09 08:34:22'),
(92, 2183, 'picked_up', 1, '2026-04-09 08:34:22', '2026-04-09 08:34:22', '2026-04-09 08:34:22'),
(93, 2183, 'on_the_way', 1, '2026-04-09 08:34:23', '2026-04-09 08:34:23', '2026-04-09 08:34:23'),
(94, 2183, 'delivered', 1, '2026-04-09 08:34:23', '2026-04-09 08:34:23', '2026-04-09 08:34:23'),
(95, 2184, 'pending', 1, '2026-04-13 13:04:08', '2026-04-13 13:04:08', '2026-04-13 13:04:08'),
(96, 2184, 'accepted', 1, '2026-04-13 13:04:15', '2026-04-13 13:04:15', '2026-04-13 13:04:15'),
(97, 2184, 'preparing', 1, '2026-04-13 13:04:18', '2026-04-13 13:04:18', '2026-04-13 13:04:18'),
(98, 2184, 'ready_for_pickup', 1, '2026-04-13 13:04:20', '2026-04-13 13:04:20', '2026-04-13 13:04:20'),
(99, 2184, 'picked_up', 1, '2026-04-13 13:04:21', '2026-04-13 13:04:21', '2026-04-13 13:04:21'),
(100, 2184, 'on_the_way', 1, '2026-04-13 13:04:22', '2026-04-13 13:04:22', '2026-04-13 13:04:22'),
(101, 2184, 'delivered', 1, '2026-04-13 13:04:23', '2026-04-13 13:04:23', '2026-04-13 13:04:23');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(191) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(191) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `expires_at`, `created_at`, `updated_at`) VALUES
(15, 'App\\Models\\User', 1, 'dashboard-web', '782690d0824e3e61c68ce6da654c744995291ebbf20eb5b681f0556f696673aa', '[\"*\"]', '2026-04-08 15:06:47', NULL, '2026-04-08 13:23:41', '2026-04-08 15:06:47'),
(14, 'App\\Models\\User', 1, 'dashboard-web', 'e8f08bce6b26d1ef33fda004ad81fc4f5ac032fe8d76ad9bb2aa977b0d3ce1ef', '[\"*\"]', '2026-04-07 19:47:55', NULL, '2026-04-07 18:02:25', '2026-04-07 19:47:55'),
(13, 'App\\Models\\User', 1, 'dashboard-web', '14459fe16228d0d661b6f5a2a2e9b90919964dc286a3d80264e4e359eba111d8', '[\"*\"]', '2026-04-06 14:23:07', NULL, '2026-04-06 14:15:25', '2026-04-06 14:23:07'),
(28, 'App\\Models\\User', 1, 'dashboard-web', 'd9380d83a8228463a347f1d49fc360ff36c8c72aaff355fd137c4f3ce169165a', '[\"*\"]', '2026-04-13 19:50:13', NULL, '2026-04-13 13:03:18', '2026-04-13 19:50:13'),
(19, 'App\\Models\\User', 1, 'hunger-rush-mobile', '497879dbc8b2682171342ade7b549c706edc5bf724851312ccdd89558d419f86', '[\"*\"]', NULL, NULL, '2026-04-09 19:54:59', '2026-04-09 19:54:59'),
(20, 'App\\Models\\User', 53, 'hunger-rush-mobile', '6c54a4aa2f07626257d00299d3059cdc3f5f29c1190d08acfe06f5fd6ca51fff', '[\"*\"]', NULL, NULL, '2026-04-09 19:55:31', '2026-04-09 19:55:31'),
(21, 'App\\Models\\User', 53, 'hunger-rush-mobile', '8e743fae41dca22c6706f738471f035d185df2ec1181f74308398b10b6a54ab1', '[\"*\"]', NULL, NULL, '2026-04-09 19:56:03', '2026-04-09 19:56:03'),
(22, 'App\\Models\\User', 1, 'hunger-rush-mobile', '4b8e19339cb6bf1fe1085e82bae5595adf688b5da081fddfe31f93457d26c5a4', '[\"*\"]', NULL, NULL, '2026-04-13 12:27:52', '2026-04-13 12:27:52'),
(23, 'App\\Models\\User', 1, 'hunger-rush-mobile', '43c6c22eb2db824e0f122cb79f7e297417bf045cacf45d36d0bfc37ed8bdc6e7', '[\"*\"]', NULL, NULL, '2026-04-13 12:28:41', '2026-04-13 12:28:41'),
(24, 'App\\Models\\User', 1, 'hunger-rush-mobile', '96a5f9fdb922d7833c2ae2f76702cf8251b8af3b05f4a07a45cfe5e2d18d3331', '[\"*\"]', NULL, NULL, '2026-04-13 12:30:02', '2026-04-13 12:30:02'),
(25, 'App\\Models\\User', 1, 'hunger-rush-mobile', '778a7572710980fb1bcc7f538145dfd8f5fca0d6f34820d47550d0cbca2bc1ac', '[\"*\"]', NULL, NULL, '2026-04-13 12:42:57', '2026-04-13 12:42:57'),
(26, 'App\\Models\\User', 1, 'hunger-rush-mobile', 'd2d2ead0d3a3982738145d9846e2090d8e8458383e97c27b19c88c2e476dd2f6', '[\"*\"]', NULL, NULL, '2026-04-13 12:46:15', '2026-04-13 12:46:15'),
(27, 'App\\Models\\User', 1, 'hunger-rush-mobile', 'bf005c79993696e442308def69d51e65470ce1c2bd2949973cd07a37b132327f', '[\"*\"]', NULL, NULL, '2026-04-13 13:00:44', '2026-04-13 13:00:44');

-- --------------------------------------------------------

--
-- Table structure for table `restaurants`
--

CREATE TABLE `restaurants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `owner_user_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`settings`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `restaurants`
--

INSERT INTO `restaurants` (`id`, `owner_user_id`, `name`, `description`, `status`, `settings`, `created_at`, `updated_at`) VALUES
(1, 1, 'HungerRush Demo Kitchen', 'Demo restaurant for frontend integration.', 'active', '{\"default_prep_time\":20,\"auto_accept_orders\":false,\"notifications_enabled\":true,\"currency\":\"USD\",\"timezone\":\"Asia\\/Beirut\"}', '2026-03-24 05:20:45', '2026-04-13 19:36:47'),
(2, 52, 'Test Restaurant', 'Restaurant account for testing', 'active', '{\"default_prep_time\":20,\"auto_accept_orders\":false,\"notifications_enabled\":true,\"currency\":\"USD\",\"timezone\":\"Asia\\/Beirut\"}', '2026-04-09 07:34:36', '2026-04-09 07:34:36');

-- --------------------------------------------------------

--
-- Table structure for table `restaurant_branches`
--

CREATE TABLE `restaurant_branches` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `restaurant_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `open_hours` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`open_hours`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `restaurant_branches`
--

INSERT INTO `restaurant_branches` (`id`, `restaurant_id`, `name`, `address`, `phone`, `latitude`, `longitude`, `open_hours`, `created_at`, `updated_at`) VALUES
(4, 1, 'zaza', 'zaza', NULL, NULL, NULL, NULL, '2026-04-08 14:30:31', '2026-04-08 14:30:31');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `restaurant_id` bigint(20) UNSIGNED NOT NULL,
  `customer_id` bigint(20) UNSIGNED NOT NULL,
  `order_id` bigint(20) UNSIGNED DEFAULT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `comment` text DEFAULT NULL,
  `reply` text DEFAULT NULL,
  `replied_by` bigint(20) UNSIGNED DEFAULT NULL,
  `replied_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `restaurant_id`, `customer_id`, `order_id`, `rating`, `comment`, `reply`, `replied_by`, `replied_at`, `created_at`, `updated_at`) VALUES
(1, 1, 57, 2190, 5, 'Great food and quick delivery.', 'Thank you for the feedback, we appreciate you. zaza', 1, '2026-04-13 19:41:13', '2026-04-12 19:36:48', '2026-04-13 19:41:13'),
(2, 1, 2, 2191, 4, 'Loved the burger, fries could be hotter.', NULL, NULL, NULL, '2026-04-11 19:36:48', '2026-04-11 19:36:48'),
(3, 1, 54, 2192, 5, 'Fantastic quality and packaging.', 'Glad you enjoyed it. See you again soon.', 1, '2026-04-11 19:36:48', '2026-04-10 19:36:48', '2026-04-10 19:36:48'),
(4, 1, 55, 2193, 3, 'Taste was good, delivery was a little late.', NULL, NULL, NULL, '2026-04-09 19:36:48', '2026-04-09 19:36:48'),
(5, 1, 56, 2194, 4, 'Portion size was generous and still warm on arrival.', 'Thanks for sharing this, we are happy it arrived hot.', 1, '2026-04-09 19:36:48', '2026-04-08 19:36:48', '2026-04-08 19:36:48');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(191) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `role` enum('customer','restaurant_owner','restaurant_staff','driver','admin') NOT NULL DEFAULT 'customer',
  `status` enum('active','suspended') NOT NULL DEFAULT 'active',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `phone`, `role`, `status`, `last_login_at`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Demo Restaurant Owner', 'owner@hungerrush.local', '01111111111', 'restaurant_owner', 'active', '2026-04-13 13:03:18', '2026-04-13 19:36:46', '$2y$12$jOSOOu.6oOC3cmmno7gK9OJNnmxGVYblDjU25/pg5XokN9NLZFCoi', 'PaechK5ubF', '2026-03-24 05:20:45', '2026-04-13 19:36:46'),
(2, 'Demo Customer', 'customer@hungerrush.local', '01999999999', 'customer', 'active', NULL, '2026-04-13 19:36:46', '$2y$12$5KXTSwhVnsk.5CCgqcda4Octphs7rxppKhlVK5JuxeUnL4e0J3vxu', 'uCBm3BQxqi', '2026-03-24 05:20:45', '2026-04-13 19:36:46'),
(3, 'Althea Schowalter', 'candelario43@example.net', '01094571392', 'customer', 'active', NULL, '2026-04-04 19:57:47', '$2y$12$Yzn6dLBlcD6G0jwb3RNZXuXrM.hYwLGka4yWv/2WX9BkYm2vrAJaO', 'xwRwwiP1VC', '2026-04-04 19:57:47', '2026-04-04 19:57:47'),
(4, 'Jovani Moore DVM', 'shanny.torphy@example.net', '01325611403', 'customer', 'active', NULL, '2026-04-04 19:57:47', '$2y$12$Yzn6dLBlcD6G0jwb3RNZXuXrM.hYwLGka4yWv/2WX9BkYm2vrAJaO', 'aWKYvASPLk', '2026-04-04 19:57:47', '2026-04-04 19:57:47'),
(5, 'Iliana Pfeffer', 'dbogan@example.com', '01363722414', 'customer', 'active', NULL, '2026-04-04 19:57:47', '$2y$12$Yzn6dLBlcD6G0jwb3RNZXuXrM.hYwLGka4yWv/2WX9BkYm2vrAJaO', 'UcNxqGiPtu', '2026-04-04 19:57:47', '2026-04-04 19:57:47'),
(6, 'Prof. Gladyce O\'Hara DDS', 'gjacobs@example.org', '01798963280', 'customer', 'active', NULL, '2026-04-04 19:57:47', '$2y$12$Yzn6dLBlcD6G0jwb3RNZXuXrM.hYwLGka4yWv/2WX9BkYm2vrAJaO', 'rP8dmAQkui', '2026-04-04 19:57:47', '2026-04-04 19:57:47'),
(7, 'Myrtice Huels', 'litzy.vonrueden@example.com', '01602068203', 'customer', 'active', NULL, '2026-04-04 20:17:09', '$2y$12$RsHUGqHD7eIC3io2N8WO4ezkDSpZcgXaBCssF9exMYc/Gl5xee3DG', 'K8oSW31Jd3', '2026-04-04 20:17:09', '2026-04-04 20:17:09'),
(8, 'Mateo Hoeger', 'dach.rickey@example.net', '01356752969', 'customer', 'active', NULL, '2026-04-04 20:17:09', '$2y$12$RsHUGqHD7eIC3io2N8WO4ezkDSpZcgXaBCssF9exMYc/Gl5xee3DG', 'J7ujxsMMYX', '2026-04-04 20:17:09', '2026-04-04 20:17:09'),
(9, 'Ayana Cole II', 'mitchell.michaela@example.com', '01429030495', 'customer', 'active', NULL, '2026-04-04 20:17:09', '$2y$12$RsHUGqHD7eIC3io2N8WO4ezkDSpZcgXaBCssF9exMYc/Gl5xee3DG', '7p9U33TOna', '2026-04-04 20:17:09', '2026-04-04 20:17:09'),
(10, 'Stephen Larson V', 'bryce46@example.net', '01101252614', 'customer', 'active', NULL, '2026-04-04 20:17:09', '$2y$12$RsHUGqHD7eIC3io2N8WO4ezkDSpZcgXaBCssF9exMYc/Gl5xee3DG', '1L4lxDqna9', '2026-04-04 20:17:09', '2026-04-04 20:17:09'),
(11, 'Flo Kemmer', 'stoltenberg.bertram@example.net', '01644845659', 'customer', 'active', NULL, '2026-04-04 20:28:44', '$2y$12$IQs78gTMuhmwNQdWo9WPyO6ApnDYeghBXam7VAkTbiLgBXDuj7EfG', 'QNgMCnt4ck', '2026-04-04 20:28:44', '2026-04-04 20:28:44'),
(12, 'Miss Ollie Schuppe', 'fernando.cruickshank@example.org', '01775333322', 'customer', 'active', NULL, '2026-04-04 20:28:44', '$2y$12$IQs78gTMuhmwNQdWo9WPyO6ApnDYeghBXam7VAkTbiLgBXDuj7EfG', '8vhtuSNfFC', '2026-04-04 20:28:44', '2026-04-04 20:28:44'),
(13, 'Dr. Frances Cartwright DDS', 'amaya07@example.org', '01493268511', 'customer', 'active', NULL, '2026-04-04 20:28:44', '$2y$12$IQs78gTMuhmwNQdWo9WPyO6ApnDYeghBXam7VAkTbiLgBXDuj7EfG', 'a5MkSrs2BW', '2026-04-04 20:28:44', '2026-04-04 20:28:44'),
(14, 'Robb Stoltenberg', 'calista.dooley@example.com', '01228507020', 'customer', 'active', NULL, '2026-04-04 20:28:44', '$2y$12$IQs78gTMuhmwNQdWo9WPyO6ApnDYeghBXam7VAkTbiLgBXDuj7EfG', '9IhZIc4H2y', '2026-04-04 20:28:44', '2026-04-04 20:28:44'),
(15, 'Quick Order Customer', 'quick-order-owner-1@hungerrush.local', NULL, 'customer', 'active', NULL, NULL, '$2y$12$9BG0qm3c4Nh0x6/3tKZlBu5lQEd7sOQkxjZxdYvnxw.D2rVKEHB7.', NULL, '2026-04-04 20:39:41', '2026-04-04 20:39:41'),
(16, 'Analytics Customer 1', 'analytics.customer1@hungerrush.local', '07000000001', 'customer', 'active', NULL, '2026-04-05 09:35:34', '$2y$12$i/jZuqPTCm6svIPUtRsc5e2nT23p3/QCmrwMmulc.LhVFBJLcKRi6', NULL, '2026-04-05 09:35:34', '2026-04-05 09:35:34'),
(17, 'Analytics Customer 2', 'analytics.customer2@hungerrush.local', '07000000002', 'customer', 'active', NULL, '2026-04-05 09:35:34', '$2y$12$UAIOFlZX2cb7OxZvxZEnxetYHMc4waQ/9aLeAiosdqtsUr..OtkBO', NULL, '2026-04-05 09:35:34', '2026-04-05 09:35:34'),
(18, 'Analytics Customer 3', 'analytics.customer3@hungerrush.local', '07000000003', 'customer', 'active', NULL, '2026-04-05 09:35:34', '$2y$12$Fnf/mv2mYw0ELB07bNT.luZ44HJu7k9zJr7Y1eAXdFtA5dvdRVe3K', NULL, '2026-04-05 09:35:34', '2026-04-05 09:35:34'),
(19, 'Analytics Customer 4', 'analytics.customer4@hungerrush.local', '07000000004', 'customer', 'active', NULL, '2026-04-05 09:35:34', '$2y$12$USIdf7Irbl3Lj9iBPE/uCeF/r9DitFi0ZREbzYr8xuGuPCy1e9tem', NULL, '2026-04-05 09:35:34', '2026-04-05 09:35:34'),
(20, 'Analytics Customer 5', 'analytics.customer5@hungerrush.local', '07000000005', 'customer', 'active', NULL, '2026-04-05 09:35:34', '$2y$12$EJAUQmkbwqRF2YZB5Y70S.q3Pvs6QXI6XaxFn7FsDM.9gZLDWJGn6', NULL, '2026-04-05 09:35:35', '2026-04-05 09:35:35'),
(21, 'Analytics Customer 6', 'analytics.customer6@hungerrush.local', '07000000006', 'customer', 'active', NULL, '2026-04-05 09:35:35', '$2y$12$WZk19yHn1bfh.6a0.LCXq.1QdtZpiqJtFcJaHbxvQP9JbWzmU9Eyu', NULL, '2026-04-05 09:35:35', '2026-04-05 09:35:35'),
(22, 'Analytics Customer 7', 'analytics.customer7@hungerrush.local', '07000000007', 'customer', 'active', NULL, '2026-04-05 09:35:35', '$2y$12$GET/S1tOIglXVm4LSepUUuFyDuyq9hXoDFtlEnZia2tD7rWeQJCEy', NULL, '2026-04-05 09:35:35', '2026-04-05 09:35:35'),
(23, 'Analytics Customer 8', 'analytics.customer8@hungerrush.local', '07000000008', 'customer', 'active', NULL, '2026-04-05 09:35:35', '$2y$12$94ufdUpXgZ/4Qw.hem/rO.TsgZ.IjhV0MMb4rpZ6G70uy7UAjfKRW', NULL, '2026-04-05 09:35:35', '2026-04-05 09:35:35'),
(24, 'Analytics Customer 9', 'analytics.customer9@hungerrush.local', '07000000009', 'customer', 'active', NULL, '2026-04-05 09:35:35', '$2y$12$IKXX17VZbhDhMbVhG4D1AuXQ/HBhFmlhf.JgOfun4vjFu3jeZ9G.G', NULL, '2026-04-05 09:35:35', '2026-04-05 09:35:35'),
(25, 'Analytics Customer 10', 'analytics.customer10@hungerrush.local', '07000000010', 'customer', 'active', NULL, '2026-04-05 09:35:35', '$2y$12$TeAUJLDwZfhuOBvRcKIUguUWHfZMoWnawcvLlB4bPTYl24OT8C7fK', NULL, '2026-04-05 09:35:36', '2026-04-05 09:35:36'),
(26, 'Analytics Customer 11', 'analytics.customer11@hungerrush.local', '07000000011', 'customer', 'active', NULL, '2026-04-05 09:35:36', '$2y$12$X/HTBfykCQ697e./5X9rLO4z0IPhyB6k6tivzguTmPxJENDX3P2ru', NULL, '2026-04-05 09:35:36', '2026-04-05 09:35:36'),
(27, 'Analytics Customer 12', 'analytics.customer12@hungerrush.local', '07000000012', 'customer', 'active', NULL, '2026-04-05 09:35:36', '$2y$12$rBdoeM0o723jhK74XUaQU.GIlXy1nzAPP2iI9ZWbb25AP2DAPl81O', NULL, '2026-04-05 09:35:36', '2026-04-05 09:35:36'),
(28, 'Analytics Customer 13', 'analytics.customer13@hungerrush.local', '07000000013', 'customer', 'active', NULL, '2026-04-05 09:35:36', '$2y$12$pIx6pXa3MvQttmSZG9ayLe3BBp/I0BvCJLTcv60uqEk09Ad72s0.C', NULL, '2026-04-05 09:35:36', '2026-04-05 09:35:36'),
(29, 'Analytics Customer 14', 'analytics.customer14@hungerrush.local', '07000000014', 'customer', 'active', NULL, '2026-04-05 09:35:36', '$2y$12$IxnXUWmI18Wu50yNleVVuudgQyATuaIIOQtMFHpzWI1jtWyeanpge', NULL, '2026-04-05 09:35:36', '2026-04-05 09:35:36'),
(30, 'Analytics Customer 15', 'analytics.customer15@hungerrush.local', '07000000015', 'customer', 'active', NULL, '2026-04-05 09:35:36', '$2y$12$TzJcTC.nJny1YEplsjul0.iEF8MdYGoDkl2/q.5vZlTcUQOFZYRmK', NULL, '2026-04-05 09:35:37', '2026-04-05 09:35:37'),
(31, 'Analytics Customer 16', 'analytics.customer16@hungerrush.local', '07000000016', 'customer', 'active', NULL, '2026-04-05 09:35:37', '$2y$12$Bx7UckiGLr9uvgZVkHlRHu8EHADvZkioNOYqNCoaWlFMowF814rdu', NULL, '2026-04-05 09:35:37', '2026-04-05 09:35:37'),
(32, 'Analytics Customer 17', 'analytics.customer17@hungerrush.local', '07000000017', 'customer', 'active', NULL, '2026-04-05 09:35:37', '$2y$12$BPEjeH79VgI8uygWa8Dl9u6k2yrZGS/Mqy/QjYZ6hdJFksKGuKmm6', NULL, '2026-04-05 09:35:37', '2026-04-05 09:35:37'),
(33, 'Analytics Customer 18', 'analytics.customer18@hungerrush.local', '07000000018', 'customer', 'active', NULL, '2026-04-05 09:35:37', '$2y$12$aabWdpnG.7MzzJrhtW/wregaw5KiNLZODrBhXkdxo4WZpIYxJpuoy', NULL, '2026-04-05 09:35:37', '2026-04-05 09:35:37'),
(34, 'Analytics Customer 19', 'analytics.customer19@hungerrush.local', '07000000019', 'customer', 'active', NULL, '2026-04-05 09:35:37', '$2y$12$VZmDRQkCdXSBma2yqIYDDe6gvlBbJ4F1Ofny7nnf9vzPYI/vAo0uW', NULL, '2026-04-05 09:35:38', '2026-04-05 09:35:38'),
(35, 'Analytics Customer 20', 'analytics.customer20@hungerrush.local', '07000000020', 'customer', 'active', NULL, '2026-04-05 09:35:38', '$2y$12$hIaJ1xwuJktiIfqQakz1cOuaa.w4HgZFr2Yhc3B5DJMYF14gtugpy', NULL, '2026-04-05 09:35:38', '2026-04-05 09:35:38'),
(36, 'Analytics Customer 21', 'analytics.customer21@hungerrush.local', '07000000021', 'customer', 'active', NULL, '2026-04-05 09:35:38', '$2y$12$K8vG42KYaJxyPgtLkvbE0u.GCR6wIWR1iRcqZGysL70w2D545wmSe', NULL, '2026-04-05 09:35:38', '2026-04-05 09:35:38'),
(37, 'Analytics Customer 22', 'analytics.customer22@hungerrush.local', '07000000022', 'customer', 'active', NULL, '2026-04-05 09:35:38', '$2y$12$oQamDutJL4fTjA54VVNq0eTzvs/2sfJwpzoh7K4BMhHKV8SXsi3xu', NULL, '2026-04-05 09:35:38', '2026-04-05 09:35:38'),
(38, 'Analytics Customer 23', 'analytics.customer23@hungerrush.local', '07000000023', 'customer', 'active', NULL, '2026-04-05 09:35:38', '$2y$12$opDKqps9N2HrevXZ7Mc/muQrFz7xf8hT9.ZgtW/pGzV/lQEVZDfOy', NULL, '2026-04-05 09:35:39', '2026-04-05 09:35:39'),
(39, 'Analytics Customer 24', 'analytics.customer24@hungerrush.local', '07000000024', 'customer', 'active', NULL, '2026-04-05 09:35:39', '$2y$12$9jIXGhGehWTYPGu5ZzpLveu50b29PQahbx/QA9q6ineoFR69phWRG', NULL, '2026-04-05 09:35:39', '2026-04-05 09:35:39'),
(40, 'Analytics Customer 25', 'analytics.customer25@hungerrush.local', '07000000025', 'customer', 'active', NULL, '2026-04-05 09:35:39', '$2y$12$P5mdFbA8rMUayuC7hsIVZOviU05aDo4FSRQfRG9Qe1IQMJZGQqFEy', NULL, '2026-04-05 09:35:39', '2026-04-05 09:35:39'),
(41, 'Analytics Customer 26', 'analytics.customer26@hungerrush.local', '07000000026', 'customer', 'active', NULL, '2026-04-05 09:35:39', '$2y$12$SEQ4F5TUdcj2dmrwPsNIZuiDdffzePowdJ5COgZIVELlf81ahaDeK', NULL, '2026-04-05 09:35:39', '2026-04-05 09:35:39'),
(42, 'Analytics Customer 27', 'analytics.customer27@hungerrush.local', '07000000027', 'customer', 'active', NULL, '2026-04-05 09:35:39', '$2y$12$BCjWIUtID7fRvTAif.OlWuP4pOzr5TiKPHgv5LMU5AKHYyYYZ4DoG', NULL, '2026-04-05 09:35:40', '2026-04-05 09:35:40'),
(43, 'Analytics Customer 28', 'analytics.customer28@hungerrush.local', '07000000028', 'customer', 'active', NULL, '2026-04-05 09:35:40', '$2y$12$gcbbCCzyo5oMrfqnEkqLh.hX1VOP4RkbncNocrUPhL46l0ymnWgB.', NULL, '2026-04-05 09:35:40', '2026-04-05 09:35:40'),
(44, 'Analytics Customer 29', 'analytics.customer29@hungerrush.local', '07000000029', 'customer', 'active', NULL, '2026-04-05 09:35:40', '$2y$12$I5g1lzCmssgcOZt21GuOcuAZG41gfAfWmcTQuwqtGSUPKDiaSXtGa', NULL, '2026-04-05 09:35:40', '2026-04-05 09:35:40'),
(45, 'Analytics Customer 30', 'analytics.customer30@hungerrush.local', '07000000030', 'customer', 'active', NULL, '2026-04-05 09:35:40', '$2y$12$IWtEz7wLpAvuzp5T4QM1y.qT1ehOISg71JkQtNNheczuUNK.V4Nia', NULL, '2026-04-05 09:35:40', '2026-04-05 09:35:40'),
(46, 'Analytics Customer 31', 'analytics.customer31@hungerrush.local', '07000000031', 'customer', 'active', NULL, '2026-04-05 09:35:40', '$2y$12$Z3pqCGIeJknlxFIzC8G9buEaTq5q1.M8L60ISHkJ.Y50.5OSxOh7G', NULL, '2026-04-05 09:35:40', '2026-04-05 09:35:40'),
(47, 'Analytics Customer 32', 'analytics.customer32@hungerrush.local', '07000000032', 'customer', 'active', NULL, '2026-04-05 09:35:40', '$2y$12$X.vlv33dEM90wswRNB5Uv.c8MW57./8VZ.Vyip38Rrt8OGwVL8G8i', NULL, '2026-04-05 09:35:41', '2026-04-05 09:35:41'),
(48, 'Analytics Customer 33', 'analytics.customer33@hungerrush.local', '07000000033', 'customer', 'active', NULL, '2026-04-05 09:35:41', '$2y$12$9.O6iRbHPqzhoxBzfSovk.2kUt2JvgmBiav9RvgKmKQ/dTL/oCIhy', NULL, '2026-04-05 09:35:41', '2026-04-05 09:35:41'),
(49, 'Analytics Customer 34', 'analytics.customer34@hungerrush.local', '07000000034', 'customer', 'active', NULL, '2026-04-05 09:35:41', '$2y$12$bHq6v7Q71GKIj4C6tJwyB.ZXhmr.tfZesPMlENErr5HD3efwKLZJu', NULL, '2026-04-05 09:35:41', '2026-04-05 09:35:41'),
(50, 'Analytics Customer 35', 'analytics.customer35@hungerrush.local', '07000000035', 'customer', 'active', NULL, '2026-04-05 09:35:41', '$2y$12$qBMinq.yILrD8d3Vol0CRuOvzZ2blX3kV1WflRTdaqRkC0J86ygZ.', NULL, '2026-04-05 09:35:41', '2026-04-05 09:35:41'),
(51, 'Analytics Customer 36', 'analytics.customer36@hungerrush.local', '07000000036', 'customer', 'active', NULL, '2026-04-05 09:35:41', '$2y$12$fizGXLezE27xhG2I/1TX6OEawhQMzk4cGcsjDyRC/eUCvslZxghqu', NULL, '2026-04-05 09:35:42', '2026-04-05 09:35:42'),
(54, 'Caitlyn Doyle', 'emoen@example.net', '01638511313', 'customer', 'active', NULL, '2026-04-13 19:36:47', '$2y$12$2BvhiOf7Okk.fAhSIdcPy.lqTt4/5y32poI.zmfeDZ0TiqRa7PNzS', '89Pxs4sgOW', '2026-04-13 19:36:47', '2026-04-13 19:36:47'),
(52, 'Test Restaurant User', 'test@gmail.com', NULL, 'restaurant_owner', 'active', '2026-04-09 07:37:06', NULL, '$2y$12$9bcdd8MPJpPFBYwdpz1aReilYoiqIf1TgI3SzkW9dxstot9GjutRS', NULL, '2026-04-09 07:34:36', '2026-04-09 07:37:06'),
(53, 'jamal', 'jamal2005arabi@gmail.com', '03 192 031', 'customer', 'active', '2026-04-09 19:56:03', NULL, '$2y$12$bi94ULCIEwXBbceWosTv1ecRU.dGxrogFUh5lZPbp30i0dFTMauYy', NULL, '2026-04-09 19:55:31', '2026-04-09 19:56:03'),
(55, 'Ms. Burnice Jakubowski MD', 'mozelle87@example.com', '01383138700', 'customer', 'active', NULL, '2026-04-13 19:36:47', '$2y$12$2BvhiOf7Okk.fAhSIdcPy.lqTt4/5y32poI.zmfeDZ0TiqRa7PNzS', 'z1o9k48XYE', '2026-04-13 19:36:47', '2026-04-13 19:36:47'),
(56, 'Prof. Brady Turcotte Sr.', 'macejkovic.diego@example.net', '01325404318', 'customer', 'active', NULL, '2026-04-13 19:36:47', '$2y$12$2BvhiOf7Okk.fAhSIdcPy.lqTt4/5y32poI.zmfeDZ0TiqRa7PNzS', 'nuhqjZJpDg', '2026-04-13 19:36:47', '2026-04-13 19:36:47'),
(57, 'Carey Weimann', 'arely49@example.net', '01729545680', 'customer', 'active', NULL, '2026-04-13 19:36:47', '$2y$12$2BvhiOf7Okk.fAhSIdcPy.lqTt4/5y32poI.zmfeDZ0TiqRa7PNzS', 'jys1l0uWe9', '2026-04-13 19:36:47', '2026-04-13 19:36:47');

-- --------------------------------------------------------

--
-- Table structure for table `videos`
--

CREATE TABLE `videos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `restaurant_id` bigint(20) UNSIGNED NOT NULL,
  `menu_item_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `media_url` varchar(255) NOT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `published_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `videos`
--

INSERT INTO `videos` (`id`, `restaurant_id`, `menu_item_id`, `title`, `description`, `media_url`, `thumbnail_url`, `status`, `published_at`, `created_at`, `updated_at`) VALUES
(15, 1, 27, 'Lava Cake Final Touch', 'Dusting cocoa right before serving.', 'https://example.com/videos/lava-cake.mp4', 'https://images.unsplash.com/photo-1617305855058-336d24456869?auto=format&fit=crop&w=900&q=80', 'draft', NULL, '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(14, 1, 25, 'Double Cheese Blaze Reveal', 'A cheesy pull guaranteed to make customers hungry.', 'https://example.com/videos/double-cheese-blaze.mp4', 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80', 'published', '2026-04-10 19:36:48', '2026-04-13 19:36:48', '2026-04-13 19:36:48'),
(13, 1, 24, 'Classic Burger Build', 'Layering the perfect burger in 20 seconds.', 'https://example.com/videos/classic-burger.mp4', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80', 'published', '2026-04-11 19:36:48', '2026-04-13 19:36:48', '2026-04-13 19:36:48');

-- --------------------------------------------------------

--
-- Table structure for table `video_engagements`
--

CREATE TABLE `video_engagements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `video_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` enum('like','share','save','view') NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `video_engagements`
--

INSERT INTO `video_engagements` (`id`, `video_id`, `user_id`, `type`, `created_at`, `updated_at`) VALUES
(22014, 15, 1, 'view', '2026-04-09 19:36:48', '2026-04-13 19:36:48'),
(22013, 15, 57, 'view', '2026-04-12 19:36:48', '2026-04-11 19:36:48'),
(22012, 15, 56, 'like', '2026-04-13 19:36:48', '2026-04-09 19:36:48'),
(22011, 15, 56, 'view', '2026-04-09 19:36:48', '2026-04-08 19:36:48'),
(22010, 15, 55, 'view', '2026-04-09 19:36:48', '2026-04-12 19:36:48'),
(22009, 15, 54, 'view', '2026-04-10 19:36:48', '2026-04-07 19:36:48'),
(22008, 15, 2, 'like', '2026-04-08 19:36:48', '2026-04-07 19:36:48'),
(22007, 15, 2, 'view', '2026-04-12 19:36:48', '2026-04-09 19:36:48'),
(22006, 14, 1, 'like', '2026-04-08 19:36:48', '2026-04-09 19:36:48'),
(22005, 14, 1, 'view', '2026-04-12 19:36:48', '2026-04-13 19:36:48'),
(22004, 14, 57, 'view', '2026-04-09 19:36:48', '2026-04-07 19:36:48'),
(22003, 14, 56, 'view', '2026-04-12 19:36:48', '2026-04-10 19:36:48'),
(22002, 14, 55, 'view', '2026-04-11 19:36:48', '2026-04-08 19:36:48'),
(22001, 14, 54, 'like', '2026-04-11 19:36:48', '2026-04-10 19:36:48'),
(22000, 14, 54, 'view', '2026-04-09 19:36:48', '2026-04-13 19:36:48'),
(21999, 14, 2, 'like', '2026-04-10 19:36:48', '2026-04-10 19:36:48'),
(21998, 14, 2, 'view', '2026-04-13 19:36:48', '2026-04-11 19:36:48'),
(21997, 13, 1, 'view', '2026-04-12 19:36:48', '2026-04-11 19:36:48'),
(21996, 13, 57, 'view', '2026-04-10 19:36:48', '2026-04-13 19:36:48'),
(21995, 13, 56, 'like', '2026-04-12 19:36:48', '2026-04-11 19:36:48'),
(21994, 13, 56, 'view', '2026-04-11 19:36:48', '2026-04-13 19:36:48'),
(21993, 13, 55, 'view', '2026-04-12 19:36:48', '2026-04-12 19:36:48'),
(21992, 13, 54, 'view', '2026-04-12 19:36:48', '2026-04-11 19:36:48'),
(21991, 13, 2, 'like', '2026-04-09 19:36:48', '2026-04-08 19:36:48'),
(21990, 13, 2, 'view', '2026-04-11 19:36:48', '2026-04-13 19:36:48');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `carts`
--
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `carts_customer_id_unique` (`customer_id`),
  ADD KEY `carts_restaurant_id_foreign` (`restaurant_id`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cart_items_cart_id_menu_item_id_unique` (`cart_id`,`menu_item_id`),
  ADD KEY `cart_items_menu_item_id_foreign` (`menu_item_id`);

--
-- Indexes for table `delivery_tasks`
--
ALTER TABLE `delivery_tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `delivery_tasks_order_id_foreign` (`order_id`),
  ADD KEY `delivery_tasks_driver_id_foreign` (`driver_id`);

--
-- Indexes for table `drivers`
--
ALTER TABLE `drivers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `drivers_user_id_foreign` (`user_id`);

--
-- Indexes for table `driver_locations`
--
ALTER TABLE `driver_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `driver_locations_driver_id_foreign` (`driver_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `loyalty_members`
--
ALTER TABLE `loyalty_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `loyalty_members_restaurant_id_customer_id_unique` (`restaurant_id`,`customer_id`),
  ADD KEY `loyalty_members_restaurant_id_points_index` (`restaurant_id`,`points`);

--
-- Indexes for table `loyalty_redemptions`
--
ALTER TABLE `loyalty_redemptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `loyalty_redemptions_restaurant_id_created_at_index` (`restaurant_id`,`created_at`),
  ADD KEY `loyalty_redemptions_loyalty_member_id_index` (`loyalty_member_id`),
  ADD KEY `loyalty_redemptions_loyalty_reward_id_index` (`loyalty_reward_id`);

--
-- Indexes for table `loyalty_rewards`
--
ALTER TABLE `loyalty_rewards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `loyalty_rewards_restaurant_id_status_created_at_index` (`restaurant_id`,`status`,`created_at`);

--
-- Indexes for table `menu_categories`
--
ALTER TABLE `menu_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menu_categories_restaurant_id_foreign` (`restaurant_id`);

--
-- Indexes for table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `menu_items_category_id_foreign` (`category_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `orders_customer_id_foreign` (`customer_id`),
  ADD KEY `orders_restaurant_id_foreign` (`restaurant_id`),
  ADD KEY `orders_branch_id_foreign` (`branch_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_items_order_id_foreign` (`order_id`),
  ADD KEY `order_items_menu_item_id_foreign` (`menu_item_id`);

--
-- Indexes for table `order_status_histories`
--
ALTER TABLE `order_status_histories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_status_histories_order_id_foreign` (`order_id`),
  ADD KEY `order_status_histories_changed_by_foreign` (`changed_by`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurants_owner_user_id_foreign` (`owner_user_id`);

--
-- Indexes for table `restaurant_branches`
--
ALTER TABLE `restaurant_branches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `restaurant_branches_restaurant_id_foreign` (`restaurant_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reviews_restaurant_id_rating_created_at_index` (`restaurant_id`,`rating`,`created_at`),
  ADD KEY `reviews_customer_id_index` (`customer_id`),
  ADD KEY `reviews_order_id_index` (`order_id`),
  ADD KEY `reviews_replied_by_index` (`replied_by`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_phone_unique` (`phone`);

--
-- Indexes for table `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `videos_restaurant_id_foreign` (`restaurant_id`),
  ADD KEY `videos_menu_item_id_foreign` (`menu_item_id`);

--
-- Indexes for table `video_engagements`
--
ALTER TABLE `video_engagements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `video_engagements_video_id_foreign` (`video_id`),
  ADD KEY `video_engagements_user_id_foreign` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `carts`
--
ALTER TABLE `carts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `delivery_tasks`
--
ALTER TABLE `delivery_tasks`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `drivers`
--
ALTER TABLE `drivers`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `driver_locations`
--
ALTER TABLE `driver_locations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `loyalty_members`
--
ALTER TABLE `loyalty_members`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `loyalty_redemptions`
--
ALTER TABLE `loyalty_redemptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `loyalty_rewards`
--
ALTER TABLE `loyalty_rewards`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `menu_categories`
--
ALTER TABLE `menu_categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2195;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4439;

--
-- AUTO_INCREMENT for table `order_status_histories`
--
ALTER TABLE `order_status_histories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `restaurant_branches`
--
ALTER TABLE `restaurant_branches`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;

--
-- AUTO_INCREMENT for table `videos`
--
ALTER TABLE `videos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `video_engagements`
--
ALTER TABLE `video_engagements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22015;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
