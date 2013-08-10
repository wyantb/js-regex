js-regex
========

Why?
----

Because if you're using RegExp, and your problem isn't solved yet, you're not using
enough RegExp.

Usage
-----

### Simple Testing

```javascript
regex()
    .literal('a')
    .test('a');   // Will return true
```

### Simple Replacing

```javascript
regex()
    .literals('abc')
    .replace('abc', function () {
        return 'def';
    });              // Will return 'def'
```

### Peeking at the RegExp source

```javascript
regex()
    .literals('abc')
    .literals('def')
    .peek();        // Will return 'abcdef'
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

regex()
    .literals('bbb')
    .literals('aaa')
      .keep('named')
    .literals('bbb')
    .replace('aaa', function (groups) {
        console.log(groups.named);     // Will print 'aaa'
        return 'ccc';
    });                                // Will return 'bbbcccbbb'
```

### Repeating

```javascript
regex()
    .literals('aaa')
      .repeat(1, 3)
    .peek();        // Will return '(?:aaa){1,3}'

regex()
    .literals('aaa')
      .repeat()
    .peek();        // Will return '(?:aaa)*'
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
    .peek();            // Will return '[^abc\d]'
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

