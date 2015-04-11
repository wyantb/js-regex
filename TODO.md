Minor Refactors
---------------

* I have a feeling that STATE_GROUPED is unnecessary
  - If _lastCapturePoint was expressed better (e.g. it updated it itself), .capture could rely on that
  - The whole thing where RegexGroup manipulates the state in such a way feels wrong
* So much state in general!
  - _states and _numPurged especially odd; a group once visited chars, so that's what it is now?
* If I just drew a network diagram of all the states and their possible transitions...

More Major Refactor
---------------

Actually, better idea.  Also gets rid of some state.
Right now, a node has `_current` and `_last`.  If I just made an array of the pieces, something like:

    [{
        type: 'term',
        term: 'a'
    }, {
        type: 'term', // notice how a repeat doesn't change the type?
        term: '(?:abc)*'
    }, {
        type: 'open_or',
        term: 'ab|cd'
    }, {
        type: 'term',
        captures: ['inner-before-1', 'inner-before-2']
        term: '(abc)(def)'
    }, {
        type: 'term', // still no type changes through all these ops...
        captures: ['outer-with-star', 'inner-1', 'inner-2']
        term: '((?:(abc)(def))*)'
    }]

Applying nodes to their parents (e.g. ending a sequence/either group) would be a lot simpler, as it's just a matter of
pushing the group's nodes to the `_stack`.
To eventually peek/exec, would just have to concat the nodes.

Also makes issue #2 far more plausible.
A backref node would just look something like `{type: 'term', backrefs: ['outer-with-star']}`.
Better than the alternative of storing it as a plain string and having to postprocess the thing or something.

Scratchpad
----------

A little too unrealistic, above.
Having fancy backrefs like that almost seems nice, until I consider: how would I process a `.repeat()` after the following?

`seq( 'abc'.capture('g1'), backref('g1'), 'def' )`
`[{ term: ['(abc)', {backref: 'g1'}, 'def'] }]`

Ultimately, string concatentation / modification is nice enough here, don't want to lose that.
Instead:

`[{ term: '(abc)\1def', captures: ['g1'] }]`

And then, if someone says `.capture('g2')` after that:

`[{ term: '((abc)\2def)', captures: ['g2', 'g1'] }]`

The only time I think that processing backrefs in this way could cause "harm" is if it was in a char set,
like `/[\1]/`, but that's already a meaningless regex, so no harm no foul.

Of course, can't blindly increment either.
If `\1` referenced a capture group from an earlier term, that wouldn't get updated.

Perhaps it would be simplest to keep some `_captureIdx` state, and have the burden on updating that go to the few
methods that would update it, like closing groups and adding captures on terms that already have captures.

For above examples, fuller testcase would generate terms like:

`[{ term: '(g1)', ... }, { term: '((abc)\1\3def)', captures: ['g2', 'g3'] }]`

Including one backref to a thing just earlier in the seq, and one from before the seq.

PS, future me: it's turtles all the way down.
What if someone wants to use the alternate API form with a seq naming a backref that doesn't exist yet?

