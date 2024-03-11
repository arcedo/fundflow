DROP DATABASE IF EXISTS fundflow;
CREATE DATABASE fundflow;

/*CREATE USER 'fundflow'@'%' IDENTIFIED BY 'y0uNever$ee4CumM4n';
GRANT ALL PRIVILEGES ON fundflow.* TO 'fundflow'@'%';
FLUSH PRIVILEGES;*/

USE fundflow;

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(30) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(50),
    lastName VARCHAR(50),
    biography VARCHAR(250),
    hashPassword VARCHAR(250),
    verified BOOLEAN DEFAULT FALSE,
    profilePictureSrc VARCHAR(250),
    bannerPictureSrc VARCHAR(250),
    registerDate VARCHAR(12)
);

CREATE TABLE followsUsers (
    idFollowingUser BIGINT UNSIGNED NOT NULL,
    idFollowedUser BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (idFollowingUser, idFollowedUser),
    FOREIGN KEY (idFollowingUser) REFERENCES users(id),
    FOREIGN KEY (idFollowedUser) REFERENCES users(id)
);

CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE projects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    idCategory BIGINT UNSIGNED NOT NULL,
    idUser BIGINT UNSIGNED NOT NULL,
    title VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    about VARCHAR(250),
    priceGoal BIGINT UNSIGNED NOT NULL,
    collGoal BIGINT UNSIGNED NOT NULL,
    creationDate DATE,
    deadlineDate DATE,
    views BIGINT UNSIGNED NOT NULL,
    coverImageSrc VARCHAR(250),
    FOREIGN KEY (idCategory) REFERENCES categories(id),
    FOREIGN KEY (idUser) REFERENCES users(id)
);

CREATE TABLE sponsors (
    idProject BIGINT UNSIGNED NOT NULL,
    idUser BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (idProject, idUser),
    FOREIGN KEY (idProject) REFERENCES projects(id),
    FOREIGN KEY (idUser) REFERENCES users(id)
);

CREATE TABLE collaborators (
    idProject BIGINT UNSIGNED NOT NULL,
    idUser BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (idProject, idUser),
    FOREIGN KEY (idProject) REFERENCES projects(id),
    FOREIGN KEY (idUser) REFERENCES users(id)
);

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

CREATE TABLE tiers (
	id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
	idProject BIGINT UNSIGNED NOT NULL,
	description VARCHAR(250),
	price DOUBLE UNSIGNED NOT NULL,
	srcImage VARCHAR(250),
	FOREIGN KEY (idProject) REFERENCES projects(id)
);

-- Default categories
INSERT INTO categories (name) VALUES ('Art'), ('Music'), ('Books'), ('Games'), ('Innove'), ('Dev');



