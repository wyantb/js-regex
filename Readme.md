js-regex
========

What is it?
-----------

js-regex is a fluent regex builder for JavaScript.  Its aim is to make the writing and maintenance of complicated regexes less taxing and error-prone.

### Features

js-regex has a mix of features that make it especially appealling, when compared to writing raw regexs or using other builder libraries, for building complicated regexes:

* [Macros](#macros)
  - Macros are basically named sequences
  - That can be registered for a particular builder instance, or across all js-regex objects
  - That are added onto the current regex as a single term by using `.macro(registeredName)`
* [Named Capture Groups](#named-capture-groups-and-exec)
  - When using exec and similar functions, you don't get an array of the matches
  - Instead, you get an object with the `match` property (representing the entire match of the regex)
  - Along with a property for each named property group you gave to `.capture(...)`
* Minimal Generated Expressions
  - Some regex builder libraries have a habit of wrapping almost everything you add in a non-capture group (`(?:<stuff here>)`)
  - The above works, and is easy to make correct
  - But js-regex has the goal of not doing so, whenever actually possible, and transforming non-capture groups to capture groups when `.capture(...)` is called


Why?
----

Let's suppose that you've been asked to figure out why the following regex isn't working:

```
(SH|RE|MF)-((?:197[1-9]|19[89]\d|[2-9]\d{3})-(?:0[1-9]|1[012])-(?:0[1-9]|[12]\d|3[01]))-((?!0{5})\d{5})
```

If you're experienced with regexes, it's certainly possible to gain an understanding of it, but it takes longer than it should.

This is one example regex that has been built with this library; see [below](#business-logic-regex) to see this example translated into a js-regex equivalent, or simply read on to go through most of the API before jumping into the complex examples.

Tests
-----

In addition to the usage documented below, with a matching test suite [here](https://github.com/wyantb/js-regex/blob/master/test/cases/readme_cases.js), there's a fair number of other test cases [here](https://github.com/wyantb/js-regex/tree/master/test/cases).

Although there's a small number of testcase files right now, they actually cover the bases of the library and the combinations of methods you can invoke pretty well; please check them out if you're at all interested.

Usage
-----

### Simple usage with peek()

```javascript
regex()
    .literals('abc')
    .peek();        // Will return 'abc'
```

### Never stop chaining!

```javascript
regex()
    .literals('abc')
    .call(function (curNode) {
        console.log(this === curNode); // Will print true
        console.log(curNode.peek());   // Will print 'abc'
    })
    .literals('def')
    .call(function (curNode) {
        console.log(curNode.peek());   // Will print 'abcdef'
    });
```

### Special Flags

```javascript
regex()
    .f.digit()
    .f.whitespace()
    .peek();       // Will return '\d\s'
```

### Capture Groups

```javascript
regex()
    .literals('aaa')
      .capture()
    .peek();        // Will return '(aaa)'
```

### Repeating

```javascript
regex()
    .literals('aaa')
      .repeat()
    .peek();        // Will return '(?:aaa)*'

regex()
    .literals('aaa')
    .call(function (curNode) {
        console.log(curNode.peek()); // Will print 'aaa'
    })
      .repeat(1, 3)
    .peek();                         // Will return '(?:aaa){1,3}'
```

### Simple Grouping

```javascript
regex()
    .sequence()
        .literals('aaa')
        .f.digit()
        .literals('bbb')
    .endSequence()
      .repeat()
    .peek();            // Will return '(?:aaa\dbbb)*'

regex().sequence('aaa', regex.flags.digit(), 'bbb')
    .repeat()
    .peek();            // Will return '(?:aaa\dbbb)*'

```

### Character Sets

```javascript
regex()
    .any('abcdefg')
    .peek();       // Will return '[abcdefg]'

regex()
    .any()
        .literals('abc')
        .f.digit()
    .endAny()
    .peek();            // Will return '[abc\d]'

regex()
    .none()
        .literals('abc')
        .f.whitespace()
    .endNone()
    .peek();            // Will return '[^abc\s]'
```

### Or

```javascript
regex()
    .either()
        .literals('abc')
        .literals('def')
    .endEither()
    .peek();             // Will return 'abc|def'

regex()
    .either('abc', regex.any('def'))
    .peek();             // Will return 'abc|[def]'
```

### Macros

```javascript
regex.create(); // Alternate form of regex()

regex
    .addMacro('any-quote') // Adding a global macro for single or double quote
        .any('\'"')
    .endMacro()
    .create()
        .macro('any-quote')
        .f.dot()
          .repeat()
        .macro('any-quote')
        .peek();           // Will return '['"].*['"]'

regex
    .addMacro('quote')
        .any('\'"')
    .endMacro()
    .create()
        .addMacro('quote') // Local macros override global ones
            .literal('"')  //  Here, restricting to double quote only
        .endMacro()
        .macro('quote')
        .f.dot()
          .repeat()
        .macro('quote')
        .peek();           // Will return '".*"'
```

### Followed By

```javascript
regex()
    .literals('aaa')
      .followedBy('bbb')
    .peek();            // Will return 'aaa(?=bbb)'

regex()
    .literals('ccc')
      .notFollowedBy('ddd')
    .peek();               // Will return 'ccc(?!ddd)
```

### Named Capture Groups and Exec

```javascript
regex()
    .flags.anything()
      .repeat()
      .capture('preamble')
    .either('cool!', 'awesome!')
      .capture('exclamation')
    .call(function (rb) {
        // Would print '(.*)(cool!|awesome!)'
        console.log(rb.peek());

        // Would print 'this is '
        console.log(rb.exec('this is cool!  isn\'t it?').preamble);
        // Would print 'cool!'
        console.log(rb.exec('this is cool!  isn\'t it?').exclamation);

        // Would print 'this is also '
        console.log(rb.exec('this is also awesome!').preamble);
        // Would print 'awesome!'
        console.log(rb.exec('this is also awesome!').exclamation);
    });
```

Complicated Regexes
-------------------

### Example 1

How quickly can you figure out what this is supposed to represent?

```javascript
regex()
    .addMacro('0-255')
        .either()
            .sequence()
                .literals('25')
                .anyFrom('0', '5')
            .endSequence()
            .sequence()
                .literal('2')
                .anyFrom('0', '4')
                .anyFrom('0', '9')
            .endSequence()
            .sequence()
                .any('01').optional()
                .anyFrom('0', '9')
                .anyFrom('0', '9').optional()
            .endSequence()
        .endEither()
    .endMacro()
    .macro('0-255').capture()
    .literal('.')
    .macro('0-255').capture()
    .literal('.')
    .macro('0-255').capture()
    .literal('.')
    .macro('0-255').capture()
    .peek();
```

(Hint: it's described [here](http://www.regular-expressions.info/examples.html), in the fourth section on the page.)

(Also note: this example uses the 'verbose' usage form, always closing portions with endXXX(); the [Readme tests](https://github.com/wyantb/js-regex/blob/master/test/cases/readme_cases.js) cover the same using an alternate form)

### Business Logic Regex

So our 'business logic' regex looks like this:

```
(SH|RE|MF)-((?:197[1-9]|19[89]\d|[2-9]\d{3})-(?:0[1-9]|1[012])-(?:0[1-9]|[12]\d|3[01]))-((?!0{5})\d{5})
```

Written in human terms, that would be: one of three department codes, a dash, a YYYY-MM-DD date (after Jan 1, 1971), a dash, then a non 00000 5 digit number.

In converting this regex to use js-regex, we make use of macros to define the department code, the date, and the trailing number.  Note that most of this example is spent setting up the date regex - if your situation called for many dates being used in the application, the cost of setting up this most complicated portion of the regex would only need to be done once, after which it would be usable in other circumstances with no code changes, and far greater readability.

Anyway, let's take a look:

```javascript
regex
    // Setting up our macros...
    .addMacro('dept-prefix', regex.either('SH', 'RE', 'MF'))
    .addMacro('date',
        regex.either(
            regex.sequence(
                '197',
                regex.anyFrom('1', '9')),
            regex.sequence(
                '19',
                regex.any('89'),
                regex.flags.digit()),
            regex.sequence(
                regex.anyFrom('2', '9'),
                regex.flags.digit().repeat(3, 3))),
        '-',
        regex.either(
            regex.sequence(
                '0',
                regex.anyFrom('1', '9')),
            regex.sequence(
                '1',
                regex.any('012'))),
        '-',
        regex.either(
            regex.sequence(
                '0',
                regex.anyFrom('1', '9')),
            regex.sequence(
                regex.any('12'),
                regex.flags.digit()),
            regex.sequence(
                '3',
                regex.any('01'))))
    .addMacro('issuenum',
        regex.notFollowedBy()
            .literal('0')
                .repeat(5, 5),
        regex.flags.digit()
            .repeat(5, 5))
    // Macros are setup, let's create our actual regex now:
    .create()
        .macro('dept-prefix').capture()
        .literal('-')
        .macro('date').capture()
        .literal('-')
        .macro('issuenum').capture()
        .peek(); // Returns the string shown above this code example
```

Conclusion
----------

Perhaps this library piques your interest.  If so, cool!  Let me know!  Just make sure that nothing on [the issues page](https://github.com/wyantb/js-regex/issues) scares you before jumping in and actually using it.

Really, Really Experimental Methods
-----------------------------------

### Simple Testing

test() is still kinda pointless.

```javascript
regex()
    .literal('a')
    .test('a');   // Will return true
```

### Simple Replacing

Needs more tests.

```javascript
regex()
    .literals('abc')
    .replace('abc', function () {
        return 'def';
    });              // Will return 'def'
```
