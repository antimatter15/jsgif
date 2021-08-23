// Basic Frame Counting Class
// For displaying current and average frames per second
// Author: Joseph Huckaby
// Copyright (c) 2010 Joseph Huckaby
// Usage: FrameCount.count() // for every frame

var FrameCount = {
	
	current: 0,
	average: 0,
	frameCount: 0,
	lastSecond: 0,
	startTime: 0,
	totalFrames: 0,
	ie: !!navigator.userAgent.match(/MSIE/),
	visible: true,
	
	init: function() {
		// create floating widget
		if (this.visible) {
			var html = '<div id="d_framecount" style="float:right; width:200px; border:1px solid #ccc; background:#eee; margin:10px; padding:10px; font-family:Helvetica,sans-serif; font-size:11px; color:#444;">Waiting for frames...</div>';
		
			if (this.ie) {
				setTimeout( function() {
					document.body.insertAdjacentHTML('beforeEnd',
						'<div style="position:absolute; z-index:9999; left:0px; top:0px; width:100%;">' + html + '</div>'
					);
				}, 1000 );
			}
			else {
				var div = document.createElement('DIV');
				div.style.position = 'fixed';
				div.style.zIndex = '9999';
				div.style.left = '0px';
				div.style.top = '0px';
				div.style.width = '100%';
				div.innerHTML = html;
				document.getElementsByTagName('body')[0].appendChild(div);
			}
		}
	},
	
	update: function() {
		// update display
		var div = document.getElementById('d_framecount');
		if (div) {
			var html = '';
			
			html += '<table>';
			html += '<tr><td align="right"><b>Current FPS:</b></td><td align="left">' + this.current + '</td></tr>';
			html += '<tr><td align="right"><b>Average FPS:</b></td><td align="left">' + this.average + '</td></tr>';
			html += '<tr><td align="right"><b>Total Frames:</b></td><td align="left">' + this.totalFrames + '</td></tr>';
			html += '</table>';
			
			html += '<br/><a href="#" onClick="FrameCount.reset()">Reset</a>';
			
			div.innerHTML = html;
		}
	},
	
	reset: function() {
		this.current = 0;
		this.average = 0;
		this.frameCount = 0;
		this.lastSecond = 0;
		this.startTime = 0;
		this.totalFrames = 0;
		this.update();
	},
	
	_now_epoch: function() {
		// return current date/time in hi-res epoch seconds
		var _mydate = new Date();
		return _mydate.getTime() / 1000;
	},
	
	count: function() {
		// advance one frame
		var _now = this._now_epoch();
		var _int_now = parseInt(_now, 10);
		if (_int_now != this.lastSecond) {
			this.totalFrames += this.frameCount;
			if (!this.startTime) this.startTime = _int_now;
			if (_int_now > this.startTime) this.average = this.totalFrames / (_int_now - this.startTime);
			else this.average = this.frameCount;
			
			this.current = this.frameCount;
			this.frameCount = 0;
			this.lastSecond = _int_now;
			
			if (this.visible) this.update();
		}
		this.frameCount++;
	}
	
};

