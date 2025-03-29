drop database if exists site;
create database if not exists site;
use site;

drop table if exists user_statuses;
create table user_statuses(
	id int unsigned auto_increment not null,
	image_link text NOT NULL,
	link text NOT NULL,
	primary key(id)
);

drop table if exists user_statuses;
create table user_statuses(
	id int unsigned auto_increment not null,
	name varchar(256) not null,
	primary key(id)
);ALTER TABLE user_statuses AUTO_INCREMENT=0;

drop table if exists users;
CREATE table users(
	id int unsigned auto_increment not null,
	login varchar(256) not null UNIQUE,
	email VARCHAR(256) NOT NULL UNIQUE,
	password text not null,
	style_color int unsigned not null default 150,
	status int unsigned not null,
	primary key(id),
	FOREIGN KEY (status)
	REFERENCES user_statuses(id)
);ALTER TABLE users AUTO_INCREMENT=0;

drop table if exists image_statuses;
create table image_statuses(
	id int unsigned auto_increment not null,
	name varchar(256) not null,
	primary key(id)
);ALTER TABLE image_statuses AUTO_INCREMENT=0;

drop table if exists trusted_tags;
CREATE TABLE trusted_tags(
	id int unsigned auto_increment not null,
	name varchar(256) not null,
	primary key(id)
);ALTER TABLE trusted_tags AUTO_INCREMENT=0;

-- drop table if exists untrusted_tags;
-- CREATE TABLE untrusted_tags(
-- 	id int unsigned auto_increment not null,
-- 	name varchar(256) not null,
-- 	primary key(id)
-- );ALTER TABLE untrusted_tags AUTO_INCREMENT=0;

drop table if exists images;
CREATE TABLE images(
	id varchar(256) not NULL,
	user_id int unsigned not null,
	`date` datetime NOT NULL,
	ext text,

	cut_pos_x int unsigned default 0,
	cut_pos_y int unsigned default 0,
	cut_size_x int unsigned default 200,
	cut_size_y int unsigned default 200,

	approver int unsigned,
	status int unsigned not null,
	`desc` text,
	primary key(id),
	FOREIGN KEY (user_id)
	REFERENCES users(id) ON DELETE cascade,
	FOREIGN KEY (approver)
	REFERENCES users(id),
	FOREIGN KEY (status)
	REFERENCES image_statuses(id)
);

drop table if exists trusted_tags_connections;
CREATE TABLE trusted_tags_connections(
	image_id varchar(256) not NULL,
	tag_id int unsigned auto_increment not null,
	FOREIGN KEY (image_id)
	REFERENCES images(id) ON DELETE cascade,
	FOREIGN KEY (tag_id)
	REFERENCES trusted_tags(id) ON DELETE cascade
);


drop table if exists votes;
CREATE TABLE votes (
    image_id VARCHAR(256) NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    `type` BOOLEAN NOT NULL,
    `date` DATEtime not null,
    PRIMARY KEY (image_id, user_id),
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE cascade,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
);

drop table if exists advertisements;
CREATE TABLE advertisements(
	id int unsigned auto_increment not null,
	adder int unsigned not null,
	`date` date NOT NULL,
	img_url_link text not null,
	adv_url_link text not null,
	avalible bool default true,
	primary key(id),
	FOREIGN KEY (adder)
	REFERENCES users(id)
);ALTER TABLE users AUTO_INCREMENT=0;

-- drop table if exists untrusted_tags_connections;
-- CREATE TABLE untrusted_tags_connections(
-- 	image_id varchar(256) not NULL,
-- 	tag_id int unsigned auto_increment not null,
-- 	FOREIGN KEY (image_id)
-- 	REFERENCES images(id),
-- 	FOREIGN KEY (tag_id)
-- 	REFERENCES untrusted_tags(id)
-- );

INSERT INTO user_statuses(name) values 
("пользователь"),
("редактор"),
("администратор")
;
select * from user_statuses;

INSERT INTO image_statuses(name) values 
("черновик"),
("опубликовано")
;
select * from image_statuses;

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

