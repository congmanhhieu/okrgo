-- 1. TÀI KHOẢN ĐỊNH DANH TOÀN CẦU
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    birth_date DATE,
    address VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TỔ CHỨC (TENANTS/COMPANIES)
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG PHÒNG BAN: Phải sinh trước CompanyUsers để CompanyUsers có thể trỏ DepartmentID vào
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    manager_id INT, -- Sẽ nối mềm tới bảng company_users để tránh vòng lặp khóa
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- LỜI MỜI THAM GIA CÔNG TY
CREATE TABLE IF NOT EXISTS company_invitations (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TƯ CÁCH THÀNH VIÊN TRONG CÔNG TY (Multi-tenant junction)
CREATE TABLE IF NOT EXISTS company_users (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'user', -- admin, manager, user
    position VARCHAR(255),
    manager_id INT REFERENCES users(id) ON DELETE SET NULL,
    stars_balance INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, user_id) -- Một người dùng chỉ tham gia 1 công ty 1 lần
);

-- 3. CHU KỲ OKRs
CREATE TABLE IF NOT EXISTS cycles (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. OBJECTIVES & KEY RESULTS
CREATE TABLE IF NOT EXISTS objectives (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    level VARCHAR(50) NOT NULL, -- 'company', 'department', 'personal'
    owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cycle_id INT NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    progress NUMERIC(5, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'on_track',
    start_date DATE,
    end_date DATE,
    confidence_level VARCHAR(50) DEFAULT 'confident',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS key_results (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    objective_id INT NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    start_value NUMERIC(15, 2) DEFAULT 0.00,
    current_value NUMERIC(15, 2) DEFAULT 0.00,
    target_value NUMERIC(15, 2) NOT NULL,
    owner_id INT REFERENCES users(id) ON DELETE SET NULL,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS check_ins (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    key_result_id INT NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value NUMERIC(15, 2) NOT NULL,
    progress_percent NUMERIC(5, 2),
    comment TEXT,
    problem TEXT,
    cause TEXT,
    solution TEXT,
    confidence_level VARCHAR(50),
    execution_speed VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CÔNG VIỆC CHUNG & TODAYLIST
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee_id INT REFERENCES users(id) ON DELETE SET NULL,
    creator_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    priority VARCHAR(50) DEFAULT 'not_urgent_important', -- urgent_important, urgent_not_important, not_urgent_important, not_urgent_not_important
    status VARCHAR(50) DEFAULT 'todo', -- todo, in_progress, done
    progress INT DEFAULT 0, -- 0-100
    linked_objective_id INT REFERENCES objectives(id) ON DELETE SET NULL,
    linked_kr_id INT REFERENCES key_results(id) ON DELETE SET NULL,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_watchers (
    id SERIAL PRIMARY KEY,
    task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(task_id, user_id)
);

CREATE TABLE IF NOT EXISTS today_lists (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time VARCHAR(10),         -- e.g. "08:00"
    end_time VARCHAR(10),           -- e.g. "09:30"
    priority VARCHAR(50) DEFAULT 'medium', -- important, less_important, not_important
    is_completed BOOLEAN DEFAULT false,
    linked_objective_id INT REFERENCES objectives(id) ON DELETE SET NULL,
    related_user_id INT REFERENCES users(id) ON DELETE SET NULL,
    task_date DATE NOT NULL DEFAULT CURRENT_DATE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. PHẢN HỒI & KUDO
CREATE TABLE IF NOT EXISTS feedbacks (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    advice TEXT,
    linked_objective_id INT REFERENCES objectives(id) ON DELETE SET NULL,
    linked_kr_id INT REFERENCES key_results(id) ON DELETE SET NULL,
    linked_task_id INT REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kudos (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content VARCHAR(280) NOT NULL,
    stars_attached INT DEFAULT 0,
    criteria_id INT REFERENCES star_criteria(id) ON DELETE SET NULL,
    reference_text VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TIÊU CHÍ GHI NHẬN (Star Criteria for Kudo box)
CREATE TABLE IF NOT EXISTS star_criteria (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL DEFAULT 'culture', -- culture, objective, project, task
    stars INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. THƯỞNG SONG TÍNH & ĐỔI QUÀ
CREATE TABLE IF NOT EXISTS gifts (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    star_price INT NOT NULL,
    stock INT DEFAULT 0,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gift_orders (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gift_id INT NOT NULL REFERENCES gifts(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    star_cost INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. THÔNG BÁO (NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_key VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    url TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (company_id, user_id, group_key)
);

-- 9. COMPANY SETTINGS
CREATE TABLE IF NOT EXISTS company_settings (
    company_id INT PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    checkin_overdue_days INT DEFAULT 7,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
