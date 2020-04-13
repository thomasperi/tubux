(function(P,U,L){L(U,P);}(this,function(){'use strict';
/*!
 * Tubux v0.0.1
 * https://github.com/thomasperi/tubux#readme
 * Thomas Peri <hello@thomasperi.net>
 * MIT License
 */

// Centralized error messages.
var ERROR_WRITEONLY = 'this accessor is write-only',
	ERROR_READONLY = 'this accessor is read-only',
	ERROR_HIDDEN = 'this accessor is hidden';

// Public $$ object
var $$ = {
	accessor: accessor,
	assign: assign,
	struct: struct,

	debug: false,
	
	errors: {
		WRITEONLY: ERROR_WRITEONLY,
		READONLY: ERROR_READONLY,
		HIDDEN: ERROR_HIDDEN
	}
};

// Aid minification with some shortcuts.
var has = 'hasOwnProperty',
	pt = 'prototype',
	fun = 'function';

// Build an accessor member.
function accessor(value) {
	return new AccessorProxy(value);
}

// Like underscore's _.assign
function assign(target) {
	eachIndex(arguments, function (source) {
		eachOwn(source, function (key, val) {
			target[key] = val;
		});
	}, 1);
	return target;
}

// A class-like way of defining a constructor.
function struct(settings) {
	// Superimpose the supplied settings over the defaults.
	settings = assign({}, {
		params: {},
		proto: {},
		statics: {},
		construct: null
	}, settings);
	
	// Stash the parameters.
	var params = settings.params;
	
	// Stash the constructor method if it's really a function.
	var construct =
		typeof (construct = settings.construct) === fun ?
		construct : null;
	
	// Define the constructor function that `struct` will return.
	function TubuxStruct (options) {
		var // Keep this instance's `this` value for use in inner functions.
			self = this,
			
			// An object for temporarily stashing all the accessors in.
			accessors = {};
		
		// Copy the default params values onto this instance.
		assign(self, params);
		
		// Copy the passed-in values onto the instance, overwriting the defaults.
		eachOwn(options, function (key, value) {
			// If an existing value is an accessor, replace that accessor's
			// value with the value passed to the constructor.
			if (self[key] instanceof AccessorProxy) {
				self[key].value = value;
			} else {
				// For regular values, just use the passed-in value.
				self[key] = value;
			}
		});
		
		// Create real accessor functions from any AccessorProxy values
		eachOwn(self, function (key, value) {
			if (value instanceof AccessorProxy) {
				self[key] = accessors[key] = value.generate(this);
			}
		});
		
		// Call the constructor
		if (construct) {
			construct.call(self);
		}
		
		// Delete any yet-undeleted `ready` methods from the accessor methods.
		eachOwn(accessors, function (key, value) {
			if (self[key] === value) {
				delete self[key].ready;
			}
		});
	}

	// Assign the prototype members to the constructor's prototype.
	assign(TubuxStruct[pt], settings.proto);

	// Assign the static members to the constructor.
	assign(TubuxStruct, settings.statics);

	// Return this struct's constructor function.
	return TubuxStruct;
}

// For...in loop.
function eachOwn(obj, fn) {
	for (var key in obj) {
		if (obj[has](key)) {
			fn(key, obj[key]);
		}
	}
}

// For loop.
function eachIndex(array, fn, first, count) {
	var i, len = count || array.length;
	for (i = first || 0; i < len; i++) {
		fn(array[i], i);
	}
}

// A temporary proxy for accessor functions.
function AccessorProxy(value) {
	var self = this;
	assign(self, {
		value: value,
		s: [],
		f: undefined,
		r: true,
		w: true,
		readonly: function () {
			self.w = false;
			return self;
		},
		writeonly: function () {
			self.r = false;
			return self;
		},
		hidden: function () {
			self.w = false;
			self.r = false;
			return self;
		},
		filter: function (fn) {
			self.f = fn;
			return self;
		},
		listen: function (s) {
			self.s.push(s);
			return self;
		}
	});
}

// Generate an accessor function that gets or sets a value depending on whether
// the function receives an argument.
AccessorProxy[pt].generate = function (obj) {
	var value,
		filterfn = typeof this.f === fun ? this.f : null,
		listeners = this.s,
		readable = this.r,
		writable = this.w;
	
	// Define the public accessor conditionally, so the conditions don't
	// need to be evalutated at the time of access.
	var publicAccess = 

		// If this accessor is both writable and readable, just use the 
		// private accessor as the public one.
		writable && readable ? privateAccess :
		
		// If this accessor is writable but not readable, set the new value
		// if provided, or throw an exception if trying to read.
		writable ? function () {
			if (arguments.length > 0) {
				set(arguments[0]);
				return value;
			}
			throw_writeonly();
		} :
		
		// If this accessor is readable but not writable, return the value,
		// or throw an exception if trying to set a new value.
		readable ? function () {
			if (arguments.length === 0) {
				return value;
			}
			throw_readonly();
		} : 
		
		// If this accessor is neither readable nor writable, throw an
		// exception regardless of whether there are any arguments.
		function () {
			throw_hidden();
		};

	// Set a new possibly-filtered value and update any listeners.
	function set(newValue) {
		var oldValue = value;
		value = filterfn ?
			filterfn(newValue) :
			newValue;
			
		// Only publish to listeners if the value has actually changed.
		if (oldValue !== value) {
			methods.publish();
		}
	}
	
	// An unfettered accessor function for private use within the struct.
	function privateAccess() {
		// If there's an argument, act as a setter and assign it as this
		// accessor's value and inform all the listeners.
		if (arguments.length > 0) {
			set(arguments[0]);
		}
		// Return the value back even when setting.
		return value;
	}
	
	
	// Functions to assign as methods of both accessor functions:
	var methods = {
		// Get the internal accessor, for inside the constructor's closure.
		// This method gets removed automatically after the `construct` function
		// is finished.
		ready: function () {
			return privateAccess;
		},
		
		// Inform all the listeners of this accessor's current value.
		publish: function () {
			eachIndex(listeners, function (listener) {
				listener.call(obj, value);
			});
			return this;
		},
		
		// Set a function for transforming any values set to this accessor.
		filter: function (fn) {
			// Set the new filter function.
			filterfn = typeof fn === fun ? fn : null;
		
			// Re-set the value with the new filter.
			privateAccess(value);
		
			// All the methods of accessor functions return either the public or
			// private accessor function.
			return this;
		},
		
		// Register a listener with this accessor.
		listen: function (listener) {
			if (listeners.indexOf(listener) < 0) {
				listeners.push(listener);
			}
			return this;
		},
		
		// Unregister a listener from this accessor.
		unlisten: function (listener) {
			var index = listeners.indexOf(listener);
			if (index >= 0) {
				listeners.splice(index, 1);
			}
			return this;
		}
	};
	
	// Assign all the methods to both public and private accessors.
	assign(publicAccess, methods);
	assign(privateAccess, methods);
	
	// Prevent filters being added via the public accessor
	// if it isn't both readable and writable.
	if (!writable || !readable) {
		publicAccess.filter = 
			readable ? throw_readonly :
				writable ? throw_writeonly :
					throw_hidden;
	}
	
	// Prevent listeners being added via the public accessor
	// if it isn't readable.
	if (!readable) {
		publicAccess.listen = 
			writable ? throw_writeonly :
				throw_hidden;
	}

	// Set the initial value after everything is set up,
	// so that any default listener and/or filters hear about it.
	privateAccess(this.value);
	
	// The external accessor gets assigned to the object by default.
	return publicAccess; 
};

function throw_readonly() {
	throw ERROR_READONLY;
}

function throw_writeonly() {
	throw ERROR_WRITEONLY;
}

function throw_hidden() {
	throw ERROR_HIDDEN;
}

function debug(msg) {
	if ($$.debug) {
		/*global console */
		console.log(msg);
	}
}

return $$;


}, function (factory, root) {
	/*global require, define, exports, module */
	'use strict';
	
	var library,
		original,
		hasOriginal,
		
		// Shortcuts
		n = '$$',
		hop = 'hasOwnProperty',
		noc = 'noConflict',
		obj = 'object',
		def = typeof define === 'function' && define,
		exp = typeof exports === obj && exports,
		mod = typeof module === obj && module;
	
	// AMD
	if (def && def.amd && typeof def.amd === obj) {
		define([], factory);
	
	// CommonJS
	} else if (mod && exp === root && exp === mod.exports) {
		module.exports = factory();
	
	// Web
	} else {
		
		// Stash the original value if there was one.
		if ((hasOriginal = root[hop](n))) {
			original = root[n];
		}
		
		// Assign the new value and stash it for later.
		root[n] = library = factory();

		// If the library doesn't define its own `noConflict` method,
		// define a new one that reverts the property on the root object
		// and returns the library for reassignment.
		if (hasOriginal && !library[hop](noc)) {
			library[noc] = function () {
				root[n] = original;
				return library;
			};
		}
		
	} 
}));