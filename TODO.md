Refactors:

* I have a feeling that STATE_GROUPED is unnecessary
  - If _lastCapturePoint was expressed better (e.g. it updated it itself), .capture could rely on that
  - The whole thing where RegexGroup manipulates the state in such a way feels wrong
* So much state in general!
  - _states and _numPurged especially odd; a group once visited chars, so that's what it is now?
* If I just drew a network diagram of all the states and their possible transitions...
