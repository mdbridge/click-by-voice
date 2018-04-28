#  Displaying hints in detail

## Basic modes of operation

There are two basic ways of hinting an individual element: overlay and
inline.  Overlay overlays the hint number on top of the element without
changing its size or the flow of the webpage.  Inline, by contrast,
makes the element bigger by inserting the hint number inline in the
element.  Think (roughly) `<button>Submit</button>` becoming
`<button>Submit <span class='hint'>13</span></button>`.

Examples of each of the styles:

* ![no hints](./no-hints.png)  (original without hints)
* ![overlay hints](./overlay.png)  (overlay)
* ![inline hints](./inline.png)  (inline)

As you can see, inline is often easier to read because it does not cover
up the element but it can severely disrupt the layout of the webpage and
its hints may be clipped by fixed-width layouts.

Click by Voice has three basic modes based on which of these methods to
hint elements should be used:

* overlay: always overlay hints
* inline: always put hints inline
* hybrid: when it appears safe, use inline otherwise use overlay

Hybrid mode uses heuristics to decide when using inline for an element
is unlikely to disturb the webpage too much or have the hint get
clipped.

The current default mode is inline, but this will be changing with the
next major release to hybrid.  If the default mode does not display
hints well for the current page, you may want to try switching to one of
the other modes.


## Show hints commands

A show hints command takes the form of a colon followed optionally by
`once` followed by a _hint level indicator_ (`+`, `++`, or `-`) followed
by zero more _switches_.  Example commands include `:-`, `:once++`,
`:+i`, and `:+E{2}!{.jse13}`.

### Persistence

Normally, show hints commands are persistent.  That is, they affect all
future page (re)loads until the browser is restarted.  Click by Voice
remembers the last persistent show hints command and uses it to figure
out how to display any newly (re)loaded page.  This is true both across
tabs and across Chrome browser windows.

Adding the `once` specifier immediately after the colon makes a show
hints command nonpersistent.  Such commands do not affect the display of
future page (re)loads, only the display of the current page.

At startup, Click by Voice assumes the last persistent show hints
command was `:+` unless the CbV option "Startup show numbers command"
has been set, which case it uses that command instead.  If you want CbV
to start up without using hints, use `:-` as the value of this option.

### Hint level indicators

The meanings of the various levels are:

* `-`: display no hints at all; ignores any switches
* `+`: display hints for elements expected to be interesting to activate
* `++`: as `+` but also attempts to hint every element that might be
clickable or focusable, however unlikely that might be

Switches can change which elements get handed in addition to how hints
are displayed.

### Switches

## Past this point under construction

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
