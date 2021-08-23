/**
 * JavaScript Object Oriented Programming Framework
 * Author: Joseph Huckaby
 * Copyright (c) 2008 Joseph Huckaby.
 * Released under the LGPL v3.0: http://www.opensource.org/licenses/lgpl-3.0.html
 **/

function _var_exists(name) {
	// return true if var exists in "global" context, false otherwise
	try {
		eval('var foo = ' + name + ';');
	}
	catch (e) {
		return false;
	}
	return true;
}

var Namespace = {
	// simple namespace support for classes
	create: function(path) {
		// create namespace for class
		var container = null;
		while (path.match(/^(\w+)\.?/)) {
			var key = RegExp.$1;
			path = path.replace(/^(\w+)\.?/, "");
			
			if (!container) {
				if (!_var_exists(key)) eval('window.' + key + ' = {};');
				eval('container = ' + key + ';');
			}
			else {
				if (!container[key]) container[key] = {};
				container = container[key];
			}
		}
	},
	prep: function(name) {
		// prep namespace for new class
		if (name.match(/^(.+)\.(\w+)$/)) {
			var path = RegExp.$1;
			name = RegExp.$2;
			Namespace.create(path);
		}
		return { name: name };
	}
};

var Class = {
	// simple class factory
	create: function(name, members) {
		// generate new class with optional namespace
		
		// support Prototype-style calling convention
		if (!name && !members) {
			return( function() { 
				if (this.initialize) this.initialize.apply(this, arguments);
				else if (this.__construct) this.__construct.apply(this, arguments);
			} );
		}
		
		assert(name, "Must pass name to Class.create");
		if (!members) members = {};
		members.__parent = null;

		var ns = Namespace.prep(name);
		// var container = ns.container;
		var full_name = name;
		name = ns.name;
		
		members.__name = name;

		if (!members.__construct) members.__construct = function() {};
		
		// container[name] = members.__construct;
		var obj = null;
		eval( full_name + ' = obj = members.__construct;' );
		
		var static_members = members.__static;
		if (static_members) {
			for (var key in static_members) {
				obj[key] = static_members[key];
			}
		}

		obj.prototype = members;
		obj.extend = obj.subclass = function(name, members) {
			Class.subclass( this, name, members );
		};
		obj.set = obj.add = function(members) {
			Class.add( this, members );
		};
	},
	subclass: function(parent, name, members) {
		// subclass an existing class
		assert(parent, "Must pass parent class to Class.subclass");
		assert(name, "Must pass name to Class.subclass");
		if (!members) members = {};
		members.__name = name;
		members.__parent = parent.prototype;
		
		var ns = Namespace.prep(name);
		// var container = ns.container;
		var subname = ns.name;
		
		var obj = null;
		
		if (members.__construct) {
			// explicit subclass constructor
			// container[subname] = members.__construct;
			eval( name + ' = obj = members.__construct;' );
		}
		else {
			// inherit parent's constructor
			var code = parent.toString();
			var args = code.substring( code.indexOf("(")+1, code.indexOf(")") );
			var inner_code = code.substring( code.indexOf("{")+1, code.lastIndexOf("}") );
			eval('members.__construct = ' + name + ' = obj = function ('+args+') {'+inner_code+'};');
		}
		
		// inherit static from parent, if applicable
		if (parent.prototype.__static) {
			for (var key in parent.prototype.__static) {
				obj[key] = parent.prototype.__static[key];
			}
		}

		var static_members = members.__static;
		if (static_members) {
			for (var key in static_members) {
				obj[key] = static_members[key];
			}
		}

		obj.prototype = new parent();
		// for (var key in parent.prototype) container[subname].prototype[key] = parent.prototype[key];
		for (var key in members) obj.prototype[key] = members[key];
		
		obj.extend = obj.subclass = function(name, members) {
			Class.subclass( this, name, members );
		};
		obj.set = obj.add = function(members) {
			Class.add( this, members );
		};
	},
	add: function(obj, members) {
		// add members to an existing class
		for (var key in members) obj.prototype[key] = members[key];
	},
	require: function() {
		// make sure classes are loaded
		for (var idx = 0, len = arguments.length; idx < len; idx++) {
			assert( !!eval('window.' + arguments[idx]) );
		}
		return true;
	}
};
Class.extend = Class.subclass;
Class.set = Class.add;

if (!window.assert) window.assert = function(fact, msg) {
	// very simple assert
	if (!fact) return alert("ASSERT FAILED!  " + msg);
	return fact;
};
