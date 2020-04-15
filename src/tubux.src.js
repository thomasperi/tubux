
/*!
 * Tubux v1.0.1
 * https://github.com/thomasperi/tubux#readme
 * Thomas Peri <hello@thomasperi.net>
 * MIT License
 */

// Centralized error messages.
var E_WRITEONLY = 'this accessor is write-only',
	E_READONLY = 'this accessor is read-only',
	E_HIDDEN = 'this accessor is hidden',
	E_REQUIRED = 'this accessor is required',
	E_ACCESSORONLY = 'this flag is only available after applying the .accessor() flag',
	E_PROTOPROXY = 'cannot assign $$(...) values to proto',
	E_STATICPROXY = 'cannot assign $$(...) values to statics';

// Aid minification with some shortcuts.
var has = 'hasOwnProperty',
	pt = 'prototype',
	fun = 'function';

// Expose functionality.
assign($$, {
	assign: assign,
	struct: struct,

	// Expose error messages for comparison purposes.
	errors: {
		WRITEONLY: E_WRITEONLY,
		READONLY: E_READONLY,
		HIDDEN: E_HIDDEN,
		REQUIRED: E_REQUIRED,
		ACCESSORONLY: E_ACCESSORONLY,
		PROTOPROXY: E_PROTOPROXY,
		STATICPROXY: E_STATICPROXY
	},
	
	// Don't change this value here. Only set it from outside.
	debug: false
});

// Public $$ function & methods
function $$(value) {
	return new TubuxProxy(value);
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
	var construct = functionOrNull(settings.construct);
	
	// Define the constructor function that `struct` will return.
	function TubuxStruct (options) {
		var // Keep this instance's `this` value for use in inner functions.
			self = this,
			
			// An object for temporarily stashing all the accessors in.
			accessors = {};
		
		// Ensure options is an object.
		options = (typeof options === 'object' && options) || {};
		
		// Copy the default params values onto this instance.
		eachOwn(params, function (key, value) {
			// Enforce required options.
			if (proxyFlag(value, 'required') && !options[has](key)) {
				accessErrorThrower(E_REQUIRED, key)();
			}
			// Copy it to this instance.
			self[key] = value;
		});
		
		// Copy the options passed to the constructor onto this instance.
		eachOwn(options, function (key, value) {
			// If the option's associated default value is a TubuxProxy,
			// replace that TubuxProxy's *value* with the option's value.
			if (self[key] instanceof TubuxProxy) {
				self[key].value = value;
			} else {
				// For params that are regular values,
				// replace the default value itself with the option value.
				self[key] = value;
			}
		});
		
		// Resolve each member of this instance that's a TubuxProxy,
		// filtering if there's a filter, and
		// converting it either into an accessor function or a flat value.
		eachOwn(self, function (key, value) {
			// Apply filter if it exists.
			var filter = proxyFlag(value, 'filter');
			if (filter) {
				value.value = filter(value.value);
			}
			// If the value is an accessor, generate the accessor function.
			if (proxyFlag(value, 'accessor')) {
				self[key] = accessors[key] = value.generate(self, key);
			
			// If the value isn't an accessor but is a TubuxProxy,
			// set the property to the proxy's value.
			} else if (value instanceof TubuxProxy) {
				self[key] = value.value;
			}
		});
		
		// Call the construct function.
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
	
	// Prevent proxies from being assigned to proto or statics.
	eachOwn(settings.proto, function (key, value) {
		if (value instanceof TubuxProxy) {
			accessErrorThrower(E_PROTOPROXY, key)();
		}
	});
	eachOwn(settings.statics, function (key, value) {
		if (value instanceof TubuxProxy) {
			accessErrorThrower(E_STATICPROXY, key)();
		}
	});

	// Assign the prototype members to the constructor's prototype.
	assign(TubuxStruct[pt], settings.proto);

	// Assign the static members to the constructor.
	assign(TubuxStruct, settings.statics);

	// Return this struct's constructor function.
	return TubuxStruct;
}

// Nullify anything that isn't a function.
function functionOrNull(fn) {
	return (typeof fn === fun) ? fn : null;
}

// Is `proxy` a TubuxProxy instance, and does it have its `flag` flag set?
function proxyFlag(proxy, flag) {
	return proxy instanceof TubuxProxy && proxy[flag].v;
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

// A temporary TubuxProxy for accessor functions.
function TubuxProxy(value) {
	var self = this,
		listeners = [];
	
	function flagMethod(checkfirst) {
		function flag() {
			if (checkfirst) {
				checkfirst();
			}
			flag.v = true;
			return self;
		}
		return flag;
	}
	
	function accessorsOnly(flag) {
		return function () {
			if (!self.accessor.v) {
				accessErrorThrower(E_ACCESSORONLY, flag)();
			}
		};
	}
	
	assign(self, {
		value: value,
		
		// Used in TubuxStruct
		accessor: flagMethod(),
		required: flagMethod(),
		
		// Used for accessor operations
		readonly: flagMethod(accessorsOnly('readonly')),
		writeonly: flagMethod(accessorsOnly('writeonly')),
		hidden: flagMethod(accessorsOnly('hidden')),
		
		// Set the filter
		filter: function (filter) {
			self.filter.v = functionOrNull(filter);
			return self;
		},
		
		// Register a listener
		listen: function (listener) {
			accessorsOnly('listen')();
			listeners.push(functionOrNull(listener));
			return self;
		},
		
		// Retrieve the array of listeners.
		listeners: function () {
			return listeners;
		}
	});
}

// Generate an accessor function that gets or sets a value depending on whether
// the function receives an argument.
TubuxProxy[pt].generate = function (obj, key) {
	var self = this,
		value, // declare but don't set yet
		
		// flags
		readonly = self.readonly.v,
		writeonly = self.writeonly.v,
		hidden = self.hidden.v,
		
		// derived flags
		readable = !writeonly && !hidden,
		writable = !readonly && !hidden,
		
		// callbacks
		filter = functionOrNull(self.filter.v),
		listeners = self.listeners(),
		
		// functions for throwing errors
		throw_hidden = accessErrorThrower(E_HIDDEN, key),
		throw_readonly = accessErrorThrower(E_READONLY, key),
		throw_writeonly = accessErrorThrower(E_WRITEONLY, key);
	
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
		value = filter ?
			filter(newValue) :
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
				if (listener) {
					listener.call(obj, value);
				}
			});
			return this;
		},
		
		// Set a function for transforming any values set to this accessor.
		filter: function (fn) {
			// Set the new filter function.
			filter = functionOrNull(fn);
		
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

// Produce a function that throws an error with the supplied message and
// property name.
function accessErrorThrower(message, key) {
	return function () {
		throw {
			message: message,
			key: key
		};
	};
}

// Define a function for internal debugging that can be turned on and off again
// in individual unit tests, rather than writing debugging info to the console
// and having all the tests dumping tons of useless output.
function debug(msg) {
	if ($$.debug) {
		/*global console */
		console.log(msg);
	}
}

// Call debug so jshint doesn't complain that it's unused.
// (This won't do anything, because $$.debug is false
// until it gets set to true by something outside the module.)
// Setting /*jshint unused: false */ didn't work for some reason,
// possibly because I've set it true in the gulpfile.
debug();
