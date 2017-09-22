var pg = require('pg');
var winston = require('winston');

var constants = require('./constants');

/**
 * Global variables
 */

var logger = null;
var pgpooled = false;
var pgpool = null;

function getLogger() {
	if (logger === null) {
		// Logger setup
		logger = new (winston.Logger)({
			transports: [
				new (winston.transports.Console)({
					level: 'info',
					humanReadableUnhandledException: true,
					timestamp: true,
					showLevel: true
				})
			]
		});
	}
	
	return logger;
}

/**
 * Library methods
 */
function isSetup() {
	logger.debug('Checking configuration');
	return (process.env.DATABASE_HOST !== null) &&
		(process.env.DATABASE_PORT !== null) &&
		(process.env.DATABASE_USERNAME !== null) &&
		(process.env.DATABASE_PASSWORD !== null) &&
		(process.env.DATABASE_NAME !== null);
}

function isCallbackDefined(callback) {
	if (callback && typeof callback === "function") {
		return true;
	}
	return false;
}

function isEmpty(obj) {
	if (obj) {
		return false;
	}
	return true;
}

function setPool(pool) {
	pgpooled = true;
	pgpool = pool;
}

function getPool() {
	return pgpool;
}

function createDatabasePool(successFn, errorFn) {
	try {
		logger.debug('Creating database pool');
		var config = {
			user: process.env.DATABASE_USERNAME,
			database: process.env.DATABASE_NAME,
			password: process.env.DATABASE_PASSWORD,
			host: process.env.DATABASE_HOST,
			port: process.env.DATABASE_PORT,
			max: constants.DATABASE_POOL_MAX_CONNECTIONS,
			idleTimeoutMillis: constants.DATABASE_IDLE_TIMEOUT_MILLIS,
		};

		var pool = new pg.Pool(config);
		logger.info('  - Database pool created');

		pool.on('error', function (error, client) {
			logger.error('  - Unhandled database error: ' + error.message, { 'message': error.message, 'stack': error.stack });
		});

		setPool(pool);

		if (isCallbackDefined(successFn)) {
			successFn(pool);
		}
		
		return pool;

	} catch (exception) {
		logger.error('  - Cannot create database connection pool: ' + exception, exception);
		if (isCallbackDefined(errorFn)) {
			errorFn(exception);
		}
	}
}

function runQuery(sql, data, successFn, errorFn) {
	logger.debug('Query', sql);
	logger.debug('Data', data);
	
	var results = [];

	try {
		var pool = getPool();
		if (pool === null) {
			pool = createDatabasePool();
		}

		pool.connect(function(error, client, done) {
			if (error) {
				logger.error('  - Cannot get database connection from pool: ' + error, error);
				done();
				if (isCallbackDefined(errorFn)) {
					errorFn(error, sql, data);
				}
				return;
			}

			var query = client.query(sql, data);
			query.on('row', function(row) {
				results.push(row);
			});

			query.on('end', function() {
				logger.debug('Query executed successfully');
				done();
				if (isCallbackDefined(successFn)) {
					successFn(results);
				}
			});

			query.on('error', function(error) {
				logger.error('  - Query not executed: ' + error, { 'query': sql, 'params': data, 'error': error });
				done();
				if (isCallbackDefined(errorFn)) {
					errorFn(error, sql, data);
				}
			});
		});

	} catch (exception) {
		logger.error('  - Cannot run query: ' + exception, { 'query': sql, 'params': data, 'error': exception });
		if (isCallbackDefined(errorFn)) {
			errorFn(exception, sql, data);
		}
	}
}

module.exports = {
	getLogger: getLogger,
	setPool: setPool,
	getPool: getPool,

	isSetup: isSetup,
	isCallbackDefined: isCallbackDefined,
	isEmpty: isEmpty,

	createDatabasePool: createDatabasePool,
	runQuery: runQuery
};