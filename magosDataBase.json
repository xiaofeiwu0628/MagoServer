-- 用户表
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    register_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_time TIMESTAMP NULL DEFAULT NULL,
    client_auth TINYINT(1) DEFAULT 0 COMMENT '客户权限认证: 0-普通用户, 1-认证用户, 2-管理员',
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 机器人动作数据表
CREATE TABLE RobotActions (
    action_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    duration DECIMAL(10,2) NOT NULL COMMENT '执行时长(秒)',
    servo_angles JSON NOT NULL COMMENT '舵机角度值列表，格式: [angle1, angle2, ...]',
    status BOOLEAN DEFAULT TRUE COMMENT '状态值: TRUE-启用, FALSE-禁用',
    image_path VARCHAR(500) COMMENT '图片路径',
    description_text VARCHAR(1000) COMMENT '动作描述文字',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_time (created_time),
    
    CONSTRAINT fk_actions_user FOREIGN KEY (user_id) 
        REFERENCES Users(user_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 机器人动作组数据表
CREATE TABLE ActionGroups (
    group_id INT PRIMARY KEY AUTO_INCREMENT,
    group_name VARCHAR(100) NOT NULL,
    user_id INT NOT NULL,
    action_ids JSON NOT NULL COMMENT '动作ID数组，格式: [id1, id2, ...]',
    sequence_orders JSON COMMENT '动作顺序，格式: [order1, order2, ...]',
    created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_created_time (created_time),
    
    CONSTRAINT fk_groups_user FOREIGN KEY (user_id) 
        REFERENCES Users(user_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;