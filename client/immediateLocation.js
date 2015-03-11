var Util = (function (window, document) {
	var addListener, removeListener;
	if (window.addEventListener) {
		addListener = function (ele, type, fn) {
			ele.addEventListener(type, fn, false);
		};
		removeListener = function (ele, type, fn) {
			ele.removeEventListener(type, fn, false);
		};
	} else if (document.attachEvent) {
		addListener = function (ele, type, fn) {
			ele.attachEvent('on' + type , fn);
		};
		removeListener = function (ele, type, fn) {
			ele.detachEvent('on' + type , fn);
		};
	} else {
		addListener = function (ele, type, fn) {
			ele['on' + type] = fn;
		};
		removeListener = function (ele, type, fn) {
			ele['on' + type] = null;
		};
	}
	return {
		addListener: addListener,
		removeListener: removeListener
	}
})(window, document);

(function (window, document) {
	if (!window.WebSocket || !navigator.geolocation)
		return;

	var geolocation = navigator.geolocation,
		watchId,
		myId = Math.floor(10000 * Math.random()),
	    url = "ws://localhost:8080",
		socket = new WebSocket(url);

	socket.onopen = function () {
		updateGeoLocationInfo("Begin to track.");
		updateWebSocketInfo("Conneted to server successfully.");
		watchId = geolocation.watchPosition(broadMyLocation, handleError, {maximumAge: 1000});
	};

	socket.onmessage = function (e) {
		//实时更新所有用户的位置
		updateLocation(e.data);
	};

	socket.onclosed = function (e) {
		updateWebSocketInfo("Connetion closed.");
		if (watchId) {
			geolocation.clearWatch(watchId);
		}
	};
	socket.onerror = function (e) {
		updateWebSocketInfo("web socket error.");
	};

	function setInfo(ele, info) {
		ele.textContent = ele.innerText = info;
	}

	function updateWebSocketInfo(info) {
		setInfo(document.getElementById("webSocketInfo"), info);
	}

	function updateGeoLocationInfo(info) {
		setInfo(document.getElementById("geoLocationInfo"), info);
	}

	function broadMyLocation(pos) {
		var data = {
			pid: myId,
			latitude: pos.coords.latitude,
			longitude: pos.coords.longitude
		};
		console.log(JSON.stringify(data));
		socket.send(JSON.stringify(data));
	}

	function handleError(error) {
		var code = error.code, message = error.message;
		switch(code) {
			case 0:
				updateGeoLocationInfo("There is an error while retrieving your position. detail:" + message);
				break;
			case 1:
				updateGeoLocationInfo("The user reject your request to share positon.");
				break;
			case 2:
				updateGeoLocationInfo("The browser cannot determine your position.");
				break;
			case 3:
				updateGeoLocationInfo("Time out!");
				break;
		}
	}
	/**
	 * data.pid包括要更新的用户位置id
	 * data.position更新的位置信息
	 */
	function updateLocation(data) {
		var obj = JSON.parse(data);
		var pid = obj.pid,
			position = obj.position;
	}

	Util.addListener(document.getElementById("sendBtn"), 'click', function (e) {
		socket.send(document.getElementById("messageText").value);
	});
})(window, document);

