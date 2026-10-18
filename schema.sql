CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(190) NOT NULL UNIQUE,
  whatsapp VARCHAR(32) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  status ENUM('active','banned') NOT NULL DEFAULT 'active',
  referral_code VARCHAR(32) NOT NULL UNIQUE,
  referred_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_referrer FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS wallet_accounts (
  user_id BIGINT UNSIGNED PRIMARY KEY,
  main_balance DECIMAL(14,2) NOT NULL DEFAULT 0,
  referral_earnings DECIMAL(14,2) NOT NULL DEFAULT 0,
  pending_cashout DECIMAL(14,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  bucket ENUM('main','referral','pending_cashout') NOT NULL,
  entry_type ENUM('credit','debit','adjustment','refund') NOT NULL,
  reference_type VARCHAR(40) NOT NULL,
  reference_id BIGINT UNSIGNED NULL,
  note VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ledger_user_created (user_id, created_at),
  CONSTRAINT fk_ledger_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title_bn VARCHAR(180) NOT NULL,
  title_en VARCHAR(180) NOT NULL,
  description_bn TEXT NOT NULL,
  description_en TEXT NOT NULL,
  category VARCHAR(60) NOT NULL DEFAULT 'custom',
  payout DECIMAL(12,2) NOT NULL,
  proof_type ENUM('text','image','text_image') NOT NULL DEFAULT 'text_image',
  priority ENUM('normal','high') NOT NULL DEFAULT 'normal',
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_task_admin FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS task_submissions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  proof_text TEXT NULL,
  proof_image_url VARCHAR(500) NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  review_note VARCHAR(500) NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  UNIQUE KEY uq_user_task_submission (task_id, user_id),
  INDEX idx_submission_status (status, submitted_at),
  CONSTRAINT fk_submission_task FOREIGN KEY (task_id) REFERENCES tasks(id),
  CONSTRAINT fk_submission_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  method ENUM('bkash','nagad','rocket') NOT NULL,
  phone_number VARCHAR(32) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  fee DECIMAL(14,2) NOT NULL,
  net_amount DECIMAL(14,2) NOT NULL,
  status ENUM('pending','completed','refunded') NOT NULL DEFAULT 'pending',
  admin_note VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_withdrawals_status (status, created_at),
  CONSTRAINT fk_withdrawal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS deposit_requests (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  method ENUM('bkash','nagad','rocket') NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  sender_number VARCHAR(32) NOT NULL,
  transaction_ref VARCHAR(100) NOT NULL,
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  admin_note VARCHAR(500) NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  UNIQUE KEY uq_deposit_method_ref (method, transaction_ref),
  INDEX idx_deposit_status_created (status, created_at),
  CONSTRAINT fk_deposit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_deposit_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(60) NULL,
  target_id VARCHAR(80) NULL,
  ip_address VARCHAR(45) NULL,
  details JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created (created_at),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);
