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

