/**
 * Constants file
 */
module.exports = {
	DATABASE_POOL_MAX_CONNECTIONS: 10,
	DATABASE_IDLE_TIMEOUT_MILLIS: 30000,

	DATE_FORMAT: 'YYYY-MM-DD',
	DATE_ISO_FORMAT: 'YYYY-MM-DD HH:mm:ss.SSSZ',
	DATE_SOQL_FORMAT: 'YYYY-MM-DDTHH:mm:ss',
	DATE_REPORT_FORMAT: 'YYYY-MM-DD HH:mm:ss',
	DATE_REPORT_FILE_FORMAT: 'YYYYMMDD-HHmmss',

	FILE_EXTENSIONS: {
		'pdf': 'pdf',
		'xls': 'xlsx',
		'csv': 'csv'
	}
};