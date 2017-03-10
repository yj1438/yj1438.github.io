---
layout: post
title: nodejs mysql 工具类
---

# nodejs mysql 工具类

这是笔者一直在用的一个 mysql 工具类，自己写的，简单实用。

## 特征

* ES6 语法，如果用 commmonjs 的自己 babel 一下就好；
* 用连接池，默认提供了一些基本配置，保证一定的并发性能，实际应用中效果较好；
* 单例模式，避免多处引用出现的一些怪异问题；
* 只提供一个 `handle` 方法，和它的同步版本 `handleSync`，如果有其它需要可以自己加；

## 代码

直接帖代码更有效😁。

~~~javascript
import Mysql from 'mysql';

class Database {

    /**
     * 数据库默认配置项
     * @static
     * @memberOf Database
     */
    static DATABASE_INFO = {
        host: 'localhost',
        password: '123456',
        user: 'root',
        database: 'user',
        multipleStatements: true,
        acquireTimeout: 3000,
        waitForConnections: true,
        connectionLimit: 2048,
        queueLimit: 600,
    };

    /**
     * 取数据库单例
     * @static
     * @returns 
     * @memberOf Database
     */
    static getInstance () {
        if (!Database.instance) {
            Database.instance = new Database(Database.DATABASE_INFO);
        }
        return Database.instance;
    }

    constructor (databaseConfig) {
        this.DB_POOL = Mysql.createPool(databaseConfig);
    }
    
    /**
     * 从连接池中获取一个连接
     * @returns 
     * @memberOf Database
     */
    _getConnection() {
        return new Promise((resolve, reject) => {
            this.DB_POOL.getConnection((err, connection) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(connection);
                }
            });
        });
    }
    /**
     * 数据库执行 SQL 方法
     * @static
     * @param {string} sql
     * @param {any} data
     * @param {function} callback
     * @memberOf Database
     */
    handle(sql, data, callback) {
        this._getConnection()
            .then((connection) => {
                connection.query(sql, data, (err, result) => {
                    if (err) {
                        console.log(new Date() + ' sql: error' + err);
                        return;
                    }
                    typeof callback === 'function' && callback.call(connection, result);
                    connection.release();
                });
            })
            .catch((err) => {
                console.log(err);
            });
    }
    /**
     * 数据库执行 SQL 方法
     * sync
     * @static
     * @param {string} sql
     * @param {any} data
     * @returns Promise
     * @memberOf Database
     */
    async handleSync(sql, data) {
        let connection = null;
        try {
            connection = await this._getConnection();
        } catch (err) {
            console.log(err);
        }
        return new Promise((resolve, reject) => {
            if (connection) {
                connection.query(sql, data, (err, result) => {
                    /**
                     * sql检控
                     */
                    // console.log(new Date() + ': sql>>> ' + sql + ' data>>> ' + JSON.stringify(data));
                    if (err) {
                        console.log('sql: error' + err);
                        reject(err);
                        return;
                    }
                    resolve(result);
                    connection.release();
                });
            } else {
                reject('数据库链接获取失败');
            }
        });
    }
}

export default Database.getInstance();
~~~

## 使用注意

建议用 nodejs 7.0 以上版本，否则记得彻底 babel 成 es5 降级。

nodejs 7.0 以上仅需要 `transform-es2015-modules-commonjs`、`transform-class-properties` 两项 babel。