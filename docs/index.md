*This documentation is incomplete and may contain errors.*

JavaScript has a class problem.

The traditional (pre-ES6) approach to object-oriented programming in JavaScript (where you define a constructor function and then assign methods to its prototype) feels clunky and involves a lot of repetitive code.

But ES6 classes can't have private instance variables like regular function closures can. As of early 2020, private fields aren't supported in all major browsers, and private methods are still in draft status. So it'll be a while before we can expect support across browsers.

Tubux offers a way to define a constructor in a way that resembles a class.

It also lets you easily generate accessors, which are access-controlled getter/setter methods that can sanitize input and register listeners.

More documentation will come eventually, but for now here's an example:

```javascript
var Counter = $$.struct({
  params: {
    count: $$(0).secret()
  },
  construct: function (secret) {
    var count = secret.count;
      
    $$.assign(this, {
      inc: function () {
        count++;
      },
      count: function () {
        return count;
      }
    });
  },
  proto: {
    toString: function () {
      return `Counter(${this.count()})`;
    }
  },
  statics: {
    combine: function (counter1, counter2) {
      return new Counter({
        count: counter1.count() + counter2.count()
      });
    }
  }
});

var c1 = new Counter({
  count: 10
});
console.log(c1.count()); // 10
c1.inc();
console.log(c1.count()); // 11

var c2 = new Counter();
console.log(c2.count()); // 0
c2.inc();
c2.inc();
c2.inc();
console.log(c2.count()); // 3

var c3 = Counter.combine(c1, c2);
console.log(c3.count()); // 14

console.log(`${c3}`); // Counter(14)
```
