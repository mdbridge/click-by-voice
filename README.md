# Click by Voice

This Chrome browser extension provides support for activating links and
other HTML elements using voice commands.  It displays small numbers
next to each activatable element called *hints* and provides mechanisms
to activate these elements using the hint numbers.  This allows creating
voice commands (via other software) that lets users activate links by
saying their hint numbers.

Like many Chrome browser extensions, this extension can also be used
with the Microsoft Edge browser.


## Using Click by Voice manually

Click by Voice provides two keyboard shortcuts suitable for manual use;
they are bound by default to `{ctrl+shift+space}` (*pop up command
dialog box*) and `{ctrl+shift+,}` (*blur*).  You can rebind these as
desired like with any Chrome extension by following the link
chrome://extensions/shortcuts in your Chrome browser.

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
(in any tab) and automatically uses it when a new page is loaded or the
current tab is reloaded.  If you want to only temporarily change how
hints are displayed for a tab, add `once` after the colon; for example,
`:once-` turns off hints for the current tab until it is refreshed and
does not affect future loads of other tabs.

The hinting system is highly flexible, with these commands taking many
optional switches.  For details, including how to change startup and
per-webpage defaults, see
[displaying hints in detail](./doc/displaying_hints.md).

Hint numbers are not shown when printing and should not show up when you
copy from a hinted webpage.


## Using Click by Voice with voice commands

**This extension by itself provides no voice functionality**;
procurement of the needed voice commands is the user's responsibility.
One recommended means of doing this is to use Vocola
(http://vocola.net/) to create the needed voice commands.

Writing voice commands to use Click by Voice should be straightforward.
As an example, here are some Vocola 2 commands that provide access to
much of the Click by Voice functionality:

    CbV(command) := Clipboard.Set($command!!! Clipboard.Get("")) {ctrl+shift+.};

    blur me = "{ctrl+shift+,}";

	<once> := (once);
	<mode> := (inline=i | overlay=o | hybrid=h | contrasting=c);
    show      [<mode>] hints [<once>] = CbV(:$2+$1);
    show more [<mode>] hints [<once>] = CbV(:$2++$1);
    hide               hints [<once>] = CbV(:$1-);
    
    <pick> 0..9 [0..9 [0..9 [0..9]]] = CbV($2$3$4$5:$1);
    
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

These commands take advantage of another Click by Voice keyboard
shortcut, `{ctrl+shift+.}` by default, which makes Click by Voice accept
a command from the clipboard rather than via the pop-up dialog box.  For
more on how this shortcut works, see
[on making voice commands](./doc/making_voice_commands.md).


## Known issues (7/12/2024)

### Selection of elements to hint

* Elements inside of cross-origin iframes are missed
  * same-origin [i]frames should work fine now
  * iframes themselves are now hinted and can be focused or opened in a
    new tab or window
* Elements added after a page is first loaded can take a while to get
  hinted
  * to keep performance reasonable, Click by Voice only automatically
    refreshes hints every three seconds
  * CbV will automatically refresh a page's hints shortly after you
    activate a hint to quickly handle cases where activating a hint
    reveals new elements (e.g., a drop-down menu)
* Normal hint level (`:+`) does not find elements that are only clickable
  because of event listeners
  * hopefully, `:++` should find most of these.
* Some invisible elements are still hinted
* Some elements come into existence only after a mouse hovers over
  another element; although hinted once they appear, the hover action
  may be necessary to make them appear.

### Hint activation

* Some elements can be difficult to select even using CSS selectors
  * e.g., multiple elements that differ only by their contained text
* Some hint activations do not work properly due to insufficient
  fidelity of the synthetically generated events
  * e.g., the generated mouse events do not include coordinates and
    hover does not simulate moving the mouse over all the parent
    elements to the target element
* Chrome clipboard bugs:
  * using !!! without following text (e.g., wanted an empty clipboard afterwards) leaves the command in the clipboard because there is no way to empty the clipboard in Chrome extensions
  * using !!! with thousands of lines can hang the browser for quite a long time

### Hint display

* The default hinting mode, hybrid, disrupts the flow of some webpages
  and its hints can be clipped
  * switching to the overlay mode (`:+o`) should not disturb the flow at
    all at the cost of making text hard to read
* Sometime hints are too hard to read due to inadequate contrast between
  foreground and background colors
  * Adding the high contrast hints switch (e.g, `:+c`) should make the
    hints stand out more and be easier to read at the cost of making
    them more distracting
* Webpages changing an element after the initial page load can make that
  element's hint disappear
  * usually refreshing hints will make the hint reappear
* When a webpage removes then re-creates an element, it will get a new
  hint; when done repeatedly, this causes the element's hint number to
  keep increasing

### Other issues

* Click by Voice, like any Chrome extension, is unable to run on
  `chrome://` URLs like the settings and extensions pages or in built-in
  dialog boxes like the "add bookmarks" dialog box
  * ditto `https://chrome.google.com` URLs (e.g., the developer dashboard)
* Some applications actually read out data from the browser webpage
  representation (DOM) and can become confused by the hints
  * this unfortunately appears to include Dragon's Chrome extension
	* Dragon may think the name of a link includes the hint number at the end
    *  a simple workaround is to either include the hint number or only
       use a prefix of the link name; e.g., say `click submit` or `click
       submit form twelve` for a link named `Submit Form` with hint
       number 12.
  * Also affected are many Google docs/mail sites
    * e.g., <a href="https://github.com/mdbridge/click-by-voice/issues/8">Gmail</a>
  * When used with Microsoft edge, the extension options dialog box is
    too small and appears with scrollbars


## News

* 6/2024: New major version 0.30 released
  * switched to using manifest version 3
* 11/2021: New version 0.23.4 released
  * nested same-origin [i]frames now work properly courtesy of Quinn Tucker
  * the hints no longer appear as text in the DOM
    * this means they should no longer be copied when you cut-and-paste a region containing them
	* may also reduce interference with applications that inspect their DOM
* 12/2020: New major version 0.22 released
  * major performance improvements; perceived lag of using CBV should be
    greatly reduced as well as CPU usage
* 8/2020: New major version 0.21 released
  * Same-origin iframes are now supported
  * as of 0.21.4, click-by-voice periodically checks and updates overlay
    positioning if needed; this includes removing the overlay if the
	underlying element is no longer connected/present
* 4/2019: New major version 0.20 released
  * no official changes, but new experimental config feature available
* 4/2018: New major version 0.19 released.
  * default mode is now hybrid (was inline; use `:+i` to get previous behavior)
  * different basic modes and switching between them is no longer experimental
  * documentation now covers various features introduced recently
	* sending commands by clipboard, nonpersistent show hints commands


## Other

Please address questions and issues to <a
href="https://forums.knowbrainer.com/forum/third-party-command-utilities-vocola-unimacro-voicepower-python/3793-thread-for-issues-with-click-by-voice">this
KnowBrainer thread</a>.
