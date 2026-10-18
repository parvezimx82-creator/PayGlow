-- ============================================================
-- PayGlow Migration v2 (additive; nothing from v1 is removed)
-- Theme system, task categories, extended task fields,
-- submission/deposit/withdrawal statuses, fee column.
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  `key` VARCHAR(80) PRIMARY KEY,
  `value` TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO settings (`key`,`value`) VALUES
 ('theme_primary_color','#12b76a'),
 ('theme_secondary_color','#0e9384'),
 ('theme_gradient_start','#12b76a'),
 ('theme_gradient_end','#0e9384'),
 ('theme_gradient_direction','135'),
 ('withdraw_min','100'),
 ('withdraw_max','50000'),
 ('deposit_fee_bdt','10')
ON DUPLICATE KEY UPDATE `key`=`key`;

CREATE TABLE IF NOT EXISTS task_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  name_en VARCHAR(120) DEFAULT '',
  icon VARCHAR(16) DEFAULT '📋',
  sort_order INT DEFAULT 0,
  status ENUM('active','paused') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO task_categories (name,name_en,icon,sort_order) VALUES
 ('ফেসবুক','Facebook','📘',1),
 ('ইনস্টাগ্রাম','Instagram','📸',2),
 ('জিমেইল','Gmail','📧',3),
 ('অন্যান্য সোশ্যাল মিডিয়া','Other Social Media','🌐',4),
 ('অন্যান্য মাইক্রো-টাস্ক','Other Micro-tasks','⚡',5);

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS required_link VARCHAR(300) DEFAULT '',
  ADD COLUMN IF NOT EXISTS total_limit INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS per_user_limit INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS starts_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS ends_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status ENUM('active','paused','closed') DEFAULT 'active';

ALTER TABLE task_submissions
  MODIFY COLUMN status ENUM('pending','processing','approved','rejected','completed') NOT NULL DEFAULT 'pending';

ALTER TABLE deposit_requests
  MODIFY COLUMN method ENUM('bkash','nagad','rocket','usdt','bitcoin') NOT NULL,
  MODIFY COLUMN status ENUM('pending','processing','completed','rejected') NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS fee DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS network VARCHAR(40) DEFAULT '';

ALTER TABLE withdrawals
  MODIFY COLUMN status ENUM('pending','processing','completed','rejected','refunded') NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS tx_ref VARCHAR(120) DEFAULT '';

INSERT INTO settings (`key`,`value`) VALUES
 ('ref_prize_1','5000'), ('ref_prize_2','3000'), ('ref_prize_3','2000'),
 ('ref_banner_title','রেফারেল চ্যাম্পিয়নশিপ')
ON DUPLICATE KEY UPDATE `key`=`key`;

CREATE TABLE IF NOT EXISTS notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  text_bn VARCHAR(255) NOT NULL,
  text_en VARCHAR(255) DEFAULT '',
  icon VARCHAR(8) DEFAULT '📢',
  sort_order INT DEFAULT 0,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO notices (text_bn, icon, sort_order) VALUES
 ('সেরাদের ১০০ জন টপ রেফারার তালিকা','👑',1),
 ('লেভেল ১, ২, ৩ ডিজাইনার স্পেশাল লেভেল','🎖️',2),
 ('বিশেষ টাইম অ্যাপডেট কাজ ও পয়েন্ট ডাবল','🛡️',3),
 ('বিশেষ আকর্ষণীয় পুরস্কার আগাম পেমেন্ট অনুযায়ী','⚙️',4);
