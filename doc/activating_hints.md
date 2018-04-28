## Activating hints

The pop-up command shortcut pops up a small dialog box in the upper
right asking for the hint number that should be activated.  At its
simplest, typing the number displayed next to an element then pressing
enter will dismiss the dialog box then click or focus that element as
appropriate.  (Click by Voice uses heuristics to attempt to determine
whether an element should be clicked or focused; if it guesses wrong,
you can use one of the more specific commands below to force clicking or
focusing.)

To specify that something different be done with the element, add a
colon and one of the following operation codes:

* 'f' focuses the element (doesn't work on all elements, does work on iframes)
* 'c' clicks the element
* 't' opens links and iframes in a new tab, changing focus to that tab
* 'b' opens links and iframes in a new tab, but does not change focus to
that tab
* 'w' opens links and iframes in a new window, changing focus to that window
* 'k' copies link and iframe locations to the clipboard
* 'h' simulates hovering the mouse over the element; repeat to unhover
* 's' copies the text contents of the element to the clipboard

For example, `153:t` opens the link with hint number 153 in a new tab.
An empty operation (e.g., `153:`) is equivalent to specifying no
operation.  Note that `t`, `b`, `w`, and `k` work only on links and
iframes that explicitly give a target address (currently `<a
href=`...`>` and `<iframe src=`...`>`).

Instead of providing a hint number, you can provide a CSS selector that
specifies which element you wish to activate.  For example,
`${button.go}:c` clicks the first element that is a both button and of
class `go`.  This feature is useful for programmatically activating
elements.

You can dismiss the command dialog box by typing `{escape}`.
