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

Click by Voice has three basic modes based on when each of these methods
is used:

* overlay: always overlay hints
* inline: always put hints inline
* hybrid: when it appears safe, use inline otherwise use overlay

Hybrid mode uses heuristics to decide when using inline for an element
is unlikely to disturb the webpage too much or have the hint get
clipped.

As of version 0.19, the default mode is inline.  If the default mode
does not display hints well for the current page, you may want to try
switching to one of the other modes.


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

Switches can change which elements get hinted in addition to how hints
are displayed.

### Switches

The following switches are officially supported:

* `i`: use inline mode
* `o`: use overlay mode
* `h`: use hybrid mode
* `c`: use high contrast hints

`i`, `o`, and `h` are mutually exclusive, with the last one present
winning.


## Experimental switches

*To be written...*

Experimental switches are just that, experimental.  I reserve the right
to change or remove them without notice.
