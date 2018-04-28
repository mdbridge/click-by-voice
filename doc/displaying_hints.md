#  Displaying hints in detail

## Basic modes of operation

There are only two basic ways of hinting an individual element: overlay
and inline.  Overlay overlays the hint number on top of the element
without changing its size or the flow of the webpage.  Inline, by
contrast, makes the element bigger by inserting the hint number inline
in the element.   Think (roughly) `<button>Submit</button>` becoming
`<button>Submit <span class='hint'>13</span></button>`.

Examples of each of the styles:

* ![no hints](./no-hints.png)  (no hints)
* ![overlay hints](./overlay.png)  (overlay)
* ![inline hints](./inline.png)  (inline)

As you can see, inline is often easier to read because it does not cover
up the element but it can severely disrupt the layout of the webpage and
its hints may be clipped by fixed width layouts.

Click by Voice has three basic modes based on which of these methods to
hint elements should be used:

* overlay: always overlay hints
* inline: always put hints inline
* hybrid: when it appears safe, use inline otherwise use overlay







When a page is loaded (this includes reloading the current page), Click
by Voice displays hints according to the last _show [no] hints_ command
it received.  The current such commands are:

* ':+' show standard hints and/or refresh them
* ':++' similar but displays more hints, attempting to hint every
  element that might be clickable or focusable, however unlikely that
  might be.
* ':-' stop displaying hints, removing any existing hints

To use these commands, just enter them into the hint number popup
instead of a hint number.  On Chrome startup, Click by Voice defaults to
standard hints.  Note that show hints commands given when using one tab
will affect refreshes of other tabs.  Hint numbers are not shown when
printing.
