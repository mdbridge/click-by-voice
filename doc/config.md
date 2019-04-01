# Experimental config

On the Click-by-Voice options page as of version 0.20 there is a form
for a Click-by-voice config.  This config allows specifying switch
defaults on a per-website basis.

Better documentation to be written, but here's an example config in the
meanwhile:
```
# default case:
when .*
  h

when https://www.reddit.com
  ^{.rank, .arrow, div.thing}
  !{.tagline}

when github.com
  # don't hint line numbers
  !{table.js-file-line-container}
  
when quip.com:
  # disable CbV because hints confuse quip
  -
```

Very roughly, there are a series of stanzas each of which contains a
regular expression that is matched against the current URL.  The
contents of the stanzas that match are concatenated together in order to
make the default switches.

For the example config, `https://quip.com/product` produces switch
defaults of `h-` and `https://www.reddit.com/?count=25&after=t3_b7rjf7`
produces `h^{.rank, .arrow, div.thing}!{.tagline}`.  These defaults apply
before any switches of the current show hints command.  Thus, if the
current command is `:+ic` then for the reddit page, the complete set of
switches would be `h^{.rank, .arrow, div.thing}!{.tagline}+{1}ic`
