/**
 * Greeno WepApp - v1.27.0 2021-06-16
 *
 * Copyright (c) 2016 - 2021 Giovanni Mastrangelo
 * Licensed under the CC-BY-NC-ND-4.0 license.
 */

!function(){"use strict";"undefined"==typeof RadioNodeList&&"undefined"!=typeof HTMLCollection&&Object.defineProperty(HTMLCollection.prototype,"value",{get:function(){for(var t,e=this.length;t=this[--e];)if("radio"===t.type&&t.checked)return t.value;return""},set:function(t){for(var e,n=this.length;e=this[--n];)if("radio"===e.type&&e.value==t){e.checked=!0;break}return t}}),window.NodeList&&!NodeList.prototype.forEach&&(NodeList.prototype.forEach=Array.prototype.forEach),"function"!=typeof window.CustomEvent&&(window.CustomEvent=function(t,e){e=e||{bubbles:!1,cancelable:!1,detail:null};var n=document.createEvent("CustomEvent");return n.initCustomEvent(t,e.bubbles,e.cancelable,e.detail),n})}();