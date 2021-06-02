
/**************************************************************
	Resizable v1.00



 **************************************************************/


(function(){
"use strict";

let allContainers = [];

let panel1, panel2;
let panel1Size, panel2Size, containerSize;
let deltaMin, deltaMax, lastDelta;

let onMouseMove;

let layout = {};

const STORAGE_KEY = 'rsz-layout'+location.pathname.trim().replace(/\/$|(\/index)?\.[^\.]*$/gi,"").replace(/\//g,'-');

document.querySelectorAll('.rsz-container').forEach(setupContainer);
restoreLayout();


function setupContainer(contElement)
{
	const vertical = contElement.classList.contains('vertical');

	const container = {
		elm: contElement,
		store: contElement.id && contElement.classList.contains('store'),
		panels: [],
		getSize: vertical? function(){return this.elm.offsetHeight;} : function(){return this.elm.offsetWidth;}
	};

	const handleBase = document.createElement('DIV');
	handleBase.classList.add('rsz-handle');
	for(let pElement=contElement.firstChild, i=0; pElement!=null; pElement=pElement.nextSibling)
	{
		const cl = pElement.classList;
		if(cl && cl.contains('rsz-panel'))
		{
			const panel = {
				idx: i,
				elm: pElement
			};

			if(vertical){
				panel.getSize = function(){return this.elm.offsetHeight;};
				panel.getMinSize = getCSSMinSize.bind(null, pElement, 'height');
				panel.getMaxSize = getCSSMaxSize.bind(null, pElement, 'height');
				panel.getHandleSize = function(){return (this.handle)? this.handle.offsetHeight:0;};
			}
			else {
				panel.getSize = function(){return this.elm.offsetWidth;};
				panel.getMinSize = getCSSMinSize.bind(null, pElement, 'width');
				panel.getMaxSize = getCSSMaxSize.bind(null, pElement, 'width');
				panel.getHandleSize = function(){return (this.handle)? this.handle.offsetWidth:0;};
			}

			if(i > 0) {
				const handle = handleBase.cloneNode(false);
				handle.addEventListener('mousedown', onMouseDown.bind(null, container, i, vertical));
				pElement.appendChild(handle);
				panel.handle = handle;
			}

			container.panels.push(panel);
			i++;
		}
	}

	allContainers.push(container);
}



function onMouseDown(container, idx, vertical, downEvent)
{
	if(downEvent.button!=0) return; // main button only

	downEvent.stopPropagation();

	if(prepareForResizing(container, idx))
	{
		if(vertical){
			onMouseMove = function(moveEvent) {
        /*jslint bitwise: true */
				if(moveEvent.buttons&1) resizePanels(moveEvent.clientY - downEvent.clientY);
				 else stopResizing(container);
			};
		}
		else{
			onMouseMove = function(moveEvent) {
        /*jslint bitwise: true */
				if(moveEvent.buttons&1) resizePanels(moveEvent.clientX - downEvent.clientX);
				 else stopResizing(container);
			};
		}

		document.addEventListener('mousemove', onMouseMove);
	}
}


function prepareForResizing(container, idx)
{
	let p1 = container.panels[idx-1];
	let p2 = container.panels[idx];

	while(p1 && p1.elm.classList.contains('fixed')) p1 = container.panels[p1.idx - 1];
	while(p2 && p2.elm.classList.contains('fixed')) p2 = container.panels[p2.idx + 1];

	if(!p1 || !p2) return false;

	panel1 = p1.elm;
	panel2 = p2.elm;

	panel1Size = p1.getSize();
	panel2Size = p2.getSize();
	containerSize = container.getSize();

	deltaMin = Math.max(p1.getHandleSize() - panel1Size, p1.getMinSize() - panel1Size, panel2Size - p2.getMaxSize());
	deltaMax = Math.min(panel2Size - p2.getHandleSize(), panel2Size - p2.getMinSize(), p1.getMaxSize() - panel1Size);

	lastDelta = 0;

	resetBases(container);

	document.body.classList.add('resizing');
	document.addEventListener('mouseup', onMouseUp.bind(null, container));

	return true;
}


function resetBases(container)
{
	let sizes = [], totSize = 0;

	container.panels.forEach(function(panel){
		let sz = panel.getSize();
		sizes.push(sz);
		totSize += sz;
	});

	totSize = totSize||1; //this avoids 0 divided by 0 below

	container.panels.forEach(function(panel, i) {
		const basis = 100*sizes[i]/totSize;
		panel.elm.style.flex = '1 1 ' + basis + '%';
	});
}


function resizePanels(delta)
{
	if(delta<deltaMin) delta = deltaMin;
	if(delta>deltaMax) delta = deltaMax;

	panel1.style.flex = '1 1 ' + 100*(panel1Size + delta)/containerSize + '%';
	panel2.style.flex = '1 1 ' + 100*(panel2Size - delta)/containerSize + '%';

	if(delta !== lastDelta)
	{
		lastDelta = delta;
		dispatchEventTo(new CustomEvent('resize'), panel1, panel2);
	}
}


function dispatchEventTo(e){
	//TODO: dispatch events only for those panels that are actually resizing
	for (let i = arguments.length - 1; i >= 1; i--)
	{
    const newEvent = e;
		arguments[i].dispatchEvent(newEvent);
		arguments[i].querySelectorAll('.rsz-panel').forEach(function(desc) {
			desc.dispatchEvent(newEvent);
		});
	}
}


function onMouseUp(container, e)
{
	if(e.button==0) stopResizing(container);
}


function stopResizing(container)
{
	document.removeEventListener('mousemove', onMouseMove);
	document.removeEventListener('mouseup', onMouseUp);
	saveLayout(container);
	document.body.classList.remove('resizing');
}


function getCSSMinSize(elem, dim)
{
	const ruleValue = window.getComputedStyle(elem).getPropertyValue('min-'+dim);

	if(ruleValue.lastIndexOf('px') != -1){
		return parseInt(ruleValue);
	}
	return 0;
}

function getCSSMaxSize(elem, dim)
{
	const ruleValue = window.getComputedStyle(elem).getPropertyValue('max-'+dim);

	if(ruleValue.lastIndexOf('px') != -1){
		return parseInt(ruleValue);
	}
	return Number.POSITIVE_INFINITY;
}


window.addEventListener('resize', function() {

	dispatchEventTo(new CustomEvent('resize'), document.body);
});


function saveLayout(container)
{
	if(!container.store) return;

	let bases = [];

	resetBases(container);

	container.panels.forEach(function(panel){
		bases.push(parseFloat(panel.elm.style.flexBasis));
	});

	layout[container.elm.id] = bases;

	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}


function restoreLayout()
{
	let storedLayout = {};

	try {
		const itemValue = window.localStorage.getItem(STORAGE_KEY);

		if(itemValue) storedLayout = JSON.parse(itemValue);
	}
	catch(ex) {}

	allContainers.forEach(function(container){

		if(container.store)
		{
			const bases = storedLayout[container.elm.id];
			if(bases && bases.length === container.panels.length)
			{
				container.panels.forEach(function(panel, i){
					panel.elm.style.flex = '1 1 ' + bases[i] + '%';
				});

				layout[container.elm.id] = storedLayout[container.elm.id];
			}
		}

		container.elm.classList.remove('store');
	});

	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}


document.body.classList.add('rsz-loaded');

})();