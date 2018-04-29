# Hint activation commands

Click by Voice hint activation commands consist of a
*hint_specification* optionally followed by a colon then an *operation*.
For example, `42` specifies activating the element with hint number 42
using the default operation and `34:k` specifies activating hint 34
using operation `k`.  An empty operation (e.g., `153:`) is equivalent to
specifying the default operation.


## Available operations

The following operations are currently available:

* `f` focuses the element (doesn't work on all elements, does work on iframes)
* `c` clicks the element
* `t` opens links and iframes in a new tab, changing focus to that tab
* `b` opens links and iframes in a new tab, but does not change focus to
that tab
* `w` opens links and iframes in a new window, changing focus to that window
* `k` copies link and iframe locations to the clipboard
* `h` simulates hovering the mouse over the element; repeat to unhover
* `s` copies the text contents of the element to the clipboard

The default operation either clicks or focuses the given element using
heuristics to decide which makes more sense.  If CbV guesses wrong, you
can explicity specify `c` or `f` to force clicking or focusing
respectively.

Note that `t`, `b`, `w`, and `k` work only on links and iframes that
explicitly give a target address (currently `<a href=`...`>` and
`<iframe src=`...`>`).


##  Hint specifications

The basic hint specification is just the number of a hinted element
(e.g., `23`).

A more advanced form of hint specification uses a CSS selector to pick
out the element to activate.  For example, `${button.go}:c` clicks the
first element that is a both a button and of class `go`.  Here, the CSS
selector is enclosed in `${` and `}`.  CbV will attempt to activate the
first element on the page satisfying the CSS selector.

If CBV can't find an element matching the given hint specification, the
activation command does nothing.


## Experimental operations and hint specifications

*To be written...*

Experimental means just that.  I reserve the right to change or remove
experimental features without notice.
