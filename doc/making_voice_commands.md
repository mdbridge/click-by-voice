# On making voice commands

## Submitting Click-by-Voice commands via the clipboard

While the pop-up dialog box is convenient for debugging and testing
Click-by-Voice commands, it is suboptimal for submitting commands from
other applications like voice recognizers.

Accordingly, Click by Voice has a keyboard shortcut dedicated to
accepting commands from the clipboard.  This allows the voice recognizer
to set the clipboard to the desired Click-by-Voice command then send
synthetic keystrokes to trigger this keyboard shortcut.  This is faster,
more reliable, and less distracting than having the voice recognizer
send many more keystrokes to invoke the dialog box, type the command,
then enter to run the command.

To avoid clobbering the clipboard while doing this whenever possible,
the shortcut allows the command to be followed by `!!!` then the desired
value of the clipboard.  If the shortcut sees `!!!` in the clipboard
then it first sets the clipboard to the text after the `!!!` then
executes the command that was before the `!!!`.

That is, the recommended procedure to send a command *cmd*  to Click by
Voice is:

* retrieve the current text value of the clipboard, call it *clip*
* set the contents of the clipboard to *cmd*:*clip*
* send synthetic keystrokes for {ctrl+shift+.} to invoke the shortcut









*To be written...*

