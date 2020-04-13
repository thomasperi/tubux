# Tubux
*Classy Constructors in JavaScript*

## Installation

### npm
* Install: `npm i tubux`
* Require: `var $$ = require("tubux");`

### Web
To load it directly on a web page old-school style:
* [Download a release](https://github.com/thomasperi/tubux/releases)
* The file you need is `dist/tubux.min.js`

## About

ES6 classes don't offer real "information hiding" like regular function closures can. As of early 2020, private fields aren't supported in all major browsers, and private methods are still in draft status. So it'll be a long time before we can expect support across browsers.

Tubux's `struct` sugar helps you define a traditional (pre-ES6) constructor function in a way that somewhat resembles a class, without the repetetive and disjointed code that comes with the usual pattern of defining a constructor function and then attaching members to its prototype.

It also offers a way to generate accessor methods for:
* Setting and getting
* Registering listeners
* Sanitizing input

## Example

There will be more thorough documentation eventually, including how to generate and use accessors, but here's an example using all four `$$.struct` options: `params`, `construct`, `proto`, and `statics`.

```javascript
var Counter = $$.struct({

  // Define which properties can be set when instantiating a Counter.
  // These become public properties of the instance.
  params: {
    start: 0 // Set zero as the default value for this parameter.
  },
  
  // A function called after instantiation, akin to a class constructor.
  // This function itself doesn't accept any arguments (except when
  // inheriting from another struct). Instead, the properties of `params`
  // are copied onto the `Counter` instance before `construct` is called.
  construct: function () {
    // Copy the public `start` property onto the variable `count`
    // which is private to this `construct` function.
    var count = this.start;
    
    // A private method available only inside `construct`.
    function increment() {
      count++;
    }
    
    // Assign some public methods for interacting with the private
    // `count` and `increment` methods.
    this.value = function () {
      return count;
    };
    this.inc = function () {
      increment();
      return this; // Return this instance for chaining.
    };
  },
  
  // Members to copy onto the `Counter` prototype object.
  proto: {
    toString: function () {
      return '[Counter ' + this.start + '...' + this.value() + ']';
    }
  },
  
  // Members to attach to the `Counter` function itself.
  statics: {
  	// Combine two counters' values into a single counter.
    combine: function (counter1, counter2) {
      return new Counter({
        start: counter1.value() + counter2.value()
      });
    }
  }
});

var c1 = new Counter({
  start: 5
});
console.log(c1.value()); // 5
c1.inc();
console.log(c1.value()); // 6
console.log(String(c1)); // "[Counter 5...6]"

var c2 = new Counter();
console.log(c2.value()); // 0
c2.inc().inc();
console.log(c2.value()); // 2
console.log(String(c2)); // "[Counter 0...2]"

var c3 = Counter.combine(c1, c2);
console.log(c3.value()); // 8
c3.inc();
console.log(c3.value()); // 9
console.log(String(c3)); // "[Counter 8...9]"
```

## Pronunciation

"Two bucks"
