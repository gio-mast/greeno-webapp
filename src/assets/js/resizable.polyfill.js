
/** Resizable requires this polyfills in order to support IE11 **/

// IE9+ NodeList.forEach
if (window.NodeList && !NodeList.prototype.forEach) {
	NodeList.prototype.forEach = Array.prototype.forEach;
}
// IE9+ CustomEvent constructor
if(typeof window.CustomEvent !== "function") {
	window.CustomEvent = function(event, params) {
		params = params || {bubbles: false, cancelable: false, detail: null};
		var evt = document.createEvent('CustomEvent');
		evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
		return evt;
	};
}
