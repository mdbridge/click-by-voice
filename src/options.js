// Saves options to chrome.storage.sync.
function save_options() {
  var command = document.getElementById('command').value;
  chrome.storage.sync.set({
    startingCommand: command
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 750);
  });
}

// Restores command using the preferences stored in chrome.storage.
function restore_options() {
  // Use default value command = ':+'.
  chrome.storage.sync.get({
    startingCommand: ':+'
  }, function(items) {
    document.getElementById('command').value = items.startingCommand;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
