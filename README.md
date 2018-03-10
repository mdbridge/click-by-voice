# Click by Voice

This Chrome browser extension is being developed to provide support
for activating links and other HTML elements using voice commands.


## Using Click by Voice manually

Click by Voice provides two keyboard shortcuts, which are bound by
default to `{ctrl+shift+space}` (pop up command dialog box) and
`{ctrl+shift+,}` (blur).  You can rebind these as desired using the
keyboard shortcuts link at the bottom of the <a
href="chrome://extensions/">extensions page</a>.

The blur shortcut removes keyboard focus from an element, returning it
to the overall webpage.  This can be useful, for example, when you want
to page the website up and down but an input element like a text field
has focus.

### Activating hints

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

###  Displaying hints

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


## Using with voice commands

WARNING: this extension by itself provides no voice functionality;
procurement of the needed voice commands is the user's
responsibility. One recommended means of doing this is to use Vocola
(http://vocola.net/) to create the needed voice commands.

Writing voice commands to use Click by Voice should be straightforward,
although delays may need to be incorporated.  As an example, here are
Vocola 2 commands that provide access to the Click by Voice
functionality:

    blur me = "{ctrl+shift+,}";
    show      numbers = {ctrl+shift+space} Wait(500) :+  {enter};
    show more numbers = {ctrl+shift+space} Wait(500) :++ {enter};
    hide      numbers = {ctrl+shift+space} Wait(500) :-  {enter};
    
    <pick> 0..9 [0..9 [0..9 [0..9]]] = {ctrl+shift+space} Wait(500) $2$3$4$5 ":$1"{enter};
    
    <pick> := (        pick = ""    # guess whether to click or focus
              | go     pick = f
              | click  pick = c
              | push   pick = b     # stay but open new tab w/ link or iframe
              | tab    pick = t
              | window pick = w
              | hover  pick = h
              | link   pick = k     # copy link destination address
              | copy   pick = s
              );


## Known issues

* The selection of elements that should be given hints needs work:
  * elements inside of iframes are missed
    * iframes themselves are now hinted and can be focused or opened in a new tab or window
  * to cover elements added dynamically over time, Click by Voice
    automatically refreshes hints every 3 seconds
    * this can require waiting several seconds after a click or page load
  * standard hints does not find elements that are only clickable
    because of event listeners
    * hopefully, the extended hints `:++` should find most of these.
* The placement of hints is suboptimal and disrupts the flow of some webpages
  * Experimental: `:+o` uses overlays for hints; this can make text hard
    to read, but disturbs the flow less.
* Sometimes hints are unreadable due to clipping
  * Experimental: `:+h` uses overlays when inline hints might get
    clipped.
* Sometime hints are too hard to read due to inadequate contrast between
  foreground and background colors
  * Experimental: `:+c` increases the contrast of hints
* Executing a command (especially the popping up part) is slower than I'd like
* Still some invisible elements that are hinted
* Does not work on chrome:// URLs like settings and extensions pages;
  ditto https://chrome.google.com URLS (e.g., developer dashboard)
* Does not work in some pop-ups, for example, the add bookmarks pop up

Experimental modifiers to show hint commands are just that,
experimental.  I reserve the right to change or remove them without
notice.


## Other

Please address questions and issues to <a
href="http://www.knowbrainer.com/forums/forum/messageview.cfm?catid=25&threadid=22663">this
thread</a>.
