-- Create Players table
CREATE TABLE Players (
    player_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    nickname VARCHAR(50),
    password VARCHAR(20) NOT NULL
);

-- Create Games table
CREATE TABLE Sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    player_id INT,
    start_time DATETIME,
    end_time DATETIME,
    FOREIGN KEY (player_id) REFERENCES Players(player_id)
);

-- Create Session Details table
CREATE TABLE SessionDetails (
    sess_det_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT,
    attempts_per_game INT,
    average_attempt DECIMAL(5,2),
    FOREIGN KEY (session_id) REFERENCES Sessions(session_id)
);

-- Insert random data into Players table
INSERT INTO Players (username, nickname, password)
VALUES
    ('gamer123', 'TheGamer', 'P@ssw0rd1'),
    ('shadowNinja', 'NinjaX', 'N1nj@Sh@d0w'),
    ('quickSilver', 'Silv3rQ', 'QuickPass2'),
    ('stormBreaker', 'Stormy', 'Str0mBr3@k'),
    ('dragonWarrior', 'DragonW', 'W@rri0rD3');

-- Insert random data into Sessions table
INSERT INTO Sessions (player_id, start_time, end_time)
VALUES
    (1, '2024-08-18 10:00:00', '2024-08-18 10:30:00'),
    (2, '2024-08-18 11:00:00', '2024-08-18 11:25:00'),
    (3, '2024-08-18 12:00:00', '2024-08-18 12:20:00'),
    (4, '2024-08-18 13:00:00', '2024-08-18 13:40:00'),
    (5, '2024-08-18 14:00:00', '2024-08-18 14:35:00'),
    (1, '2024-08-18 14:00:00', '2024-08-18 14:35:00');

-- Insert random data into Session Details table
INSERT INTO SessionDetails (session_id, attempts_per_game, average_attempt)
VALUES
    (1, 5, 5),
    (1, 3, 5),
    (1, 4, 5),
    (1, 6, 5),
    (1, 7, 5),

    (2, 4, 5),
    (2, 4, 5),
    (2, 5, 5),
    (2, 6, 5),
    (2, 6, 5),

    (3, 6, 5.6),
    (3, 7, 5.6),
    (3, 5, 5.6),
    (3, 4, 5.6),
    (3, 6, 5.6),

    (4, 5, 6.2),
    (4, 5, 6.2),
    (4, 6, 6.2),
    (4, 7, 6.2),
    (4, 8, 6.2),

    (5, 3, 4.2),
    (5, 4, 4.2),
    (5, 4, 4.2),
    (5, 5, 4.2),
    (5, 5, 4.2),

    (6, 5, 6.2),
    (6, 5, 6.2),
    (6, 6, 6.2),
    (6, 7, 6.2),
    (6, 8, 6.2);