any() will treat - as a literal but that will cause problems
.start() -> .sequence()
.close aliases (.endSequence(), .endMacro(), etc)
Backreferences     (\1 - \9)
Hexadecimal digits (\xUU, \uHHHH)
Control characters (\cX)

More convenience methods would be lovely
  e.g. regex().or('abc'
                , regex.sequence(regex.literal('a'),
                               , regex.f.digit()))
            -> 'abc|a\d'

More tests never hurt anyone
