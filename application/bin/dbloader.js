"use strict";
const mysql = require("mysql2/promise");

require("dotenv").config();

function displayWarningMessage(warning) {
  switch (warning.Code) {
    case 1007:
      console.log(`Skipping Database Creation --> ${warning.Message}`);
      break;
    case 1050:
      console.log(`Skipping Table Creation --> ${warning.Message}`);
      break;
  }
}

async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST,
    //TODO make sure to change to the user you want to use
    user: process.env.DB_USER, //Your DB username
    //TODO make sure to change to the correct password for your user.
    password: process.env.DB_PASSWORD, //Your DB password
  });
}

async function makeDatabase(connection) {
  //TODO make sure to change yourdbnamehere
  const [result, _] = await connection.query(
    `CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME};`
  );
  if (result && result.warningStatus > 0) {
    const [warningResult, _] = await connection.query("SHOW WARNINGS");
    displayWarningMessage(warningResult[0]);
  } else {
    console.log("Created Database!");
  }
}

async function makeUsersTable(connection) {
  const [result, _] = await connection.query(
    `
    CREATE TABLE IF NOT EXISTS ${process.env.DB_NAME}.users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      email VARCHAR(128) NOT NULL,
      password VARCHAR(255) NOT NULL,
      username VARCHAR(64) NOT NULL,
      profileImg VARCHAR(128) NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT current_timestamp,
      updatedAt DATETIME NOT NULL DEFAULT current_timestamp,
      PRIMARY KEY (id),
      UNIQUE INDEX id_UNIQUE (id ASC) VISIBLE,
      UNIQUE INDEX email_UNIQUE (email ASC) VISIBLE)
    ENGINE = InnoDB
    `
  );

  if (result && result.warningStatus > 0) {
    const [warningResult, _] = await connection.query("SHOW WARNINGS");
    displayWarningMessage(warningResult[0]);
  } else {
    console.log("Created Users Table!");
  }
}

async function makePostsTable(connection) {
  const [result, _] = await connection.query(
    // Posts Table SQL Goes here
    `
    CREATE TABLE IF NOT EXISTS ${process.env.DB_NAME}.posts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(45) NOT NULL,
      description MEDIUMTEXT NOT NULL,
      video VARCHAR(4096) NULL,
      createdAt DATETIME NOT NULL DEFAULT current_timestamp,
      updatedAt DATETIME NOT NULL DEFAULT current_timestamp,
      thumbnail VARCHAR(4096) NULL,
      fk_userId INT UNSIGNED NOT NULL,
      PRIMARY KEY (id),
      INDEX fk_postAuthor_idx (fk_userId ASC) VISIBLE,
      CONSTRAINT fk_postAuthor
        FOREIGN KEY (fk_userId)
        REFERENCES ${process.env.DB_NAME}.users (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION)
    ENGINE = InnoDB
    `
  );
  if (result && result.warningStatus > 0) {
    const [warningResult, _] = await connection.query("SHOW WARNINGS");
    displayWarningMessage(warningResult[0]);
  } else {
    console.log("Created Posts Table!");
  }
}

async function makeCommentsTable(connection) {
  const [result, _] = await connection.query(
    // Comments Table SQL Goes here
    `
    CREATE TABLE IF NOT EXISTS ${process.env.DB_NAME}.comments (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      createdAt DATETIME NOT NULL DEFAULT current_timestamp,
      text TEXT NOT NULL,
      fk_authorId INT UNSIGNED NOT NULL,
      updatedAt DATETIME NOT NULL DEFAULT current_timestamp,
      fk_postId INT UNSIGNED NOT NULL,
      PRIMARY KEY (id),
      UNIQUE INDEX id_UNIQUE (id ASC) VISIBLE,
      INDEX fk_comment_author_idx (fk_authorId ASC) VISIBLE,
      INDEX fk_postId_idx (fk_postId ASC) VISIBLE,
      CONSTRAINT fk_comment_author
        FOREIGN KEY (fk_authorId)
        REFERENCES ${process.env.DB_NAME}.users (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION,
      CONSTRAINT fk_postId
        FOREIGN KEY (fk_postId)
        REFERENCES ${process.env.DB_NAME}.posts (id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION)
    ENGINE = InnoDB
    `
  );
  if (result && result.warningStatus > 0) {
    const [warningResult, _] = await connection.query("SHOW WARNINGS");
    displayWarningMessage(warningResult[0]);
  } else {
    console.log("Created Comments Table!");
  }
}

(async function main() {
  let connection = null;
  try {
    connection = await getConnection();
    await makeDatabase(connection); // make DB
    //TODO make sure to change yourdbnamehere
    await connection.query(`USE ${process.env.DB_NAME}`); // set new DB to the current DB
    await makeUsersTable(connection); // try to make user table
    await makePostsTable(connection); // try to make posts table
    await makeCommentsTable(connection); // try to make comments table
    connection.close();
    return;
  } catch (error) {
    console.error(error);
    if (connection != null) {
      connection.close();
    }
  }
})();