
/*!
 * Tubux v1.0.2+dev
 * https://github.com/thomasperi/tubux#readme
 * Thomas Peri <hello@thomasperi.net>
 * MIT License
 */

// Centralized error messages.
var E_WRITEONLY = 'this accessor is write-only',
	E_READONLY = 'this accessor is read-only',
	E_REQUIRED = 'this accessor is required',
	E_ACCESSORONLY = 'this flag is only available after applying the .accessor() flag',
	E_PROTOPROXY = 'assigning $$(...) values to the prototype is not allowed';
	
// Aid minification with some shortcuts.
var has = 'hasOwnProperty',
	pt = 'prototype',
	fun = 'function',
	idx = 'indexOf',
	nil = null,
	undef; // leave undefined 'cause that's what it is.

// Expose functionality.
assign($$, {
	assign: assign,
// 	detach: detach, // to-do: maybe bring this back, see method below
	secret: secret,
	struct: struct,

	// Expose error messages for comparison purposes.
	errors: {
		WRITEONLY: E_WRITEONLY,
		READONLY: E_READONLY,
		REQUIRED: E_REQUIRED,
		ACCESSORONLY: E_ACCESSORONLY,
		PROTOPROXY: E_PROTOPROXY
	},
	
	// Don't change this value here. Only set it from outside.
	debug: false
});


///// Surface /////

// Public $$ is a function for creating parameter proxies,
// as well as an object to attach the other methods to.
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

// to-do: Secrets kind of make this moot, but I'm keeping it around
// in case it looks like it might be nice to have later.
// Remove a property and return its value
// function detach(self, prop) {
// 	var val = self[prop];
// 	delete self[prop];
// 	return val;
// }

// Make the entire params object secret.
function secret(params) {
	return eachOwn(params, function (key, value) {
		// Convert all the flat, non-proxy values to proxies.
		if (!(proxyFlag(value))) {
			value = params[key] = $$(value);
		}
		value.secret();
	});
}

