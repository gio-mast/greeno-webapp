"use strict";
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
