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