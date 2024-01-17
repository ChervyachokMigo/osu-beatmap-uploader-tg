const { Sequelize, DataTypes } = require('@sequelize/core');
const dashboard = require('dashboard_framework');

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = require("../data/config.js");


const mysql = new Sequelize( DB_NAME, DB_USER, DB_PASSWORD, { 
    dialect: `mysql`,
    define: {
        updatedAt: false,
        createdAt: false,
        deletedAt: false
    },
});

const sended_map_db = mysql.define ('sended_map', {
    beatmapset_id: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const map_to_download_db = mysql.define ('map_to_download', {
    beatmapset_id: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const map_not_found = mysql.define ('bancho_not_found', {
    beatmapset_id: { type: DataTypes.INTEGER, defaultValue: 0 },
});

const map_too_long = mysql.define ('map_too_long', {
    beatmapset_id: { type: DataTypes.INTEGER, defaultValue: 0 },
});

async function prepareDB (){
    try {
        console.log(`База данных`,`Подготовка..`);
        await dashboard.change_status({name: 'db_ready', status: 'processing'});
        const mysql_checkdb = require('mysql2/promise');
        const connection = await mysql_checkdb.createConnection(`mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);

    } catch (e){
        await dashboard.change_status({name: 'db_ready', status: 'not'});
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error('Нет доступа к базе');
        } else {
            throw new Error(`ошибка базы: ${e}`);
        }
    }
    await mysql.sync({ logging: ''});
    console.log(`База данных`,`Подготовка завершена`);
    await dashboard.change_status({name: 'db_ready', status: 'ready'});
}

async function MYSQL_SAVE( MysqlModel, keys, values){

    function MYSQL_MERGE_KEYS_VALUES ( keys, values ){
        return Object.assign({}, keys, values);
    }

    function upsert(Model, condition, values) {
        return Model
            .findOne({ where: condition, logging: '' })
            .then(function(obj) {
                try{
                    // update
                    if(obj)
                        return obj.update(values, {logging: ''});
                    // insert
                    return Model.create(values, {logging: ''});
                } catch (e){
                    if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
                        throw new Error('Нет доступа к базе');
                    } else {
                        throw new Error(`ошибка базы: ${e}`);
                    }
                }
            })
    }

    if (keys !== 0){
        values = MYSQL_MERGE_KEYS_VALUES(keys, values)
    }
    try {
        if (typeof values.length !== 'undefined' && values.length>0){
            return await MysqlModel.bulkCreate(values, {logging: ''})
        } else {
            return upsert(MysqlModel, keys, values );
        }
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }       
}

async function MYSQL_GET_ONE(MysqlModel, condition){
    try {
        var res = await MysqlModel.findOne({ where: condition , logging: ''});
        if (res == null){
            return false;
        } else {
            return res.dataValues;
        }
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }
}


async function MYSQL_GET_ALL(MysqlModel, condition = {}){
    try{
        return await MysqlModel.findAll ({
            where: condition, logging: ''
        });
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }    
}


async function MYSQL_DELETE(MysqlModel, condition){    
    try{
        return await MysqlModel.destroy({
            where: condition, logging: ''
        });
    } catch (e){
        if (e.code === 'ECONNREFUSED' || e.name === `SequelizeConnectionRefusedError`){
            throw new Error(`Нет доступа к базе данных.`);
        } else {
            throw new Error(e);
        }
    }   
}

function MYSQL_GET_ALL_RESULTS_TO_ARRAY(mysqldata){
    var res = [];
    if (mysqldata.length>0){
        for (let data of mysqldata){
            res.push(data.dataValues);
        }
    }
    return res;
}

module.exports = {
    prepareDB,
    MYSQL_SAVE,
    MYSQL_GET_ONE,
    MYSQL_DELETE,
    MYSQL_GET_ALL,

    MYSQL_GET_ALL_RESULTS_TO_ARRAY,

    sended_map_db,
    map_to_download_db,
    map_not_found,
    map_too_long,
}