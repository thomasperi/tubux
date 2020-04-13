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

More documentation on accessor generators will come eventually, but for now, here's a demonstration of the classiness and information hiding:

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
      return '[Counter start=' + this.start + ' value=' + this.value() + ']';
    }
  }
});

var c = new Counter({
  start: 5
});
c.inc();
console.log(c.value()); // 6
console.log(String(c)); // "[Counter start=5, value=6]"
c.inc().inc();
console.log(String(c)); // "[Counter start=5, value=8]"
```

## Pronunciation

"Two bucks"