// A class-like way of defining a constructor.
function struct(settings) {
	// Superimpose the supplied settings over the defaults.
	settings = assign({}, {
		params: {},
		proto: {},
		statics: {},
		construct: nil
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
			accessors = {},
			
			// The secret parameters to be passed to the construct function.
			secrets = {};
		
		// Ensure options is an object.
		options = (typeof options === 'object' && options) || {};
		
		// Copy the default params values
		// onto this instance or the secrets object.
		eachOwn(params, function (key, val) {
			
			// Enforce required options.
			if (proxyFlag(val, 'required') && !options[has](key)) {
				accessErrorThrower(E_REQUIRED, key)();
			}
			
			// If the value is a TubuxProxy, clone it.
			if (proxyFlag(val)) {
				val = new TubuxProxy(val);
			}
			
			// If it's secret, add it to the secrets.
			if (proxyFlag(val, 'secret')) {
				secrets[key] = val;

			// If not secret, copy it to this instance.
			} else {
				self[key] = val;
			}
		});
		
		// Copy the options passed to the constructor onto
		// either this instance or the secrets object.
		eachOwn(options, function (key, val) {
			if (!transplant(self, key, val)) {
				transplant(secrets, key, val);
			}
		});
		
		// Resolve each member of this instance and each secret member.
		// Attach both 
		resolve(self, accessors, self);
		resolve(secrets, accessors, self);
		
		// Automatically claim the `privateAccess` versions
		// of all the accessors that were flagged `.secret()`.
		eachOwn(accessors, function (key, value) {
			if (secrets[has](key)) {
				secrets[key] = value.claim();
			}
		});
		
		// Call the construct function.
		if (construct) {
			construct.call(self, secrets);
		}
		
		// After construct is done, no more accessors should have the
		// `claim` method.
		unclaim(accessors);
	}
	
	// Prevent accessors from being assigned to the prototype, because there's
	// no reason to have them there, and their use would be confusing.
	eachOwn(settings.proto, function (key, value) {
		if (proxyFlag(value)) {
			accessErrorThrower(E_PROTOPROXY, key)();
		}
	});
	
	// Assign the prototype members to the constructor's prototype.
	assign(TubuxStruct[pt], settings.proto);

	// Assign the static members to the constructor.
	assign(TubuxStruct, settings.statics);
	
	// Resolve any static members that are proxies,
	// and remove the `claim` method from any members that are accessors.
	unclaim(resolve(TubuxStruct, {}, false));
	
	// Return this struct's constructor function.
	return TubuxStruct;
}


///// Struct Helpers /////

// Copy an option passed to the constructor onto `obj` (which is either the
// instance or the secrets object) but only if there's already a property by
// that name, indicating that that's the object it belongs on.
function transplant(obj, key, value) {
	if (obj[has](key)) {
		// If the option's associated default value is a TubuxProxy,
		// replace that TubuxProxy's value with the passed value.
		if (obj[key] instanceof TubuxProxy) {
			obj[key]._value = value;
		} else {
			// For params that are regular values,
			// replace the default value itself with the passed value.
			obj[key] = value;
		}
		return true;
	}
}

// Resolve TubuxProxy objects into their final forms, by applying the filters
// on each proxy, and then converting the proxy either into an accessor
// function or a flat value.
function resolve(obj, accessors, thisvar) {
	eachOwn(obj, function (key, value) {
		// If the value is an accessor, generate the accessor function.
		// This applies filters and listeners too.
		if (proxyFlag(value, 'accessor')) {
			obj[key] = accessors[key] = generate(value, thisvar, key);
		
		// If the value isn't an accessor but is a TubuxProxy,
		// set the property to the proxy's value.
		} else if (proxyFlag(value)) {
			obj[key] = value._value;
		}
	});
	return accessors;
}

// Remove the `claim` methods from a bunch of accessor functions.
function unclaim(accessors) {
	eachOwn(accessors, function (key, value) {
		delete value.claim;
	});
}

// Is `proxy` a TubuxProxy instance, and does it have its `flag` flag set?
function proxyFlag(proxy, flag) {
	return proxy instanceof TubuxProxy && (!flag || proxy._flags[flag]);
}


///// Proxy Functions /////

// A proxy for preprocessing parameter values.
function TubuxProxy(val) {
	var flags = {
		listen: [],
		filter: []
	};
	if (proxyFlag(val)) {
		// Copy the `flags` object from the original proxy.
		assign(flags, val._flags);
		
		// Copy the `_value` from the original.
		val = val._value;
		
		// Copy the `listen` and `filter` arrays.
		flags.listen = flags.listen.slice();
		flags.filter = flags.filter.slice();
	}
	assign(this, {
		// underscore properties are terser-manglable.
		_value: val,
		_flags: flags
	});
}

// A function for adding flagging methods to the TubuxProxy prototype.
function addFlags(proto, flags) {
	eachOwn(flags, function (name, sanitizer) {
		proto[name] = function (val) {
			if (!arguments.length) {
				val = true;
			}
			this._flags[name] = 
				sanitizer ?
					sanitizer.call(this, val, name) :
					val;
			return this;
		};
	});
}

// Produce a flagging function that adds its argument to an array
// instead of setting a static value.
function arrayFlag(flagName, sanitizer) {
	return function (val) {
		if (sanitizer) {
			sanitizer.call(this, val, flagName);
		}
		var array = this._flags[flagName];
		if (
			(val = functionOrNull(val)) &&
			array[idx](val) < 0
		) {
			array.push(val);
		}
		return array;
	};
}

// A sanitizer for `addFlags` to allow the given argument flag
// to only be used on accessors.
function accessorsOnlySanitizer(val, flagName) {
	/*jshint validthis:true */
	if (!this._flags.accessor) {
		accessErrorThrower(E_ACCESSORONLY, flagName)();
	}
	return val;
}

// Add those flagging methods.
addFlags(TubuxProxy[pt], {
	// Used by constructor
	accessor: nil,
	required: nil,
	secret: nil,
	
	// Used only in accessors
	readonly: accessorsOnlySanitizer,
	writeonly: accessorsOnlySanitizer,
	filter: arrayFlag('filter', accessorsOnlySanitizer),
	listen: arrayFlag('listen', accessorsOnlySanitizer)
});

// Generate an accessor function that gets or sets a value
// depending on whether the function receives an argument.
// (This method gets called on TubuxProxy instances as `this`)
function generate(self, obj, key) {
	var value, // declare but don't set yet
		
		// Get flags
		flags = self._flags,
		readonly = flags.readonly,
		writeonly = flags.writeonly,
		listen = flags.listen,
		filter = flags.filter,
	
		// functions for throwing errors
		throw_readonly = accessErrorThrower(E_READONLY, key),
		throw_writeonly = accessErrorThrower(E_WRITEONLY, key);

	// Define the public accessor conditionally, so the conditions don't
	// need to be evalutated at the time of access.
	var publicAccess = 
		
		// If this accessor is readonly, return the value,
		// or throw an exception if trying to set a new value.
		readonly ? function () {
			if (!arguments.length) {
				return value;
			}
			throw_readonly();
		} :
		
		// If this accessor is writeonly, set the new value
		// if provided, or throw an exception if trying to read.
		writeonly ? function () {
			if (arguments.length) {
				// Filter this even though it's writeonly, because the filters
				// might have been assigned directly to the TubuxProxy.
				// Adding a filter isn't allowed on writeonly public accessor
				// functions.
				set_with_filter(arguments[0]);
				return value;
			}
			throw_writeonly();
		} :
		
		// If this accessor is both writable and readable,
		// just use the private accessor as the public one.
		privateAccess;


	// Set a new possibly-filtered value and update any listeners.
	function set_with_filter(newValue) {
		if (filter) {
			eachIndex(filter, function (fn) {
				if (fn) {
					newValue = fn.call(obj, newValue);
				}
			});
		}
		set_without_filter(newValue);
	}
	
	// Set a new value without filtering it.
	function set_without_filter(newValue) {
		// Only publish to listeners if the value has actually changed.
		var oldValue = value;
		value = newValue;
		if (oldValue !== value) {
			methods.publish();
		}
	}

	// An unfettered accessor function for private use within the struct.
	function privateAccess() {
		// If there's an argument, act as a setter and assign it as this
		// accessor's value and inform all the listeners.
		if (arguments.length) {
			set_with_filter(arguments[0]);
		}
		// Return the value back even when setting.
		return value;
	}

	// Functions to assign as methods of both accessor functions:
	var methods = {
		// Get the internal accessor, for inside the constructor's closure.
		// This method gets removed automatically after the `construct` function
		// is finished.
		
		// Claim the private version of this accessor.
		claim: function () {
			return privateAccess;
		},
	
		// Inform all the listeners of this accessor's current value.
		publish: function () {
			if (listen) {
				eachIndex(listen, function (listener) {
					if (listener) {
						listener.call(obj, value);
					}
				});
			}
			return this;
		},
	
		// Set a function for transforming any values set to this accessor.
		filter: function (fn) {
			if (filter[idx](fn) < 0) {
				filter.push(fn);

				// Re-set the value using only the new filter.
				set_without_filter(
					fn.call(obj, value) // call the filter before passing
				);
			}
	
			// All the methods of accessor functions return either the public or
			// private accessor function.
			return this;
		},
	
		// Register a listener with this accessor.
		listen: function (fn) {
			if (listen[idx](fn) < 0) {
				listen.push(fn);
			}
			return this;
		},
	
		// Unregister a listener from this accessor.
		unlisten: function (fn) {
			var index = listen[idx](fn);
			if (index >= 0) {
				listen.splice(index, 1);
			}
			return this;
		},
	
		// Unregister a filter from this accessor.
		unfilter: function (fn) {
			var index = filter[idx](fn);
			if (index >= 0) {
				filter.splice(index, 1);
			}
			return this;
		}
	};

	// Assign all the methods to both public and private accessors.
	assign(publicAccess, methods);
	assign(privateAccess, methods);

	// Readonly accessors should not set filters publicly,
	// because filters effectively write.
	if (readonly) {
		publicAccess.filter = throw_readonly;
	}

	// Writeonly accessors should not set filters or listeners publicly,
	// because filters and listeners both read.
	if (writeonly) {
		publicAccess.filter =
			publicAccess.listen =
				throw_writeonly;
	}

	// Set the initial value after everything is set up,
	// so that any default listener and/or filters hear about it.
	privateAccess(self._value);
	
	// The external accessor gets assigned to the object by default.
	return publicAccess; 
}


///// General Helpers /////

// For...in loop.
function eachOwn(obj, fn) {
	for (var key in obj) {
		if (obj[has](key)) {
			fn(key, obj[key]);
		}
	}
	return obj;
}

// For loop.
function eachIndex(array, fn, first) {
	var i, len = array.length;
	for (i = first || 0; i < len; i++) {
		fn(array[i], i);
	}
	return array;
}

// Nullify anything that isn't a function.
function functionOrNull(fn) {
	return (typeof fn === fun) ? fn : nil;
}

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


///// Debugging /////

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
debug(undef);
