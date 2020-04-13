# Tubux
*Classy Constructors in JavaScript*

ES6 classes don't offer real "information hiding" like regular function closures can. As of early 2020, private fields aren't supported in all major browsers, and private methods are still in draft status. So it'll be a long time before we can expect support across browsers.

Tubux's `struct` sugar helps you define a traditional (pre-ES6) constructor function in a way that resembles a class more closely than the repetetive and disjointed code that comes with the usual pattern of defining a constructor function and then attaching members to its prototype.

It also offers a way to generate accessor methods which (1) act as setters and getters, and (2) allow you to add listeners and sanitizing filters.

## Installation

### npm
* Install: `npm i tubux`
* Require: `var $$ = require("tubux");`

### web
To load it directly on a web page:
* [Download a release](https://github.com/thomasperi/tubux/releases)
* The file you need is `dist/tubux.min.js`

## Documentation
https://thomasperi.github.io/tubux/

## Pronunciation
"Two bucks"
