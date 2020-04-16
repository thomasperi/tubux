(function(P,U,L){L(U,P);}(this,function(){'use strict';
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
	
	// to-do: test E_PROTOPROXY
	
	E_PROTOPROXY = 'assigning $$(...) values to the prototype is not allowed';

// Aid minification with some shortcuts.
var has = 'hasOwnProperty',
	pt = 'prototype',
	fun = 'function',
	undef; // leave undefined 'cause that's what it is.

// A unique object to prevent accidental outside use of internal features.
var token = {};

// Expose functionality.
assign($$, {
	assign: assign,
	struct: struct,
	secret: secret,

	// Expose error messages for comparison purposes.
	errors: {
		WRITEONLY: E_WRITEONLY,
		READONLY: E_READONLY,
		HIDDEN: E_HIDDEN,
		REQUIRED: E_REQUIRED,
		ACCESSORONLY: E_ACCESSORONLY,
		PROTOPROXY: E_PROTOPROXY
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

// Make the entire params object secret.
function secret(params) {
	return eachOwn(params, function (key, value) {
		// Convert all the flat, non-proxy values to proxies.
		if (!(value instanceof TubuxProxy)) {
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
			if (val instanceof TubuxProxy) {
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
		resolve(self, accessors);
		resolve(secrets, accessors);
		
		// Automatically use the `privateAccess` versions
		// of all the accessors that were flagged `.secret()`.
		eachOwn(accessors, function (key, value) {
			if (secrets[has](key)) {
				secrets[key] = value.secret();
			}
		});
		
		// Call the construct function.
		if (construct) {
			construct.call(self, secrets);
		}
		
		// After construct is done, no more accessors should have the `secret` method.
		desecret(accessors);
	}
	
	// Prevent accessors from being assigned to the prototype, because there's
	// no reason to have them there, and their use would be confusing.
	eachOwn(settings.proto, function (key, value) {
		if (value instanceof TubuxProxy) {
			accessErrorThrower(E_PROTOPROXY, key)();
		}
	});
	
	// Assign the prototype members to the constructor's prototype.
	assign(TubuxStruct[pt], settings.proto);

	// Assign the static members to the constructor.
	assign(TubuxStruct, settings.statics);
	
	// Resolve any static members that are proxies,
	// and remove the `secret` method from any members that are accessors.
	desecret(resolve(TubuxStruct, {}));
	
	// to-do: test proxies on statics
	

	// Return this struct's constructor function.
	return TubuxStruct;
}

// Remove the `secret` methods from a bunch of accessor functions.
function desecret(accessors) {
	eachOwn(accessors, function (key, value) {
		delete value.secret;
	});
}

// Copy an option passed to the constructor onto `obj` (which is either the
// instance or the secrets object) but only if there's already a property by
// that name, indicating that that's the object it belongs on.
function transplant(obj, key, value) {
	if (obj[has](key)) {
		// If the option's associated default value is a TubuxProxy,
		// replace that TubuxProxy's value with the passed value.
		if (obj[key] instanceof TubuxProxy) {
			obj[key].value = value;
		} else {
			// For params that are regular values,
			// replace the default value itself with the passed value.
			obj[key] = value;
		}
		return true;
	}
}

// Resolve TubuxProxy objects into their final forms, by applying the filter
// on each proxy that has one, and then converting the proxy either into an
// accessor function or a flat value.
function resolve(obj, accessors) {
	eachOwn(obj, function (key, value) {
		// Apply filter if it exists.
		var filter = proxyFlag(value, 'filter');
		if (filter) {
			value.value = filter(value.value);
		}
		// If the value is an accessor, generate the accessor function.
		if (proxyFlag(value, 'accessor')) {

			// to-do: think about whether to really pass obj when obj === TubuxStruct
			// which is what happens when resolving proxies assigned to statics.
		
			obj[key] = accessors[key] = value.generate(obj, key);
		
		// If the value isn't an accessor but is a TubuxProxy,
		// set the property to the proxy's value.
		} else if (value instanceof TubuxProxy) {
			obj[key] = value.value;
		}
	});
	return accessors;
}

// Nullify anything that isn't a function.
function functionOrNull(fn) {
	return (typeof fn === fun) ? fn : null;
}

// Is `proxy` a TubuxProxy instance, and does it have its `flag` flag set?
function proxyFlag(proxy, flag) {
	return proxy instanceof TubuxProxy && proxy.get_internal(token)[flag];
}

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
function eachIndex(array, fn, first, count) {
	var i, len = count || array.length;
	for (i = first || 0; i < len; i++) {
		fn(array[i], i);
	}
	return array;
}

// Create a method that turns on a flag or reads its value.
// function createFlagMethod(self, flagName, sanityCheck) {
// 	var value;
// 	return function() {
// 		var val = arguments.length ? arguments[0] : true;
// 		if (val === token) {
// 			return value;
// 		}
// 		value = sanityCheck ? sanityCheck(val, self, flagName) : true;
// 		return self;
// 	};
// }
// 
// function accessorsOnly(val, self, flagName) {
// 	if (!self.accessor(token)) {
// 		accessErrorThrower(E_ACCESSORONLY, flagName)();
// 	}
// 	return val;
// }

// A temporary TubuxProxy for accessor functions.
function TubuxProxy(val) {
	var internal = {};
	if (val instanceof TubuxProxy) {
		// Copy the `internal` object.
		assign(internal, val.get_internal(token));
		val = val.value;
		
		// Copy the `listen` array.
		if (internal.listen) {
			internal.listen = [].slice.call(internal.listen);
		}
	}
	assign(this, {
		value: val,
		set_internal: function (access, key, val) {
			if (access === token) {
				internal[key] = val;
			}
		},
		get_internal: function (access) {
			if (access === token) {
				return internal;
			}
		}
	});
}

function addFlags(proto, flags) {
	eachOwn(flags, function (name, sanitizer) {
		proto[name] = function (val) {
			if (!arguments.length) {
				val = true;
			}
			this.set_internal(token, name, 
				sanitizer ? sanitizer.call(this, val, name) : val
			);
			return this;
		};
	});
}

addFlags(TubuxProxy[pt], {
	accessor: null,
	required: null,
	secret: null,
	
	readonly: accessorsOnlySanitizer,
	writeonly: accessorsOnlySanitizer,
	hidden: accessorsOnlySanitizer,
	
	filter: functionOrNull,
	
	listen: function (val) {
		accessorsOnlySanitizer.call(this, val, 'listen');
		var listen = this.get_internal(token).listen || [];
		if (
			(val = functionOrNull(val)) &&
			listen.indexOf(val) < 0
		) {
			listen.push(val);
		}
		return listen;
	}
});

function accessorsOnlySanitizer(val, flagName) {
	/*jshint validthis:true */
	if (!this.get_internal(token).accessor) {
		accessErrorThrower(E_ACCESSORONLY, flagName)();
	}
	return val;
}

assign(TubuxProxy[pt], {
	// Generate an accessor function that gets or sets a value
	// depending on whether the function receives an argument.
	generate: function (obj, key) {
		var self = this,
			value, // declare but don't set yet
			
			internals = self.get_internal(token),
		
			// flags
			hidden = internals.hidden,
		
			// derived flags
			readable = !internals.writeonly && !hidden,
			writable = !internals.readonly && !hidden,
		
			// callbacks
			filter = internals.filter,
			listen = internals.listen || [],
		
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
			secret: function () {
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
				if (listen.indexOf(listener) < 0) {
					listen.push(listener);
				}
				return this;
			},
		
			// Unregister a listener from this accessor.
			unlisten: function (listener) {
				var index = listen.indexOf(listener);
				if (index >= 0) {
					listen.splice(index, 1);
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
	}
});

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
debug(undef);


return $$;


}, function (factory, root) {
	/*global define, exports, module */
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
		if (!library[hop](noc)) {
			library[noc] = function () {
				if (hasOriginal) {
					root[n] = original;
				} else {
					delete root[n];
				}
				// Once noConflict has been called once, replace it with a new
				// function that just returns the library, to avoid unexpected
				// consequences if it's accidentally called again.
				library[noc] = function () {
					return library;
				};
				return library;
			};
		}
		
	} 
}));