DROP DATABASE IF EXISTS fundflow;
CREATE DATABASE fundflow;

/*CREATE USER 'fundflow'@'%' IDENTIFIED BY 'y0uNever$ee4CumM4n';
GRANT ALL PRIVILEGES ON fundflow.* TO 'fundflow'@'%';
FLUSH PRIVILEGES;*/

USE fundflow;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role BOOLEAN DEFAULT FALSE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(50),
    lastName VARCHAR(50),
    biography VARCHAR(250),
    hashPassword VARCHAR(250) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    profilePictureSrc VARCHAR(250),
    bannerPictureSrc VARCHAR(250),
    registerDate VARCHAR(12),
    action VARCHAR(50),
    code VARCHAR(50),
    codeDate VARCHAR(12)
);

CREATE TABLE followsUsers (
	id BIGINT AUTO_INCREMENT PRIMARY KEY,
    idFollowingUser BIGINT UNSIGNED,
    idFollowedUser BIGINT UNSIGNED,
    -- PRIMARY KEY (idFollowingUser, idFollowedUser),
    FOREIGN KEY (idFollowingUser) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (idFollowedUser) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE
);

CREATE TABLE projects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    idCategory BIGINT UNSIGNED NOT NULL,
    idUser BIGINT UNSIGNED,
    title VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    about VARCHAR(250),
    priceGoal BIGINT UNSIGNED DEFAULT NULL,
    currency VARCHAR(10) DEFAULT NULL,
    collGoal BIGINT UNSIGNED DEFAULT NULL,
    creationDate DATE NOT NULL,
    deadlineDate DATE NOT NULL,
    coverImageSrc VARCHAR(250),
    FOREIGN KEY (idCategory) REFERENCES categories(id),
    FOREIGN KEY (idUser) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE tiers (
	id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
	idProject BIGINT UNSIGNED NOT NULL,
	description VARCHAR(250),
	price DOUBLE NOT NULL,
	srcImage VARCHAR(250),
	FOREIGN KEY (idProject) REFERENCES projects(id) 
);

-- Default categories
INSERT INTO categories (name) VALUES ('Art'), ('Music'), ('Books'), ('Games'), ('Innove'), ('Dev');

-- Admin User
-- If this user is not created some tests in the backend will fail
INSERT INTO users (`role`, username, email, hashPassword, verified)
VALUES (true, 'admin', 'arcedo.marc@gmail.com', '$2b$10$uqYGJ4JB/ijaFZWCYePMrOH8ZwMGrUTuIATE09/Lwn7648Sod4u7K', true);

-- CREATE TABLE sponsors (
--    idProject BIGINT UNSIGNED NOT NULL,
--    idUser BIGINT UNSIGNED NOT NULL,
--    PRIMARY KEY (idProject, idUser),
--    FOREIGN KEY (idProject) REFERENCES projects(id),
--    FOREIGN KEY (idUser) REFERENCES users(id)
-- );

-- CREATE TABLE collaborators (
--     idProject BIGINT UNSIGNED NOT NULL,
--     idUser BIGINT UNSIGNED NOT NULL,
--     PRIMARY KEY (idProject, idUser),
--     FOREIGN KEY (idProject) REFERENCES projects(id),
--     FOREIGN KEY (idUser) REFERENCES users(id)
-- );

-- CREATE TABLE blockedUsers (
--     id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
--     idUser BIGINT UNSIGNED NOT NULL,
--     blockDateStart DATE,
--     blockDateFinish DATE,
--     FOREIGN KEY (idUser) REFERENCES users(id)
-- );

-- CREATE TABLE projectBlogs (
--     id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
--     idProject BIGINT UNSIGNED NOT NULL,
--     title VARCHAR(50),
--     subtitle VARCHAR(50),
--     body VARCHAR(250),
--     FOREIGN KEY (idProject) REFERENCES projects(id)
-- );