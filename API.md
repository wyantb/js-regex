
Functions callable on a `regex()`

regex#call
regex#peek
regex#literal(literal)
regex#literals(literals)
regex#macro
regex#capture
regex#repeat -- you know, like `*`, `{1,}`, etc
regex#optional -- (like repeat, modifies last term, making it optional)
regex#followedBy(literals)
regex#notFollowedBy(literals)
regex#anyFrom(char1, char2)
regex#noneFrom(char1, char2)
regex#any(literals)
regex#none(literals)
regex#sequence -- starts a simple group, provides `endSequence`
regex#or -- starts an either group, provides `endOr`
regex#flags... -- special literals, like `.`, `\d`, etc

