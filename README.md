# Click by Voice

This Chrome browser extension provides support for activating links and
other HTML elements using voice commands.  It displays small numbers
next to each activatable element called *hints* and provides mechanisms
to activate these elements using the hint numbers.  This allows creating
voice commands (via other software) that lets users activate links by
saying their hint numbers.


## Using Click by Voice manually

Click by Voice provides two keyboard shortcuts, which are bound by
default to `{ctrl+shift+space}` (pop up command dialog box) and
`{ctrl+shift+,}` (blur).  You can rebind these as desired using the
keyboard shortcuts link at the bottom of the Chrome extensions page,
chrome://extensions.

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
whether an element should be clicked or focused if you don't specify
which to do.)

To specify that something different be done with the element, add a
colon then an operation code.  For example, `153:t` opens the link with
hint number 153 in a new tab.  Many different operations on hinted
elements are available, including copying the destination URL for a link
and copying the text of an element; see the
[list of available operations](./doc/activation_commands.md) for more.

Instead of providing a hint number, you can provide a CSS selector that
specifies which element you wish to activate.  For example,
`${button.go}:c` clicks the first element that is both a button and of
class `go`.  This feature is useful for programmatically activating
elements.

You can dismiss the command dialog box without activating anything by
typing `{escape}`.

###  Displaying hints

You can change how hints are displayed for the current tab by using a
_show hints_ command.  The simplest such commands are:

* `:+` shows standard hints
* `:++` is similar but displays more hints, attempting to hint every
  element that might be clickable or focusable, however unlikely that
  might be
* `:-` shows no hints

To use these commands, just enter them into the hint number popup
instead of a hint number.

Click by Voice normally remembers the last such command you have given
and automatically uses it when a new page is loaded or the current tab
is reloaded.  This is true across tabs -- the show hints command given
in one tab will affect the refresh of another tab afterwards.  If you
want to only temporarily change how hints are displayed for a tab, add
`once` after the colon; for example, `:once-` turns off hints for the
current tab until it is refreshed and does not affect future loads of
other tabs.

The hinting system is highly flexible, with these commands taking many
optional switches.  For details, including how to change startup
defaults, see the sub page on
[displaying hints](./doc/displaying_hints.md).

Hint numbers are not shown when printing but will show up when you copy
from a hinted webpage.


## Using Click by Voice with voice commands

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
