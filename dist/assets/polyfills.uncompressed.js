(function(){
"use strict";// Source: src/assets/js/main.polyfill.js
/** Polyfill for supporting RadioNodeList in IE9+ **/

if (typeof RadioNodeList === "undefined" && typeof HTMLCollection !== "undefined") {

	Object.defineProperty(HTMLCollection.prototype, "value", {

		get: function() {
			var k = this.length, el;

			while((el = this[--k])) {
				if (el.type === "radio" && el.checked) {
					return el.value;   
				}
			}

			return '';
		},

		set: function(value) {
			var k = this.length, el;

			while((el = this[--k])) {
				if (el.type === "radio" && el.value == value) {
					el.checked = true;
					break;
				}
			}

			return value;
		}

	});

}


// Source: src/assets/js/resizable.polyfill.js

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

})();