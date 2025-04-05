DROP DATABASE IF EXISTS site;
CREATE DATABASE IF NOT EXISTS site;
USE site;

DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS trusted_tags_connections;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS trusted_tags;
DROP TABLE IF EXISTS image_statuses;
DROP TABLE IF EXISTS advertisements;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS user_statuses;
DROP TABLE IF EXISTS claims;


CREATE TABLE user_statuses(
    id INT UNSIGNED AUTO_INCREMENT NOT NULL,
    name VARCHAR(256) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE users(
    id INT UNSIGNED AUTO_INCREMENT NOT NULL,
    login VARCHAR(256) NOT NULL UNIQUE,
    email VARCHAR(256) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    style_color INT UNSIGNED NOT NULL DEFAULT 150,
    status INT UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (status) REFERENCES user_statuses(id) ON DELETE CASCADE
);

CREATE TABLE image_statuses(
    id INT UNSIGNED AUTO_INCREMENT NOT NULL,
    name VARCHAR(256) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE trusted_tags(
    id INT UNSIGNED AUTO_INCREMENT NOT NULL,
    name VARCHAR(256) NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE images(
    id VARCHAR(256) NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    `date` DATETIME NOT NULL,
    ext TEXT,
    cut_pos_x INT UNSIGNED DEFAULT 0,
    cut_pos_y INT UNSIGNED DEFAULT 0,
    cut_size_x INT UNSIGNED DEFAULT 200,
    cut_size_y INT UNSIGNED DEFAULT 200,
    status INT UNSIGNED NOT NULL,
    `desc` TEXT,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (status) REFERENCES image_statuses(id) ON DELETE CASCADE
);

CREATE TABLE trusted_tags_connections(
    image_id VARCHAR(256) NOT NULL,
    tag_id INT UNSIGNED NOT NULL,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES trusted_tags(id) ON DELETE CASCADE
);

CREATE TABLE votes (
    image_id VARCHAR(256) NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    `type` BOOLEAN NOT NULL,
    `date` DATETIME NOT NULL,
    PRIMARY KEY (image_id, user_id),
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE advertisements(
    id INT UNSIGNED AUTO_INCREMENT NOT NULL,
    adder INT UNSIGNED NOT NULL,
    `date` DATE NOT NULL,
    img_url_link TEXT NOT NULL,
    adv_url_link TEXT NOT NULL,
    available BOOL DEFAULT TRUE,
    PRIMARY KEY (id),
    FOREIGN KEY (adder) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO user_statuses(name) VALUES 
("пользователь"),
("редактор"),
("администратор");

INSERT INTO image_statuses(name) VALUES 
("черновик"),
("опубликовано");

INSERT INTO users (login, email, password, style_color, status) VALUES
("user1", "1@1", "$2b$10$eI4rpjivAnh5UFNaZ35/wOnPpWzTjZBLS1CujU0AkLMCiGz4F84/.", 120, 1),
("user2", "1-2@1", "$2b$10$eI4rpjivAnh5UFNaZ35/wOnPpWzTjZBLS1CujU0AkLMCiGz4F84/.", 120, 1),
("editor1", "2@1", "$2b$10$eI4rpjivAnh5UFNaZ35/wOnPpWzTjZBLS1CujU0AkLMCiGz4F84/.", 130, 2),
("admin1", "3@1", "$2b$10$eI4rpjivAnh5UFNaZ35/wOnPpWzTjZBLS1CujU0AkLMCiGz4F84/.", 150, 3);

INSERT INTO trusted_tags (name) VALUES 
("природа"),
("технологии"),
("искусство"),
("спорт"),
("музыка"),
("ORI"),
("референс");

INSERT INTO images (id, user_id, `date`, ext, status, `desc`) VALUES
("4", 1, NOW(), "png", 2, "Красивый вид на горы"),
("1", 2, NOW() - INTERVAL 1 MINUTE, "svg", 2, "Красивый вид на ORI"),
("0", 1, NOW() - INTERVAL 2 DAY, "jpg", 2, "Красивый вид на ORI"),
("3", 1, NOW() - INTERVAL 2 DAY, "svg", 2, "Красивый вид на ORI"),
("2", 3, NOW() - INTERVAL 3 DAY, "svg", 2, "");

INSERT INTO trusted_tags_connections (image_id, tag_id) VALUES
("2", 1), ("2", 2), ("2", 3),
("1", 2), ("1", 3), ("1", 4), ("1", 6),
("0", 6), ("0", 3), ("0", 7);

INSERT INTO advertisements (adder, `date`, adv_url_link, img_url_link) VALUES
(4, NOW(), "https://www.google.com/", "/adv/0.jpg"),
(4, NOW(), "https://ya.ru/", "/adv/or.svg");


DELIMITER //

CREATE PROCEDURE getAllImagesIfOwner(IN id1 INT, IN id2 INT)
BEGIN
    IF id1 = id2 THEN
        SELECT i.*, 
            (SELECT COUNT(*) FROM votes WHERE type = 1 AND image_id = i.id) AS likes,
            (SELECT COUNT(*) FROM votes WHERE type = 0 AND image_id = i.id) AS dislikes
        FROM images i WHERE i.user_id = id1 ORDER BY i.date ASC;
    ELSE
        SELECT i.*, 
            (SELECT COUNT(*) FROM votes WHERE type = 1 AND image_id = i.id) AS likes,
            (SELECT COUNT(*) FROM votes WHERE type = 0 AND image_id = i.id) AS dislikes
        FROM images i WHERE i.user_id = id1 AND i.status = 2 ORDER BY i.date ASC;
    END IF;
END //

CREATE PROCEDURE getImageDetails(IN imageId VARCHAR(256))
BEGIN
    SELECT i.*, 
        COALESCE(SUM(CASE WHEN v.type = 1 THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN v.type = 0 THEN 1 ELSE 0 END), 0) AS dislikes
    FROM images i
    LEFT JOIN votes v ON i.id = v.image_id
    WHERE i.id = imageId
    GROUP BY i.id;
END //

CREATE PROCEDURE makeVote(
    IN p_user_id INT UNSIGNED, 
    IN p_image_id VARCHAR(256), 
    IN p_vote BOOLEAN
)
BEGIN
    DECLARE existing_vote BOOLEAN;
    SELECT `type` INTO existing_vote FROM votes WHERE image_id = p_image_id AND user_id = p_user_id;
    IF existing_vote = p_vote THEN
        DELETE FROM votes WHERE image_id = p_image_id AND user_id = p_user_id;
    ELSEIF existing_vote IS NOT NULL THEN
        UPDATE votes SET `type` = p_vote, `date` = NOW() WHERE image_id = p_image_id AND user_id = p_user_id;
    ELSE
        INSERT INTO votes (image_id, user_id, `type`, `date`) VALUES (p_image_id, p_user_id, p_vote, NOW());
    END IF;
END //

CREATE PROCEDURE search_images(
    IN page INT, 
    IN count INT, 
    IN users_id TEXT, 
    IN positive_tags TEXT, 
    IN negative_tags TEXT, 
    IN order_type INT, 
    IN date_start DATE, 
    IN date_end DATETIME
)
BEGIN
    DECLARE offset_value INT;
    SET offset_value = page * count;
    SET @query = CONCAT(
        'SELECT i.*, (SELECT login FROM users WHERE users.id = i.user_id) AS user_login,
        (SELECT COUNT(*) FROM votes v WHERE v.type = 1 AND v.image_id = i.id) AS likes,
        (SELECT COUNT(*) FROM votes v WHERE v.type = 0 AND v.image_id = i.id) AS dislikes
        FROM images i WHERE i.date BETWEEN ', QUOTE(date_start), ' AND ', QUOTE(date_end)
    );
    IF positive_tags IS NOT NULL AND positive_tags != '' THEN
        SET @query = CONCAT(@query, ' AND i.id IN (SELECT image_id FROM trusted_tags_connections WHERE tag_id IN (', positive_tags, '))');
    END IF;
    IF negative_tags IS NOT NULL AND negative_tags != '' THEN
        SET @query = CONCAT(@query, ' AND NOT EXISTS (SELECT 1 FROM trusted_tags_connections WHERE image_id = i.id AND tag_id IN (', negative_tags, '))');
    END IF;
    SET @query = CONCAT(@query, ' ORDER BY i.date ', IF(order_type=0, 'ASC', 'DESC'), ' LIMIT ', count, ' OFFSET ', offset_value);
    PREPARE stmt FROM @query;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END //

DELIMITER ;