/*INSERT INTO untrusted_tags (name) VALUES
("природа кавказа"),
("тест загрузки данных"),
("создано в 2024 году");*/

INSERT INTO images (id, user_id, `date`, ext,  approver, status, `desc`) VALUES
("0", 1, date_add(NOW(), INTERVAL -2 day), "jpg", 3, 2, "Красивый вид на ORI"),
("1", 3, date_add(NOW(), INTERVAL -3 day), "svg", 3, 2, ""),
("2", 2,date_add(NOW(), INTERVAL -1 minute), "svg", 3, 2, "Красивый вид на ORI"),
("3", 3, date_add(NOW(), INTERVAL -3 day), "svg", 3, 2, ""),
("4", 1, NOW(), "jpg", 3, 2, "Красивый вид на горы")/*
("539d4c48e4984a7b368ba75d252d3ec6", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ec5", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ec4", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ec3", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ec2", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ec1", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ec0", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ea9", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ea8", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ea7", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ea6", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ea5", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ea4", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ea3", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ea2", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ea1", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ea0", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3es9", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3es8", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3es7", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3es6", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3es5", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3es4", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3es3", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3es2", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3es1", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3es0", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ed9", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ed8", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ed7", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ed6", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ed5", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ed4", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ed3", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ed2", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ed1", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ed0", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ef9", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ef8", 2, Now(), "svg", 3, 2, "Красивый вид на ORI"),
("539d4c48e4984a7b368ba75d252d3ef7", 2, Now(), "svg", 3, 2, "Красивый вид на ORI")*/
;

INSERT INTO trusted_tags_connections (image_id, tag_id) VALUES
("4", 1),
("4", 2),
("4", 3),
("2", 2),
("2", 3),
("2", 4),
("2", 6),
("0", 6),
("0", 3),
("0", 7)
;

-- INSERT INTO untrusted_tags_connections (image_id, tag_id) VALUES
-- ("4", 1),
-- ("4", 2),
-- ("2", 1),
-- ("2", 3)
-- ;


INSERT INTO advertisements (adder, `date`, adv_url_link, img_url_link) values
(4, NOW(),"https://www.google.com/","/adv/0.jpg"),
(4, NOW(),"https://ya.ru/","/adv/or.svg")
;

DELIMITER //

CREATE PROCEDURE getAllImagesIfOwner(IN id1 INT, IN id2 INT)
BEGIN
    IF id1 = id2 THEN
        SELECT 
        i.id,
        i.user_id,
        i.date,
        i.ext,
        i.cut_pos_x,
        i.cut_pos_y,
        i.cut_size_x,
        i.cut_size_y,
        i.approver,
        i.status,
        i.desc,
        (
            SELECT COUNT(v.image_id) 
            FROM votes v 
            WHERE v.type = 1 AND v.image_id = i.id
        ) AS likes,
        (
            SELECT COUNT(v.image_id) 
            FROM votes v 
            WHERE v.type = 0 AND v.image_id = i.id
        ) AS dislikes
    FROM 
        images i
    WHERE 
        i.user_id = id1
    GROUP BY 
        i.id
    ORDER BY 
   		i.date asc;
    ELSE
        SELECT
	        i.id,
	        i.user_id,
	        i.date,
	        i.ext,
	        i.cut_pos_x,
	        i.cut_pos_y,
	        i.cut_size_x,
	        i.cut_size_y,
	        i.approver,
	        i.status,
	        i.desc,
	        (
	            SELECT COUNT(v.image_id) 
	            FROM votes v 
	            WHERE v.type = 1 AND v.image_id = i.id
	        ) AS likes,
	        (
	            SELECT COUNT(v.image_id) 
	            FROM votes v 
	            WHERE v.type = 0 AND v.image_id = i.id
	        ) AS dislikes
	    FROM 
	        images i
	    WHERE 
	        i.user_id = id1 AND i.status = 2
	    ORDER BY
	   		i.date asc;
	    END IF; 
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE getImageDetails(IN imageId VARCHAR(256))
BEGIN
    SELECT 
        i.id,
        i.user_id,
        i.date,
        i.ext,
        i.cut_pos_x,
        i.cut_pos_y,
        i.cut_size_x,
        i.cut_size_y,
        i.approver,
        i.status,
        i.desc,
        COALESCE(SUM(CASE WHEN v.type = 1 THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN v.type = 0 THEN 1 ELSE 0 END), 0) AS dislikes
    FROM 
        images i
    LEFT JOIN 
        votes v ON i.id = v.image_id
    WHERE 
        i.id = imageId
    GROUP BY 
        i.id;
