JavaScript has a class problem.

The traditional (pre-ES6) approach to object-oriented programming in JavaScript (where you define a constructor function and then assign methods to its prototype) feels clunky and involves a lot of repetitive code.

But ES6 classes can't have private instance variables like regular function closures can. As of early 2020, private fields aren't supported in all major browsers, and private methods are still in draft status. So it'll be a while before we can expect support across browsers.

Tubux is a way to define a constructor in a way that resembles a class. It also lets you easily generate accessors, which are getter/setter methods that can register listeners and sanitize input.

Better documentation to come, but here's some example code.

```javascript
var Counter = $$.struct({
  params: {
    start: 0
  },
  
  construct: function () {
    var count = this.start;
    
    function increment() {
      count++;
    }
    
    this.value = function () {
      return count;
    };
    
    this.inc = function () {
      increment();
    };
  },
  
  proto: {
    toString: function () {
      return 'Counter[' + this.value() + ']';
    }
  },
  
  statics: {
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
c1.inc();
console.log(c1.value()); // 6

var c2 = new Counter();
c2.inc();
c2.inc();
console.log(c2.value()); // 2

var c3 = Counter.combine(c1, c2);
console.log(String(c3)); // "Counter[8]"
```
