

(function (window, document) {
	if (!window.WebSocket || !navigator.geolocation)
		return;

	var geolocation = navigator.geolocation,
		watchId,
		myId = Math.floor(10000 * Math.random()),
        pList = [],
    url = "ws://localhost:8080",
		socket = new WebSocket(url),
		map = new BMap.Map("map");

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

	function updateLocation(data) {

		var obj = JSON.parse(data);
		var pid = obj.pid,
				point = new BMap.Point(obj.latitude, obj.longitude),
				marker = new BMap.Marker(point);
        map.centerAndZoom("南京");
		if (pList.indexOf(pid) != -1) {
			var allOverlay = map.getOverlays();
			for (var i = 0, len = allOverlay.length; i < len; i++) {
				if (allOverlay[i].getLabel().content == pid) {
					map.removeOverlay(allOverlay[i]);
				}
			}
		} else {
			pList.push(pid);
		}
		map.addOverlay(marker);
		marker.setLabel(pid);
	}
})(window, document);

