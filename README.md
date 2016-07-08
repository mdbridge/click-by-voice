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
whether an element should be clicked were focused; if it guesses wrong,
you can use one of the more specific commands to force clicking or
focusing.)
