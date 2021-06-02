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