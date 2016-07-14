# Click by Voice

This Chrome browser extension is being developed to provide support
for activating links and other HTML elements using voice commands.


## Using Click by Voice manually

Click by Voice provides two keyboard shortcuts, which are bound by
default to `{ctrl+shift+space}` (pop up command dialog box) and
'{ctrl+shift+,}' (blur).  You can rebind these as desired using the
keyboard shortcuts link at the bottom of the <a
href="chrome://extensions/">extensions page</a>.

The blur shortcut removes keyboard focus from an element, returning it
to the overall webpage.  This can be useful, for example, when you want
to page the website up and down and an input element like a text field
has focus.

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

* 'c' clicks the element
* 'f' focuses the element (doesn't work on all elements)
* 't' opens links in a new tab, changing focus to that tab
* 'b' opens links in a new tab, but does not change focus to that tab
* 'w' opens links in a new window, changing focus to that window

For example, `153:t` opens the link with hint number 153 in a new tab.
An empty operation (e.g., `153:`) is equivalent to specifying no
operation.

More command types will be added later.  You can dismiss the command
dialog box by typing `{escape}`.

Hint numbers are automatically displayed when a page is loaded; enter
":-" as the hint number to turn them off until a new page is loaded
(this includes reloading the current page).  Passing ":+" turns the
hints back on-again and/or refreshes them.  Hint numbers are not shown
when printing.


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
    show numbers = {ctrl+shift+space} Wait(500) :+{enter};
    hide numbers = {ctrl+shift+space} Wait(500) :-{enter};
    
    <pick> 0..9 [0..9 [0..9 [0..9]]] = {ctrl+shift+space} Wait(500) $2$3$4$5 $1{enter};
    
    <pick> := (        pick = ""
              | push   pick = b     # stay but open new tab w/ link
              | tab    pick = t
              | window pick = w
              | go     pick = f
              );


## Known issues

* The selection of elements that should be given hints needs work:
  * elements inside of iframes are missed
  * to cover elements added dynamically over time, Click by Voice
    automatically refreshes hints every 3 seconds
    * this can require waiting several seconds after a click or page load
* The placement of hints is suboptimal and disrupts the flow of some webpages
* Sometimes hints are unreadable due to clipping
* Sometime hints are too hard to read due to inadequate contrast between
  foreground and background colors
* executing a command (especially the popping up part) is slower than I'd like
* still some invisible elements that are hinted


## Other

(July 7, 2016) I've been working on this extension for several days now
and while it's not where I'd like it to be, it is certainly functional
enough for most uses.

Please address questions and issues to <a
href="https://www.knowbrainer.com/forums/forum/messageview.cfm?catid=25&threadid=22663">this
thread</a>.
