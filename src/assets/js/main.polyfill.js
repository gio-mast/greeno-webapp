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

