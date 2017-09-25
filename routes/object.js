var express = require('express');
var router = express.Router();
var waterfall = require("async/waterfall");
var async = require("async");
var uniqid = require('uniqid');
var uuidv4 = require('uuid/v4');
var moment = require('moment');

var constants = require('../modules/constants');
var main = require('../modules/main');

var logger = main.getLogger();

var dbSchema = process.env.DATABASE_SCHEMA || 'public';

router.get('/', function(req, res) {
	try {
		var columnNames = ["id", "name", "body__c", "external_guid__c", "createddate"];
		var orderBy = columnNames[req.query.order[0].column];
		var direction = req.query.order[0].dir.toUpperCase();
		var limit = req.query.length;
		var offset = req.query.start;
		var filter = req.query.search.value;
		var filterSql = ''; 

		var templateSql = 'SELECT COUNT(1) AS totalRows FROM ' + dbSchema + '."external_objects"';

		res.setHeader('Content-Type','application/json');
		waterfall([
			// Get number of rows
			function(callback) {
				var sql = templateSql;
				var data = [];
				
				main.runQuery(sql, data, function(results) {
					var totalRows = results[0].totalrows;
					callback(null, totalRows);
				}, function(error, sql, data) {
					logger.error('  - Cannot get number of rows in external_objects table: ' + error, error);
					callback(error);
				});
			},
			// Get rows with search word
			function(totalRows, callback) {
				if (filter.length !== 0) {
					filterSql = ' WHERE (CAST("id" AS TEXT) LIKE \'%' + filter +
							'%\' OR CAST("name" AS TEXT) LIKE \'%' + filter +
							'%\' OR CAST("createddate" AS TEXT) LIKE \'%' + filter + 
							'%\' OR CAST("body__c" AS TEXT) LIKE \'%' + filter +
							'%\' OR CAST("external_guid__c" AS TEXT) LIKE \'%' + filter +'%\')';
				}

				var sql = templateSql + filterSql;
				var data = [];
				
				main.runQuery(sql, data, function(results) {
					var totalRowsFiltered = results[0].totalrows;
					callback(null, totalRows, totalRowsFiltered);
				}, function(error, sql, data) {
					logger.error('  - Cannot get number of rows in external_objects table (filtered): ' + error, error);
					callback(error);
				});
			},
			// Get rows for a page
			function(totalRows, totalRowsFiltered, callback) {
				var sql =
					'SELECT "id", "name", "body__c", "external_guid__c", "createddate" FROM ' + dbSchema + '."external_objects" '
						+ filterSql + ' ORDER BY "' + orderBy + '" ' + direction + ' LIMIT $1 OFFSET $2';
				var data = [limit, offset];

				main.runQuery(sql, data, function(results) {
					var result = {
						draw: req.query.draw,
						recordsTotal : totalRows,
						recordsFiltered : totalRowsFiltered,
						data : results
					};
					callback(null, result);
				}, function(error, sql, data) {
					logger.error('  - Cannot get rows in external_objects table: ' + error, error);
					callback(error);
				});
			}
		], function(error, result) {
			if (error) {
				logger.error('  - Cannot get rows in external_objects table: ' + error, error);
				return;
			}
			res.send(JSON.stringify(result));
		});

	} catch (exception) {
		logger.error('Cannot get rows in external_objects table: ' + exception, exception);
	}
});

router.post('/', function(req, res) {
	try {
		res.setHeader('Content-Type','application/json');

		insertObject({
			name: req.body.name,
			body__c: req.body.body__c
		}, function(error, result) {
			if (error) {
				logger.error('- Cannot insert new object -');
				return;
			}

			logger.info('- New object created - ' + JSON.stringify(result));
			res.status(200).send(result);
		})
		
	} catch (exception) {
		logger.error('  - Unhandled exception catched', exception);
		res.status(500).send({
			error: exception
		});
	}
});

router.put('/:id', function(req, res) {
	try {
		var id = req.body.id;
		var name = req.body.name;
		var createddate = req.body.createddate;
		var body__c = req.body.body__c;
		var external_guid__c = req.body.external_guid__c;
		
		var sql =
			'UPDATE ' + dbSchema + '."external_objects" ' +
			'SET "name"=$1, "createddate"=$2, "body__c"=$3, "external_guid__c"=$4 ' +
			'WHERE "id"=($5)';
		var data = [name, createddate, body__c, external_guid__c, id];
		
		res.setHeader('Content-Type','application/json');
		main.runQuery(sql, data, function(results) {
			logger.info('- Updating external_objects -');
			res.status(200).send({
				id: id,
				name: name,
				createddate: createddate,
				body__c: body__c,
				external_guid__c: external_guid__c
			});
		}, function(error) {
			logger.error('- Cannot edit external_objects "' + id + '" -');
		});
		
	} catch (exception) {
		logger.error('  - Unhandled exception catched', exception);
		res.status(500).send({
			error: exception
		});
	}
});

router.delete('/all', function(req, res) {
	try {
		var sql = 'TRUNCATE TABLE ' + dbSchema + '."external_objects"';
		var data = [];
		
		console.log('TRUNC - ' + sql);
		
		res.setHeader('Content-Type','application/json');
		main.runQuery(sql, data, function(results) {
			logger.info('- Truncating external_objects -');
			res.status(200).send({ ok : "ok" });
		}, function(error) {
			logger.error('- Cannot truncate external_objects -');
		});
		
	} catch (exception) {
		logger.error('  - Unhandled exception catched', exception);
		res.status(500).send({
			error: exception
		});
	}
});

router.delete('/:id', function(req, res) {
	try {
		var id = req.body.id;
		var sql = 'DELETE FROM ' + dbSchema + '."external_objects" WHERE "id"=($1)';
		var data = [id];
		
		res.setHeader('Content-Type','application/json');
		main.runQuery(sql, data, function(results) {
			logger.info('- Deleting  object -');
			res.status(200).send({ ok : "ok" });
		}, function(error) {
			logger.error('- Cannot delete object -');
		});
		
	} catch (exception) {
		logger.error('  - Unhandled exception catched', exception);
		res.status(500).send({
			error: exception
		});
	}
});

function insertObject(data, callback) {
	try {
		var columns = '"name", "body__c"';
		var values = '$1, $2';
		var queryData = [data.name, data.body__c];
		
		var sql = 'INSERT INTO ' + dbSchema + '."external_objects" (' + columns + ') VALUES (' + values + ') RETURNING "id", "external_guid__c", "createddate"';
		
		main.runQuery(sql, queryData, function(result) {
			callback(null, {
				id: result[0].id,
				name: data.name,
				createddate: result[0].createddate,
				body__c: data.body__c,
				external_guid__c: result[0].external_guid__c
			});
		}, function(error) {
			callback(error);
		});
		
	} catch (exception) {
		callback(exception);
	}
}

router.post('/bulk/:number', function(req, res) {
	try {
		var number = req.params.number;
		var bulkData = [];
		
		for (var index = 0; index < number; index++) {
			var now = moment().format('YYYYMMDD HHmmss.SSS');
			bulkData.push({
				name: 'External Object ' + now,
				body__c: 'This is the body string for External Object ' + now
			});
		}
		
		async.each(bulkData, insertObject, function(error) {
			if (error) {
				res.status(500).send({
					error: error
				});
				return;
			}

			logger.info('- Bulking insert in external_objects success -');
			res.status(200).send({ ok : "ok" });
		});

	} catch (exception) {
		logger.error('  - Unhandled exception catched', exception);
		res.status(500).send({
			error: exception
		});
	}
});

module.exports = router;
