var express = require('express');
var router = express.Router();
var waterfall = require("async/waterfall");
var asyncEach = require("async/each");
var uniqid = require('uniqid');
var uuidv4 = require('uuid/v4');

var constants = require('../modules/constants');
var main = require('../modules/main');

var logger = main.getLogger();

var dbSchema = process.env.DATABASE_SCHEMA || 'public';

/* GET home page. */
router.get('/', function(req, res, next) {
	try {
		res.render('index');
	} catch (exception) {
		logger.error('  - Unhandled exception catched', exception);
		res.status(500).send({
			error: exception
		});
	}
});

module.exports = router;
