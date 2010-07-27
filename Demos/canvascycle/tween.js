////
// Tween.js
// Provides numerical obj property animation with easing.
// Copyright (c) 2005 - 2008 Joseph Huckaby
////

var TweenManager = {
	
	_tweens: {},
	_nextId: 1,

	add: function(_args) {
		// add new tween to table
		var _tween = new Tween(_args);
		this._tweens[ this._nextId ] = _tween;
		_tween.id = this._nextId;
		this._nextId++;
		return _tween;
	},

	logic: function(clock) {
		// update tweens
		for (var _id in this._tweens) {
			var _tween = this._tweens[_id];
			_tween.logic(clock);
			if (_tween.destroyed) delete this._tweens[_id];
		}
	},

	removeAll: function() {
		// remove all tweens
		if (arguments.length) {
			var criteria = arguments[0];
			var num_crit = 0;
			for (var key in criteria) num_crit++;
			
			for (var id in this._tweens) {
				var tween = this._tweens[id];
				var matched = 0;
				for (var key in criteria) {
					if (tween[key] == criteria[key]) matched++;
				}
				if (matched == num_crit) {
					tween.destroyed = 1;
					delete this._tweens[id];
				}
			}
		}
		else {
			for (var id in this._tweens) {
				var tween = this._tweens[id];
				tween.destroyed = 1;
			}
			this._tweens = {};
		}
	}
	
};
TweenManager.tween = TweenManager.add;

// Tween Object

function Tween(_args) {
	// create new tween
	// args should contain:
	//	target: target object
	//	duration: length of animation in logic frames
	//	mode: EaseIn, EaseOut, EaseInOut (omit or empty string for linear)
	//	algorithm: Quadtaric, etc.
	//	properties: { x: {start:0, end:150}, y: {start:0, end:250, filter:Math.floor} }
	if (!_args.algorithm && _args.algo) { _args.algorithm = _args.algo; delete _args.algo; }
	if (!_args.properties && _args.props) { _args.properties = _args.props; delete _args.props; }
	
	for (var _key in _args) this[_key] = _args[_key];
	
	// linear shortcut
	if (!this.mode) this.mode = 'EaseIn';
	if (!this.algorithm) this.algorithm = 'Linear';
	
	this.require('target', 'duration', 'properties');
	// if (typeof(this.target) != 'object') return alert("Tween: Target is not an object");
	if (typeof(this.duration) != 'number') return alert("Tween: Duration is not a number");
	if (typeof(this.properties) != 'object') return alert("Tween: Properties is not an object");
		
	// setup properties
	for (var _key in this.properties) {
		var _prop = this.properties[_key];
		if (typeof(_prop) == 'number') _prop = this.properties[_key] = { end: _prop };
		if (typeof(_prop) != 'object') return alert("Tween: Property " + _key + " is not the correct format");
		if (typeof(_prop.start) == 'undefined') _prop.start = this.target[_key];
		
		if (_prop.start.toString().match(/^([\d\.]+)([a-zA-Z]+)$/) && !_prop.suffix) {
			_prop.start = RegExp.$1;
			_prop.suffix = RegExp.$3;
			_prop.end = _prop.end.toString().replace(/[^\d\.]+$/, '');
		}
		if ((typeof(_prop.start) != 'number') && _prop.start.toString().match(/^\d+\.\d+$/)) {
			_prop.start = parseFloat( _prop.start );
		}
		else if ((typeof(_prop.start) != 'number') && _prop.start.toString().match(/^\d+$/)) {
			_prop.start = parseInt( _prop.start, 10 );
		}
		
		if ((typeof(_prop.end) != 'number') && _prop.end.toString().match(/^\d+\.\d+$/)) {
			_prop.end = parseFloat( _prop.end );
		}
		else if ((typeof(_prop.end) != 'number') && _prop.end.toString().match(/^\d+$/)) {
			_prop.end = parseInt( _prop.end, 10 );
		}
		
		if (typeof(_prop.start) != 'number') return alert("Tween: Property " + _key + ": start is not a number");
		if (typeof(_prop.end) != 'number') return alert("Tween: Property " + _key + ": end is not a number");
		if (_prop.filter && (typeof(_prop.filter) != 'function')) return alert("Tween: Property " + _key + ": filter is not a function");
	}
}

Tween.prototype.destroyed = false;
Tween.prototype.delay = 0;

Tween.prototype.require = function() {
	// make sure required class members exist
	for (var _idx = 0, _len = arguments.length; _idx < _len; _idx++) {
		if (typeof(this[arguments[_idx]]) == 'undefined') {
			return alert("Tween: Missing required parameter: " + arguments[_idx]);
		}
	}
	return true;
};

Tween.prototype.logic = function(clock) {
	// abort if our target is destroyed
	// (and don't call onTweenComplete)
	if (this.target.destroyed) {
		this.destroyed = true;
		return;
	}
	if (this.delay > 0) {
		this.delay--;
		if (this.delay <= 0) this.start = clock;
		else return;
	}
	if (!this.start) this.start = clock;
	
	// calculate current progress
	this.amount = (clock - this.start) / this.duration;
	if (this.amount >= 1.0) {
		this.amount = 1.0;
		this.destroyed = true;
	}
	
	// animate obj properties
	for (var _key in this.properties) {
		var _prop = this.properties[_key];
		var _value = _prop.start + (ease(this.amount, this.mode, this.algorithm) * (_prop.end - _prop.start));
		if (_prop.filter) _value = _prop.filter( _value );
		
		/* console.log( "tweening: " + _key + ": " + serialize({
			id: this.id,
			amount: this.amount,
			start: _prop.start,
			end: _prop.end,
			mode: this.mode,
			algorithm: this.algorithm,
			value: _value
		}) ); */
		
		this.target[_key] = _prop.suffix ? ('' + _value + _prop.suffix) : _value;
	}
	
	// notify object that things are happening to it
	if (this.onTweenUpdate) this.onTweenUpdate(this);
	if (this.target.onTweenUpdate) this.target.onTweenUpdate(this);
	
	if (this.destroyed) {
		if (this.onTweenComplete) this.onTweenComplete(this);
		if (this.target.onTweenComplete) this.target.onTweenComplete(this);
	}
};

// Static Utility Function for tweening a single property to a single point in an animation

function tweenFrame(_start, _end, _amount, _mode, _algo) {
	return _start + (ease(_amount, _mode, _algo) * (_end - _start));
}

//
// Easing functions
//

var EaseAlgos = {
	Linear: function(_amount) { return _amount; },
	Quadratic: function(_amount) { return Math.pow(_amount, 2); },
	Cubic: function(_amount) { return Math.pow(_amount, 3); },
	Quartetic: function(_amount) { return Math.pow(_amount, 4); },
	Quintic: function(_amount) { return Math.pow(_amount, 5); },
	Sine: function(_amount) { return 1 - Math.sin((1 - _amount) * Math.PI / 2); },
	Circular: function(_amount) { return 1 - Math.sin(Math.acos(_amount)); }
};
var EaseModes = {
	EaseIn: function(_amount, _algo) { return EaseAlgos[_algo](_amount); },
	EaseOut: function(_amount, _algo) { return 1 - EaseAlgos[_algo](1 - _amount); },
	EaseInOut: function(_amount, _algo) {
		return (_amount <= 0.5) ? EaseAlgos[_algo](2 * _amount) / 2 : (2 - EaseAlgos[_algo](2 * (1 - _amount))) / 2;
	}
};
function ease(_amount, _mode, _algo) {
	return EaseModes[_mode]( _amount, _algo );
}
