const dashboard = require('dashboard_framework');
const { prepareDB, prepareEND, telegram_prepare } = require('mysql-tools');

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_TELEGRAM, DB_BEATMAPS } = require("../data/config.js");

module.exports = {

	prepareDB: async () => {

		try {
			await dashboard.change_status({name: 'db_ready', status: 'processing'});

			
			const connections = await prepareDB({
				DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DATABASES: { DB_TELEGRAM, DB_BEATMAPS }
			});

			const telegram_connection = connections.find( x=> x.name === DB_TELEGRAM )?.connection;
			const beatmaps_connection = connections.find( x=> x.name === DB_BEATMAPS )?.connection;

			if (!telegram_connection) {
				throw new Error('telegram_connection connection undefined');
			}

			if (!beatmaps_connection) {
				throw new Error('beatmaps_connection connection undefined');
			}

			telegram_prepare(telegram_connection, beatmaps_connection);
			
			await prepareEND();

			await dashboard.change_status({name: 'db_ready', status: 'ready'});

		} catch (e) {
			console.error(e);
			throw new Error(e);
		}

		return true;

	}
}