END //

DELIMITER ;

DELIMITER //

CREATE PROCEDURE makeVote(
    IN p_user_id INT UNSIGNED, 
    IN p_image_id VARCHAR(256), 
    IN p_vote BOOLEAN ) BEGIN
    DECLARE existing_vote BOOLEAN;

    -- Проверяем, существует ли запись о голосе
    SELECT `type`
    INTO existing_vote
    FROM votes
    WHERE image_id = p_image_id AND user_id = p_user_id;

    -- Если запись существует
    IF existing_vote IS NOT NULL THEN
        IF existing_vote = p_vote THEN
            -- Если голос совпадает, удаляем запись
            DELETE FROM votes
            WHERE image_id = p_image_id AND user_id = p_user_id;
        ELSE
            -- Если голос отличается, обновляем запись
            UPDATE votes
            SET `type` = p_vote, `date` = NOW()
            WHERE image_id = p_image_id AND user_id = p_user_id;
        END IF;
    ELSE
        -- Если записи нет, добавляем новый голос
        INSERT INTO votes (image_id, user_id, `type`, `date`)
        VALUES (p_image_id, p_user_id, p_vote, NOW());
    END IF;
END;

//
DELIMITER ;


--ЭТА ХУЙНЯ НЕПРАВИЛЬНО РАБОТАЕТ
DELIMITER $$

DROP PROCEDURE IF EXISTS search_images $$

CREATE PROCEDURE search_images(
    IN page INT,              -- Номер страницы
    IN `count` INT,           -- Количество записей на странице
    IN users_id TEXT,         -- Номера пользователей (через запятую)
    IN positive_tags TEXT,    -- Список позитивных тегов (целые числа через запятую)
    IN negative_tags TEXT,    -- Список негативных тегов (целые числа через запятую)
    IN order_type INT,        -- Тип сортировки 0=ASC, 1=DESC
    IN date_start DATE,       -- Начало поиска
    IN date_end DATETIME      -- Конец поиска
)
BEGIN
    DECLARE offset_value INT;
    SET offset_value = page * `count`;

    -- Динамическое построение SQL-запроса
    SET @query := CONCAT(
        'SELECT 
            i.id,
            i.ext,
            i.user_id,
            (SELECT login FROM users WHERE users.id = i.user_id) AS user_login,
            i.cut_pos_x,
            i.cut_pos_y,
            i.cut_size_x,
            i.cut_size_y,
            (
                SELECT COUNT(v.image_id) 
                FROM votes v 
                WHERE v.type = 1 AND v.image_id = i.id
            ) AS likes,
            (
                SELECT COUNT(v.image_id) 
                FROM votes v 
                WHERE v.type = 0 AND v.image_id = i.id
            ) AS dislikes
        FROM 
            images i
        WHERE 
            i.date BETWEEN ', QUOTE(date_start), ' AND ', QUOTE(date_end), ' ',

            -- Условие для позитивных тегов
            IF(positive_tags IS NOT NULL AND positive_tags != '', 
                CONCAT(
                    'AND i.id IN (
                        SELECT image_id 
                        FROM trusted_tags_connections 
                        WHERE tag_id IN (', positive_tags, ')
                        GROUP BY image_id
                        HAVING COUNT(DISTINCT tag_id) = ', 
                        (LENGTH(positive_tags) - LENGTH(REPLACE(positive_tags, ",", "")) + 1), '
                    ) '
                ), 
                ''
            ),

            -- Условие для негативных тегов
            IF(negative_tags IS NOT NULL AND negative_tags != '', 
                CONCAT(
                    'AND NOT EXISTS (
                        SELECT 1 
                        FROM trusted_tags_connections ttc_neg
                        WHERE ttc_neg.image_id = i.id 
                        AND ttc_neg.tag_id IN (', negative_tags, ')
                    ) '
                ), 
                ''
            ),

            -- Условие для авторов
            IF(users_id IS NOT NULL AND users_id != '', 
                CONCAT('AND i.user_id IN (', users_id, ') '), 
                ''
            ),

            'GROUP BY 
                i.id, i.ext, i.user_id
            ORDER BY 
                i.date ', IF(order_type=0,'ASC','DESC'), '
            LIMIT ', `count`, ' OFFSET ', offset_value
    );

    -- Выполнение динамического SQL-запроса
    PREPARE stmt FROM @query;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END $$

