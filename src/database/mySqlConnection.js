const mysql = require('mysql2');

const state = {
    pool: null,
    promisePool: null
};

exports.connect = function (db, done) {
    if (db.host) {
        state.pool = mysql.createPool({
            host: db.host,
            port: db.port,
            user: db.user,
            password: db.password,
            database: db.database,
            connectionLimit: db.connectionLimit
        });
    } else {
        state.pool = mysql.createPool({
            host: db.host,
            user: db.user,
            password: db.password,
            database: db.database,
            connectionLimit: db.connectionLimit
        });
    }
    state.promisePool = state.pool.promise();

    done();
};

exports.get = function () {
    return state.pool;
};

exports.getPromise = function () {
    return state.promisePool;
};