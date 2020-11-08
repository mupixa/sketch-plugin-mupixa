const settings = require('sketch/settings')
const { openURL } = require("../cocoa-api-wrapper");
const tokenRegistrationEndpoint = 'https://app.mupixa.com/authToken?token=';

/**
 *
 */
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
  
/**
*
*/
function authorizeToken() {
    const token = 'sK-' + uuidv4();

    settings.setSettingForKey('token', token);
    console.log('Token stored: ' + token);
    
    // Send the user to authorise the token after loging in
    openURL(tokenRegistrationEndpoint + token);

    
    // const BrowserWindow = require('sketch-module-web-view')
    // let win = new BrowserWindow({ width: 800, height: 600, frame: false })
    // win.loadURL(tokenRegistrationEndpoint + token)
    
    
    return token;
}

/**
 *
 */
function fetchToken() {
    var token = settings.settingForKey('token')
    if(token) {
        console.log('Auth token loaded: ' + token);
        return token;
    }
    
    console.log('Auth token not found.');
    // return authorizeToken()
}

/**
 *
 */
function purgeToken() {
    var token = settings.settingForKey('token')
        
    if(token) {
        settings.setSettingForKey('token', null);
        console.log('Token deleted.');
    } else console.log('Token does not exist.');
    
}

module.exports = {
    fetchToken,
    purgeToken,
    authorizeToken
}