DELIMITER ;

/*
select * from users;
select * from trusted_tags_connections;
select * from trusted_tags;
select * from untrusted_tags;
call getImageDetails("4");
select * from images ;
call makeVote(2,"4",1);
call makeVote(2,"0",1);
call makeVote(4,"4",0);
call makeVote(3,"4",0);
call makeVote(4,"0",0);
call makeVote(3,"0",1);
call makeVote(3,"2",1);
call makeVote(4,"2",1);
SELECT * FROM votes;
SELECT * FROM advertisements;
SELECT name FROM trusted_tags WHERE name LIKE CONCAT('%', "с", '%');

call getAllImagesIfOwner(2,2);

SELECT *
FROM images i
WHERE i.id IN (
    SELECT ttc.image_id 
    FROM trusted_tags_connections ttc 
    WHERE ttc.tag_id IN (1, 2, 3, 4, 5, 6)
) ORDER BY i.date desc;

SELECT 
    i.id,
    i.ext,
    i.desc,
    i.status,
    u.login AS author_name,
    u.id AS author_id,
    GROUP_CONCAT(t.id SEPARATOR ', ') AS tag_ids,
    GROUP_CONCAT(t.name SEPARATOR ', ') AS tags,
    (
        SELECT COUNT(v.image_id) 
        FROM votes v 
        WHERE v.type = 1 AND v.image_id = i.id
    ) AS likes,
    (
        SELECT COUNT(v.image_id) 
        FROM votes v 
        WHERE v.type = 0 AND v.image_id = i.id
    ) AS dislikes,
    (
        SELECT v.type
        FROM votes v
        WHERE v.image_id = i.id AND v.user_id = 1
        LIMIT 1
    ) AS action
FROM 
    images i
LEFT JOIN 
    trusted_tags_connections tc ON i.id = tc.image_id
LEFT JOIN 
    trusted_tags t ON tc.tag_id = t.id
LEFT JOIN 
    users u ON i.user_id = u.id
WHERE 
    i.id = "4"
GROUP BY 
    i.id, i.ext, i.status, u.login, u.id;
call search_images(0,100,'','','',0,'2020-01-01',date_add(CURDATE(), INTERVAL 1 day));
select min(i.date),max(i.date) from images i ;
select date_add(CURDATE(), INTERVAL 1 day) as END_DATE ;

SELECT 
    tt.name AS tag_name,
    COUNT(ttc.tag_id) AS tag_count
FROM 
    users u
JOIN 
    images i ON u.id = i.user_id
JOIN 
    trusted_tags_connections ttc ON i.id = ttc.image_id
JOIN 
    trusted_tags tt ON ttc.tag_id = tt.id
WHERE 
    u.id = 2 -- ID автора, для которого ищем популярные теги
    AND (
        SELECT COUNT(v1.image_id)
        FROM votes v1
        WHERE v1.image_id = i.id AND v1.type = 1
    ) > (
        SELECT COUNT(v2.image_id)
        FROM votes v2
        WHERE v2.image_id = i.id AND v2.type = 0
    )
GROUP BY 
    tt.name
ORDER BY 
    tag_count DESC;

select id,date from images where date between '2024-01-01' and '2025-12-31';

call search_images(0,100,'','','',0,curdate(),date_add(CURDATE(), INTERVAL 1 day));

*/