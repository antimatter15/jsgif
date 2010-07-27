// Misc Tools
// Copyright (c) 2010 Joseph Huckaby.
// Released under the LGPL v3.0: http://www.opensource.org/licenses/lgpl-3.0.html
// getInnerWindowSize() was grabbed from: http://www.howtocreate.co.uk/tutorials/javascript/browserwindow

function $(thingy) {
	// universal DOM lookup function, extends object with hide/show/addClass/removeClass
	// can pass in ID or actual DOM object reference
	var obj = (typeof(thingy) == 'string') ? document.getElementById(thingy) : thingy;
	if (obj && !obj.setOpacity) {
		obj.hide = function() { this.style.display = 'none'; return this; };
		obj.show = function() { this.style.display = ''; return this; };
		obj.addClass = function(name) { this.removeClass(name); this.className += ' ' + name; return this; };

		obj.removeClass = function(name) {
			var classes = this.className.split(/\s+/);
			var idx = find_idx_in_array( classes, name );
			if (idx > -1) {
				classes.splice( idx, 1 );
				this.className = classes.join(' ');
			}
			return this;
		};
		
		obj.setClass = function(name, enabled) {
			if (enabled) this.addClass(name);
			else this.removeClass(name);
		};
	}
	return obj;
}

function GetTickCount() {
	// milliseconds since page load
	return Math.floor( (new Date()).getTime() - CanvasCycle.globalTimeStart );
}

function getInnerWindowSize(dom) {
	// get size of inner window
	// From: http://www.howtocreate.co.uk/tutorials/javascript/browserwindow
	if (!dom) dom = window;
	var myWidth = 0, myHeight = 0;

	if( typeof( dom.innerWidth ) == 'number' ) {
		// Non-IE
		myWidth = dom.innerWidth;
		myHeight = dom.innerHeight;
	}
	else if( dom.document.documentElement && ( dom.document.documentElement.clientWidth || dom.document.documentElement.clientHeight ) ) {
		// IE 6+ in 'standards compliant mode'
		myWidth = dom.document.documentElement.clientWidth;
		myHeight = dom.document.documentElement.clientHeight;
	}
	else if( dom.document.body && ( dom.document.body.clientWidth || dom.document.body.clientHeight ) ) {
		// IE 4 compatible
		myWidth = dom.document.body.clientWidth;
		myHeight = dom.document.body.clientHeight;
	}
	return { width: myWidth, height: myHeight };
}

function find_idx_in_array(arr, elem) {
	// return idx of elem in arr, or -1 if not found
	for (var idx = 0, len = arr.length; idx < len; idx++) {
		if (arr[idx] == elem) return idx;
	}
	return -1;
}

function isa_hash(arg) {
	// determine if arg is a hash
	return( !!arg && (typeof(arg) == 'object') && (typeof(arg.length) == 'undefined') );
}

function isa_array(arg) {
	// determine if arg is an array or is array-like
	if (typeof(arg) == 'array') return true;
	return( !!arg && (typeof(arg) == 'object') && (typeof(arg.length) != 'undefined') );
}

function merge_objects(a, b) {
	// merge keys from a and b into c and return c
	// b has precedence over a
	if (!a) a = {};
	if (!b) b = {};
	var c = {};

	// also handle serialized objects for a and b
	if (typeof(a) != 'object') eval( "a = " + a );
	if (typeof(b) != 'object') eval( "b = " + b );

	for (var key in a) c[key] = a[key];
	for (var key in b) c[key] = b[key];

	return c;
}

function serialize(thingy, glue) {
	// serialize anything into json
	// or perl object notation (just set glue to '=>')
	if (!glue) glue = ':'; // default to json
	var stream = '';
	
	if (typeof(thingy) == 'boolean') {
		stream += (thingy ? 'true' : 'false');
	}
	else if (typeof(thingy) == 'number') {
		stream += thingy;
	}
	else if (typeof(thingy) == 'string') {
		stream += '"' + thingy.replace(/([\"\\])/g, '\\$1').replace(/\r/g, "\\r").replace(/\n/g, "\\n") + '"';
	}
	else if (isa_hash(thingy)) {
		var num = 0;
		var buffer = [];
		for (var key in thingy) {
			buffer[num] = (key.match(/^[A-Za-z]\w*$/) ? key : ('"'+key+'"')) + glue + serialize(thingy[key], glue);
			num++;
		}
		stream += '{' + buffer.join(',') + '}';
	}
	else if (isa_array(thingy)) {
		var buffer = [];
		for (var idx = 0, len = thingy.length; idx < len; idx++) {
			buffer[idx] = serialize(thingy[idx], glue);
		}
		stream += '[' + buffer.join(',') + ']';
	}
	else {
		// unknown type, just return 0
		stream += '0';
	}
	
	return stream;
}

(function() {
	// Browser detection
	var u = navigator.userAgent;
	var webkit = !!u.match(/webkit/i);
	var chrome = !!u.match(/Chrome/);
	var safari = !!u.match(/Safari/) && !chrome;
	var ie = !!u.match(/MSIE/);
	var ie6 = ie && !!u.match(/MSIE\s+6/);
	var ie7 = ie && !!u.match(/MSIE\s+7/);
	var ie8 = ie && !!u.match(/MSIE\s+8/);
	var moz = !safari && !ie;
	var op = !!window.opera;
	var mac = !!u.match(/Mac/i);
	var ff = !!u.match(/Firefox/);
	var iphone = !!u.match(/iPhone/);
	var ipad = !!u.match(/iPad/);
	var snow = !!u.match(/Mac\s+OS\s+X\s+10\D[6789]/);
	var titanium = safari && !!u.match(/Titanium/);
	var android = !!u.match(/android/i);
	
	var ver = 0;
	if (ff && u.match(/Firefox\D+(\d+(\.\d+)?)/)) {
		ver = parseFloat( RegExp.$1 );
	}
	else if (safari && u.match(/Version\D(\d+(\.\d+)?)/)) {
		ver = parseFloat( RegExp.$1 );
	}
	else if (chrome && u.match(/Chrome\D(\d+(\.\d+)?)/)) {
		ver = parseFloat( RegExp.$1 );
	}
	else if (ie && u.match(/MSIE\D+(\d+(\.\d+)?)/)) {
		ver = parseFloat( RegExp.$1 );
	}
	else if (op && u.match(/Opera\D+(\d+(\.\d+)?)/)) {
		ver = parseFloat( RegExp.$1 );
	}
	
	window.ua = {
		webkit: webkit,
		safari: safari,
		ie: ie,
		ie8: ie8,
		ie7: ie7,
		ie6: ie6,
		moz: moz,
		op: op,
		mac: mac,
		ff: ff,
		chrome: chrome,
		iphone: iphone,
		ipad: ipad,
		snow: snow,
		titanium: titanium,
		android: android,
		mobile: iphone || ipad || android,
		ver: ver
	};
})();

