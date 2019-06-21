const PUBLISH = 1000
const CLOSE = 1001
const RESET_AUTHORIZATION = 1002

function showAboutWindow(title, description, url, version) {
    let informativeText = description + '\n\n' + url + '\n\n' + version;
    var alert = NSAlert.alloc().init()
    alert.icon = NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path())
    alert.messageText = title;
    alert.informativeText = informativeText;

    var answer = alert.runModal()
}

function showAlertError(title, informativeText) {
    var dialog = NSAlert.alloc().init()
    dialog.icon = NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path());
    dialog.messageText = title;
    dialog.informativeText = informativeText;
    dialog.addButtonWithTitle("Try again");
    dialog.addButtonWithTitle("Close");

    var answer = dialog.runModal()
    return answer;
}

function openURL(url) {
    NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(url));
}

function popUpModalDialog(sketch) {
    var dialog = COSAlertWindow.new()
    dialog.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
    dialog.setMessageText("Mupixa publisher")
    dialog.addTextLabelWithValue("Project name:");
    var projectNameTextField = NSTextField.alloc().initWithFrame(NSMakeRect(0, 0, 300, 24));

    dialog.addButtonWithTitle("Publish");
    dialog.addButtonWithTitle("Close");
    dialog.addButtonWithTitle("Reset authorisation")

    dialog.addAccessoryView(projectNameTextField)

    var answer = dialog.runModal()
    console.log(answer)

    return {code: answer, projectName: projectNameTextField.stringValue()}
}

module.exports = {
    PUBLISH, CLOSE, RESET_AUTHORIZATION,
    showAboutWindow,
    showAlertError,
    openURL,
    popUpModalDialog
}