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
        type: 'literal',
        term: 'a'
    }, {
        type: 'repeat',
        term: '(?:abc)*'
    }, {
        type: 'capture',
        name: 'capture-name',
        term: '(ggg)'
    }]

Applying nodes to their parents (e.g. ending a sequence/either group) would be a lot simpler, as it's just a matter of
pushing the group's nodes to the `_stack`.
To eventually peek/exec, would just have to concat the nodes.

Also makes issue #2 far more plausible.
A backref node would just look something like `{type: 'backref', name: 'capture-name'}`.
Better than the alternative of storing it as a plain string and having to postprocess the thing or something.

