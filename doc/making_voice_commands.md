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

That is, the recommended procedure to send a command *cmd* to Click by
Voice is:

* retrieve the current text value of the clipboard, call it *clip*
* set the contents of the clipboard to *cmd*!!!*clip*
* send synthetic keystrokes for `{ctrl+shift+.}` to invoke the shortcut

This should avoid clobbering the clipboard as long as its format is text
rather than a photo or the like.

### Vocola 2 example code

In Vocola 2, a user-defined function to do this looks like:

    CbV(command) := Clipboard.Set($command!!! Clipboard.Get("")) {ctrl+shift+.};

Here, `Clipboard` is a Vocola extension for getting and setting the
clipboard.  It will shortly be part of the Vocola 2 release, but for now
you can get the most recent version from
https://github.com/mdbridge/Vocola-2/tree/master/src/extensions; you
will need both `vocola_ext_clipboard.py` and `vocola_ext_variables.py`.
Note that the earlier version at
http://vocola.net/unofficial/clipboard.html has a bug that causes it to
sometimes fail to retrieve data from the clipboard and should be
avoided.  The `""` in `Clipboard.Get("")` is important because it means
that Vocola will use the empty string if the clipboard can't be
converted to text instead of producing a runtime error.  This means that
the command will still work if the clipboard contains a photo.


## Building voice commands that don't need to know the hint number

You can use the ability to select hints by CSS selector to create voice
commands that don't require the user to know the hint number.    For
example,

	Refresh notifications = CbV('${._4m8j}:c');
    Mark all read = CbV('${a[data-tooltip-content="Mark All Read"]}:c');

(These commands target specific elements of specific webpages and would
normally be enabled only for those pages.)

While these are only simple accelerators, you can write parameterized
commands to do things like select a field, fill in a value, then update
a form.
