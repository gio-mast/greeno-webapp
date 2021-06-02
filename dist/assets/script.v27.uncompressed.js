(function(){
"use strict";// Source: src/assets/js/progressbar.js
// PROGRESS BAR
function ProgressBar(elementId)
{
	const pbData = document.getElementById(elementId).dataset;
	const queue = [];

	this.show = function()
	{
		addFrames('reset', 'growing');
	};

	this.hide = function(cancel)
	{
		addFrames(cancel? '0' : '100');
	};

	function addFrames()
	{
		const wasEmpty = (queue.length == 0);
		Array.prototype.push.apply(queue, arguments);
		if(wasEmpty && queue.length > 0) {
			window.requestAnimationFrame(processQueue);
		}
	}

	function processQueue()
	{
		pbData.state = queue.shift() || 'reset';
		if(queue.length) {
			window.requestAnimationFrame(processQueue);
		}
	}
}


// Source: src/assets/js/datagrid.js
/****************************************************** 
	DataGrid v0.20

	TODO:
	* pass data to the constructor
	* dynamic calculation of the single row height or of the comulative height of the rows (this will allow different row height and will eliminate the need of nowrap rule)
	* ability to change block options 
	* events

******************************************************/


function DataGrid(container, height)
{
	const self = this;
	const HEADER_HEIGHT = 30; // ATTENTION: this needs a CSS definition of the same value
	const ROW_HEIGHT = 30; // ATTENTION: this needs a CSS definition of the same value
	const ROWS_PER_BLOCK = 10; // >0
	const OUT_OF_VIEW_BLOCKS = 1;  // >=0
	const ROW_STYLE_CYCLE = 0;  // ATTENTION: If your table has a style that repeats every N rows, in order to keep dsplaying correctly you must set ROW_STYLE_CYCLE = N and the ROWS_PER_BLOCK must be a multiple of N. Set ROW_STYLE_CYCLE <= 1 if style is uniform thru the rows. 
	let gridContainer, gridHead, gridBody, offsetRowTop, offsetRowBottom;
	let rows = [];
	let viewHeight;
	let currentView = {top: 0, bottom: -1};


	this.fill = function(data, append)
	{
		let data_cols = data.columns; 
		if(data_cols instanceof Array)
		{
			let elm; while((elm = gridHead.firstChild)) gridHead.removeChild(elm);

			if(data_cols.length > 0) {
				gridHead.innerHTML = '<tr><th>'+data_cols.join('</th><th>')+'</th></tr>';
			}
		}

		let data_rows = data.rows;
		if(data_rows instanceof Array)
		{
			if(!append)
			{
				rows = [];
			}

			let data_len = data_rows.length;
			for (let i = 0; i < data_len; i++)
			{
				rows.push('<td>' + data_rows[i].join('</td><td>') + '</td>');
			}

			this.draw(!append); // we need a forced redraw when the whole table content changes
		}
	};


	this.draw = function(forced)
	{
		const RowCount     = rows.length;
		const BlockHeight  = ROW_HEIGHT*ROWS_PER_BLOCK;
		const ScrollOffset = gridContainer.scrollTop;

		let newTop, newBottom;
		let r1, r2;

		if(RowCount > 0) {
			newTop    = Math.max(0,        (Math.floor(ScrollOffset/BlockHeight)-OUT_OF_VIEW_BLOCKS)*ROWS_PER_BLOCK);
			newBottom = Math.min(RowCount, (Math.ceil((ScrollOffset+viewHeight-HEADER_HEIGHT)/BlockHeight)+OUT_OF_VIEW_BLOCKS)*ROWS_PER_BLOCK) - 1;
		}
		else {
			newTop = 0;
			newBottom = -1;
		}

		if(forced)
		{
			//console.log(`[${currentView.top}, ${currentView.bottom}] ---> [${newTop}, ${newBottom}] (forced)`);

			// remove all rows
			r1 = currentView.top;
			r2 = currentView.bottom;
			while(r1++ <= r2){
				gridBody.removeChild(offsetRowTop.nextSibling);
			}

			//add all rows
			r1 = newTop;
			r2 = newBottom;
			if(r2 >= r1) {
				offsetRowTop.insertAdjacentHTML('afterend', '<tr>'+rows.slice(r1, r2+1).join('</tr><tr>')+'</tr>');
			}
		}
		else
		{
			if(currentView.top == newTop && currentView.bottom == newBottom) return;

			//console.log(`[${currentView.top}, ${currentView.bottom}] ---> [${newTop}, ${newBottom}]`);

			// remove upper rows
			r1 = currentView.top;
			r2 = Math.min(currentView.bottom, newTop - 1);
			while(r1++ <= r2){
				gridBody.removeChild(offsetRowTop.nextSibling);
			}

			// remove lower rows
			r1 = Math.max(currentView.top, newBottom + 1);
			r2 = currentView.bottom;
			while(r2-- >= r1){
				gridBody.removeChild(offsetRowBottom.previousSibling);
			}

			//add upper rows
			r1 = newTop;
			r2 = Math.min(currentView.top - 1, newBottom);
			if(r2 >= r1) {
				offsetRowTop.insertAdjacentHTML('afterend', '<tr>'+rows.slice(r1, r2+1).join('</tr><tr>')+'</tr>');
			}

			//add lower rows
			r1 = Math.max(currentView.bottom + 1, newTop);
			r2 = newBottom;
			if(r2 >= r1) {
				offsetRowBottom.insertAdjacentHTML('beforebegin', '<tr>'+rows.slice(r1, r2+1).join('</tr><tr>')+'</tr>');
			}
		}


		//update TopOffset
		offsetRowTop.style.height = newTop*ROW_HEIGHT + 'px';
		offsetRowBottom.style.height = Math.max((RowCount - newBottom - 1)*ROW_HEIGHT, 0) + 'px';

		currentView.top = newTop;
		currentView.bottom = newBottom;
	};


	function createContainer(container, height)
	{
		let gridTable, extraRow;

		gridContainer = (typeof container == 'string')? document.getElementById(container) : container;

		if(!(gridContainer instanceof HTMLElement)) {
			throw 'Datagrid container is undefined'; 
		}

		cleanup(); // remove all existing unwanted element

		gridHead = document.createElement('thead');
		gridBody = document.createElement('tbody');
		gridTable = document.createElement('table');
		extraRow = document.createElement('tr');

		offsetRowTop = extraRow.cloneNode(false);
		offsetRowTop.style.visibility = 'hidden';
		offsetRowBottom = offsetRowTop.cloneNode(false);

		//parity
		let p = ROW_STYLE_CYCLE-1;
		extraRow.style.display = 'none';
		while(p-- > 0) {
			if(ROWS_PER_BLOCK%ROW_STYLE_CYCLE != 0) {
				throw 'if ROW_STYLE_CYCLE > 1 then ROWS_PER_BLOCK must be a multiple of ROW_STYLE_CYCLE';
			}
			gridBody.appendChild(extraRow.cloneNode(false));
		}

		gridBody.appendChild(offsetRowTop);
		gridBody.appendChild(offsetRowBottom);

		let tStyle = gridTable.style;
		tStyle.position = 'absolute';
		tStyle.whiteSpace = 'nowrap';
		gridTable.appendChild(gridHead);
		gridTable.appendChild(gridBody);

		let cStyle = gridContainer.style;
		cStyle.position = 'relative';
		cStyle.overflow = 'auto';
		cStyle.padding = '0';
		cStyle.height = (height||'400px');
		gridContainer.appendChild(gridTable);
		gridContainer.addEventListener('scroll', function() {
			self.draw();
		}, {capture: true, passive: true});

		viewHeight = gridContainer.clientHeight;
	}


	function cleanup()
	{
		let elm;
		while((elm = gridContainer.firstChild)) gridContainer.removeChild(elm);
	}

	this.clearRows = function()
	{
		rows = [];
		this.draw();
	};

	this.updateHeight = function()
	{
		const newContainerHeight = gridContainer.clientHeight;

		if(viewHeight != newContainerHeight)
		{
			viewHeight = newContainerHeight;
			self.draw();
		}
	};

	this.scrollToRow = function(row){
		gridContainer.scrollTop = row*ROW_HEIGHT;
	};

	this.destroy = cleanup;

	window.addEventListener('resize', this.updateHeight); //TODO: needs debouncing?


	createContainer(container, height);
}
// Source: src/assets/js/resizable.js

/**************************************************************
	Resizable v1.00



 **************************************************************/


(function(){
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
// Source: src/assets/js/main.js
// APP

const IT_MONTHS = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

const GraphDIV = document.getElementById('graph');
const DataNav = document.getElementById('data-nav');
const AreaSelect = DataNav.elements.area;
const MonthSelect = DataNav.elements.month;


const Grid = new DataGrid('grid', '100%');
const progressBar = new ProgressBar('progress-bar');


const selectorOptions = {
	buttons: [
		{step: "day",  stepmode: "todate",   count:  1, label: "≥00:00"},
		{step: "hour", stepmode: "backward", count: 24, label: "24h"},
		{step: "hour", stepmode: "backward", count: 48, label: "48h"},
		{step: "day",  stepmode: "backward", count:  7, label: "7g" },
		{step: "day",  stepmode: "backward", count: 15, label: "15g"},
		{step: "all",  label: "[…]"}
	]
};

const layout = {
	xaxis: {
		type: 'date', tickangle: 0, rangeselector: selectorOptions, rangeslider: {},
		tickformatstops:[
			{dtickrange: [null, 59999],     value: "%H:%M:%S\n%-d %b '%y"},
			{dtickrange: [60000, 86399999], value: "%H:%M\n%-d %b '%y"},
			{dtickrange: [86400000, null],  value: "%-d %b\n%Y"}
		]},
	yaxis:  {fixedrange: true},
	margin: {l: 45, r: 45, b: 5},
	legend: {orientation: 'h', x: 0, y: -0.6, xanchor:'left', yanchor: 'top'}
};

const config = {
	displayModeBar: true,
	displaylogo: false,
	locale: 'it'
};

const intDateTime = new Intl.DateTimeFormat('it-IT', {
	year:  'numeric',
	month: '2-digit',
	day:   '2-digit',
	hour:  '2-digit',
	minute:'2-digit',
	second:'2-digit'
});


let dataLists = {};
let receivedJson = null;
let currentRequest;


function Request()
{
	let area, month, type, raw;

	const formElements = DataNav.elements; 

	area = formElements.area.value;
	month = formElements.month.value;
	type = formElements.type.value;
	raw = formElements.raw.checked;

	this.makeUrl = function(basepath)
	{
		let url = basepath + '?';

		if(area) url += 'area=' + encodeURIComponent(area) + '&';
		url += 'month=' + encodeURIComponent(month);
		url += '&type=' + encodeURIComponent(type);
		if(raw) url += '&raw=true';

		return url;
	};

	this.revert = function()
	{
		formElements.area.value = area;
		formElements.month.value = month;
		formElements.type.value = type;
		formElements.raw.checked = raw;

		updateRawCheckbox();
	};
}


function getJSON(url, callback)
{
	const xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(){
		if (xhr.readyState === 4)
		{
			const status = xhr.status;
			let data = null;
			let err = (status < 200 || status >= 400)? status : false;

			if(status===0) err = true; // no response (timeout)

			try{
				data = JSON.parse(xhr.responseText);
			}
			catch(e){
				err = true;
			}
			callback(err, data);
		}
	};

	xhr.open('GET', url);
	xhr.send();
}


const IDLE = 0, FETCHING_DATA = 1, FETCHING_LIST = 2;
let fetchingState = IDLE;


function onFetchingChanged(newState, hasFailed)
{
	// If fetching_data happens after fetching_list, we are still in the fetching_list state,
	//  this is really important to avoid an infinite loop of data fetching
	if(fetchingState == FETCHING_LIST && newState == FETCHING_DATA){
		newState = FETCHING_LIST;
	}

	if(fetchingState == IDLE && newState > IDLE)
	{
		progressBar.show();
		navEnabled(false);
	}
	else if(fetchingState > IDLE && newState == IDLE)
	{
		progressBar.hide(hasFailed);
		navEnabled(true);
	}

	fetchingState = newState;
}


function navEnabled(value)
{
	DataNav.querySelectorAll('fieldset, select, button').forEach( function(el)
	{
		el.disabled = !value;
	});

	updateRawCheckbox();
}


function doRefresh()
{
	if(receivedJson != null) {
		const now = new Date();
		const ts = receivedJson.timestamps;
		const lastDate = new Date(1000 * ts[ts.length - 1]);

		if(lastDate.getUTCMonth() == now.getUTCMonth() && lastDate.getUTCFullYear() == now.getUTCFullYear()) {
			fetchData(false);
			return;
		}
	}

	fetchDataList();
}


function fetchDataList()
{
	onFetchingChanged(FETCHING_LIST);

	getJSON('json.php?list=all', function(err, data)
	{
		if(err) {
			onFatalError(err, data);
			onFetchingChanged(IDLE, true);
		}
		else {
			dataLists = data;
			setupNavigation();
			fetchData(false);
		}
	});
}


function fetchData(keepRange)
{
	const currentArea = AreaSelect.value || 0;

	onFetchingChanged(FETCHING_DATA);

	if(dataLists[currentArea]===undefined || dataLists[currentArea].indexOf(MonthSelect.value) == -1)
	{
		onFetchingChanged(IDLE);
		receivedJson = null;
		showData(false);
		return;
	}

	const request = new Request();

	getJSON(request.makeUrl('json.php'), function(err, jsData)
	{
		if(err)
		{
			// if a 4xx error is return on area or month, it means that the data list 
			// has changed so we need to fetch it again
			if( fetchingState != FETCHING_LIST && 
				(err == 404 || err == 400) &&
				jsData && (jsData.param == 'area' || jsData.param == 'month') )
			{
				fetchDataList();
			}
			else
			{
				onFatalError(err, jsData);

				if(currentRequest) currentRequest.revert();

				onFetchingChanged(IDLE, true);
			}
		}
		else
		{
			currentRequest = request;

			onFetchingChanged(IDLE);

			receivedJson = jsData;
			showData(keepRange);
		}
	});
}


function onFatalError(errCode, errData)
{
	if(errData && errData.error) console.error(errData.error);

	// TODO: make a popup instead of this alert		
	window.alert("Impossibile soddisfare la richiesta, riprovare più tardi.");
}


function showData(keepRange)
{
	// show no-data
	if(receivedJson === null){
		document.body.classList.add('no-data');
		DataNav.elements.download.disabled = true;
		DataNav.elements['data-type'].disabled = true;
		return;
	}

	let xData = [];
	receivedJson.timestamps.map(function(t){
		xData.push(new Date(t*1000));
	});

	const nodes = receivedJson.data;
	const labels = receivedJson.labels;
	let tracks = [];

	nodes.map(function(yData, idx) {
		tracks.push({
			name: labels[idx],
			x: xData,
			y: yData,
			type: "scatter"
		});
	});
	
	layout.title = calcGraphTitle();
	if(!keepRange) {
		layout.xaxis.autorange = true;
	}

	Plotly.react(GraphDIV, tracks, layout, config);

	populateTable(xData, nodes, labels, receivedJson.decimals);

	if(!keepRange) {
		Grid.scrollToRow(0);
	}

	document.body.classList.remove('no-data');
	DataNav.elements.download.disabled = false;
}


function calcGraphTitle()
{
	const selectedType = DataNav.querySelector("input[name='type']:checked");
	let unit;

	if(DataNav.elements.raw.checked) {
		unit = selectedType.dataset.raw;
	}
	else{
		unit = selectedType.dataset.unit;
	}

	return selectedType.parentNode.textContent + ((unit)?(' [' + unit + ']'):'');
}


function populateTable(xData, nodes, labels, decimals)
{
	let columns = ['Data e ora'];

	labels.map(function(label) {
		columns.push(label);
	});

	let rows = [];
	const nodesLen = nodes.length;
	for(let i = xData.length-1; i>=0; i--)
	{
		let row = [intDateTime.format(xData[i])];

		for(let j = 0; j < nodesLen; j++)
		{
			const val = nodes[j][i];
			row.push(((val !== null)? Number(val).toFixed(decimals) : ''));
		}
		rows.push(row);
	}

	Grid.fill({'columns': columns, 'rows': rows});
}


function setupNavigation()
{
	const areaControl = document.getElementById("area-control");
	const baseOpt = document.createElement('option');
	const areas = Object.keys(dataLists);

	let currentArea = AreaSelect.value || 0;
	let currentMonth = MonthSelect.value;
	let allMonths = [];

	// Merge all month lists into an unique ordered list
	areas.forEach( function(area) {
		dataLists[area].forEach( function(month) {
			if(allMonths.indexOf(month) == -1) allMonths.push(month);
		});
	});
	allMonths.sort();

	// Check if the current data selection doesn't exist anymore
	if(!dataLists[currentArea] || allMonths.indexOf(currentMonth) == -1)
	{
		// Search for the most recent area-month pair
		let latestArea = 0, latestMonth = '';
		areas.forEach(function(area) {
			dataLists[area].forEach( function(month) {
				if(month > latestMonth){
					latestMonth = month; latestArea = area;
				}
			});
		});

		currentArea = latestArea;
		currentMonth = latestMonth;
	}

	// Remove all existing options
	clearOptions(AreaSelect);
	clearOptions(MonthSelect);

	// Setup Area Control
	if(areas.length < 2) {
		areaControl.hidden = true;
	}
	else{
		areaControl.hidden = false;

		// Fill AreaSelect's options
		areas.map( function(area) {
			const opt = baseOpt.cloneNode(false);
			opt.textContent = area;
			opt.value = area;
			opt.selected = (area == currentArea);

			AreaSelect.add(opt);
		});
	}

	// Fill MonthSelect's options (in reverse order)
	const curAreaMonths = dataLists[currentArea];
	for (let i = allMonths.length - 1; i >= 0; i--)
	{
		const monthValue = allMonths[i];
		const opt = baseOpt.cloneNode(false);
		opt.value = monthValue;
		opt.textContent = calcMonthName(monthValue);
		opt.selected = (monthValue == currentMonth);
		opt.disabled = curAreaMonths? (curAreaMonths.indexOf(opt.value) == -1) : true;

		MonthSelect.add(opt);
	}

}


function clearOptions(htmlSelect) {
	const len = htmlSelect.options.length;
	for(let i = len - 1; i >= 0; i--) {
		htmlSelect.remove(i);
	}
}


function calcMonthName(yyyymm)
{
	const year = yyyymm.substring(0, 4);
	const month = IT_MONTHS[parseInt(yyyymm.substring(4)) - 1];

	return month + ' ' +  year;
}


function updateMonthSelect()
{
	const availableMonths = dataLists[AreaSelect.value||0];
	const opts = MonthSelect.options;

	for (let i = opts.length - 1; i >= 0; i--) {
		const opt = opts[i];
		if(availableMonths) {
			opt.disabled = (availableMonths.indexOf(opt.value) == -1);
		}
		else {
			disabled = true;
		}
	}
}


function updateRawCheckbox()
{
	const notRaw = (DataNav.querySelector("input[data-raw]:checked") === null);

	if(notRaw) DataNav.elements.raw.checked = false;

	DataNav.elements.raw.disabled = notRaw;
}


function exportToCsv()
{
	if(receivedJson === null) return;

	const SEP = ',';
	const EOL = "\n";

	const nodes = receivedJson.data;
	const timestamps = receivedJson.timestamps;
	const decimals = receivedJson.decimals;

	// Build csv header
	const labels = receivedJson.labels.join('"' + SEP + '"');
	let csvContent = '"Data e ora"' + ((labels !== '')? (SEP + '"' + labels + '"' + EOL) : EOL);

	// Build rows
	const trackLen = timestamps.length;
	const nodeCount = nodes.length;
	for(let i = 0; i < trackLen; i++)
	{
		csvContent += '"' + intDateTime.format(new Date(timestamps[i]*1000)) + '"';

		for(let j = 0; j < nodeCount; j++)
		{
			const val = nodes[j][i];
			csvContent += SEP + ((val !== null)? Number(val).toFixed(decimals) : '');
		}

		csvContent += EOL;
	}

	// Build filename
	const formElements = DataNav.elements;
	let filename = '';
	if(formElements.area.value) filename = formElements.area.value + '-';
	filename += formElements.month.value + '-' + formElements.type.value;
	if(formElements.raw.checked) filename += '-raw';
	filename += '.csv';

	// Create download object
	const blob = new Blob([csvContent], {type:'text/csv;charset=utf-8;'});

	if (navigator.msSaveBlob) { // IE 10+
		navigator.msSaveBlob(blob, filename);
	} else {
		const link = document.createElement("a");
		if (link.download !== undefined) { // feature detection
			// Browsers that support HTML5 download attribute
			const objectUrl = URL.createObjectURL(blob);
			link.href = objectUrl;
			link.download = filename;
			link.hidden = true;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(objectUrl);
		}
	}
}


function debounce(func){
	let timer;
	return function(){
		if(timer) clearTimeout(timer);
		timer = setTimeout(func, 300);
	};
}


function AppInit()
{
	// Load available data
	dataLists = JSON.parse(document.getElementById('data-lists').textContent);

	setupNavigation();

	// Create no data warning
	const noDataElm = document.createElement('span');
	noDataElm.textContent = "Nessun dato da visualizzare";
	noDataElm.classList.add('no-data-message');
	GraphDIV.parentNode.appendChild(noDataElm);
	document.getElementById('grid').parentNode.appendChild(noDataElm.cloneNode(true));
	
	// Set event handlers
	DataNav.addEventListener('change', function(event)
	{
		let keepRange = true;
		if(event.target === AreaSelect) {
			updateMonthSelect();
		}
		else if(event.target === MonthSelect) {
			keepRange = false;
		}
		else if(event.target.name === 'type') {
			updateRawCheckbox();
		}
		fetchData(keepRange);
	});

	DataNav.elements.refresh.addEventListener('click', doRefresh);
	DataNav.elements.download.addEventListener('click', exportToCsv);

	document.getElementById('grid-panel').addEventListener('resize',  debounce(Grid.updateHeight));
	document.getElementById('graph-panel').addEventListener('resize', debounce(function() {
		Plotly.relayout(GraphDIV, {
			width:  GraphDIV.offsetWidth,
			height: GraphDIV.offsetHeight
		});
	}));

	// Initial data fetching
	fetchData(false);
}


/** App init with polyfills **/

function loadScript(src, done) {
	var js = document.createElement('script');
	js.src = src;
	js.onload = function() {
		done();
	};
	js.onerror = function() {
		done(new Error('Failed to load script ' + src));
	};
	document.head.appendChild(js);
}

function browserSupportsAllFeatures() {
  return (typeof RadioNodeList !== "undefined" && RadioNodeList.value !== "undefined")&&(window.NodeList && NodeList.prototype.forEach)&&(typeof window.CustomEvent === "function");
}


if (browserSupportsAllFeatures()) {
	// Browsers that support all features run `AppInit()` immediately.
	AppInit();
} else {
	// All other browsers loads polyfills and then run `AppInit()`.
	loadScript('assets/polyfills.js', AppInit);
}

})();