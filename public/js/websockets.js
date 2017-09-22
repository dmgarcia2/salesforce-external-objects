var WebSocketsApp = (function() {
	var reconnect = false;
	var connecting = false;

	var connection = null;

	var hostname = location.origin.replace(/^http/, 'ws');

	var config = null;

	function isConfig() {
		if (config) {
			if ('overrideStatusAction' in config) {
				return true;
			}
		}
		return false;
	}

	function connectToStatusServer() {
		reconnect = false;
		connecting = true;

		window.WebSocket = window.WebSocket || window.MozWebSocket;
		if (!window.WebSocket) {
			showNotification('danger', 'Sorry, but your browser doesn\'t ' + 'support WebSockets.');
			hideLoadingOverlay();
			return;
		}

		// open connection
		var token = uuid.v4();
		connection = new WebSocket(hostname);

		connection.onopen = function() {
			connecting = false;

			connection.send(JSON.stringify({
				action: 'connect',
				token: token
			}));

			showNotification('info', 'Ready to receive messages');
		};

		connection.onerror = function(event) {
			connecting = false;
			connection = null;

			showNotification('danger', 'Sorry, but there\'s some problem with your connection or the server is down.');
			hideLoadingOverlay();
		};

		connection.onmessage = function(message) {
			var json = {};
			try {
				json = JSON.parse(message.data);
			} catch (exception) {
				console.log('This doesn\'t look like a valid JSON: ' + message.data);
				return;
			}

			if (json.token !== token) {
				showNotification('danger', 'Security issue. Session expired!');
				return;
			}

			if (json.action === 'connected') {
				showNotification('success', 'Connection with status server established');

			} else if (!config.overrideStatusAction && json.action === 'status') {
				if ('error' in json.data) {
					showNotification('danger', error);
				} else {
					showNotification('info', json.data.status);
				}

			} else {
				if (isCallbackDefined(config.messageHandler)) {
					config.messageHandler(json);
				} else {
					showNotification('warning', 'Hmm..., I\'ve never seen JSON like this');
					hideLoadingOverlay();
				}
			}
		};
	}

	function connect(cfg) {
		config = cfg;

		if (!isConfig()) {
			console.log('Warning: WebSockets aren\'t configured. They are disabled!');
			showNotification('warning', 'WebSockets aren\'t configured. They are disabled!');
			return;
		}

		connectToStatusServer();

		var timer = setInterval(function() {
			if (connection) {
				if (connection.readyState !== 1) {
					connection = null;
					reconnect = true;
					showNotification('warning', 'Unable to communicate with the status server.');
				} else {
					if (reconnect) {
						connection = null;
						console.log('Trying to reconnect...');
						connectToStatusServer();
					}
				}
			} else {
				if (!connecting) {
					connectToStatusServer();
				}
			}
		}, 10000);
	}
	
	return {
		/*
		 * Arguments
		 *   config:
		 *      - overrideStatusAction (boolean): true if you implement your own status action handler
		 *      - messageHandler      (function): websocket message handler.
		 *              Arguments: message
		 *                 - token  (string): connection token
		 *                 - action (string): action
		 *                 - data   (object): data sent
		 * */
		connect: connect
	}
}());