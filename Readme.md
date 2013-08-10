js-regex
========

Why?
----

Because if you're using RegExp, and your problem isn't solved yet, you're not using
enough RegExp.

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
      .keep()
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
    .start()
        .literals('aaa')
        .f.digit()
        .literals('bbb')
    .close()
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
    .close()
    .peek();            // Will return '[abc\d]'

regex()
    .none()
        .literals('abc')
        .f.whitespace()
    .close()
    .peek();            // Will return '[^abc\s]'
```

### Or

```javascript
regex()
    .or()
        .literals('abc')
        .literals('def')
    .close()
    .peek();            // Will return 'abc|def'
```

### Followed By

```javascript
regex()
    .literals('aaa')
      .followedBy('bbb')
    .peek();            // Will return '(?:aaa)(?=bbb)'

regex()
    .literals('ccc')
      .notFollowedBy('ddd')
    .peek();               // Will return '(?:ccc)(?!ddd)
```

Experimental Methods
--------------------

### Simple Testing

test() is still kinda pointless.

```javascript
regex()
    .literal('a')
    .test('a');   // Will return true
```

### Simple Replacing

replace() is probably pretty buggy, especially with multiple named capture groups
 in a row.

```javascript
regex()
    .literals('abc')
    .replace('abc', function () {
        return 'def';
    });              // Will return 'def'
```

### Named Capture Groups

Probably buggy.

```javascript
regex()
    .literals('bbb')
    .literals('aaa')
      .keep('named')
    .literals('bbb')
    .replace('aaa', function (groups) {
        console.log(groups.named);     // Will print 'aaa'
        return 'ccc' + groups.named + 'ccc';
    });                                // Will return 'cccaaaccc'
```
