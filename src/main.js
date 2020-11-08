import BrowserWindow from 'sketch-module-web-view'
import { getWebview } from 'sketch-module-web-view/remote'
import { eventTypes } from '../resources/constants'
import { openURL } from './cocoa-api-wrapper'
import { authorizeToken, fetchToken, purgeToken } from './utils/token'
import { publish } from './publish'
const sketch = require('sketch')

const webviewIdentifier = 'my-plugin.webview'

export default function () {
  const options = {
    identifier: webviewIdentifier,
    width: 500,
    height: 280,
    show: false,
    titleBarStyle: 'hidden',
    fullscreen: false,
    maximizable: false,
    resizable: false,
    useContentSize: true,
    vibrancy: 'dark',
  }

  const browserWindow = new BrowserWindow(options)

  // only show the window when the page has loaded to avoid a white flash
  browserWindow.once('ready-to-show', () => {
    browserWindow.show()
  })

  const webContents = browserWindow.webContents

  webContents.on('did-finish-load', () => {
    const token = fetchToken();
    const data = {type: eventTypes.SET_TOKEN, payload: token};

    webContents
    .executeJavaScript(`sendData('${JSON.stringify(data)}')`)
    .catch(console.error);
  })

  webContents.on('resetToken', res => {
    purgeToken();
    const data = {type: eventTypes.RESET_TOKEN, payload: ''};

    webContents
    .executeJavaScript(`sendData('${JSON.stringify(data)}')`)
    .catch(console.error)
    
  })

  webContents.on('authorizeToken', res => {
    const token = authorizeToken();
    const data = {type: eventTypes.SET_TOKEN, payload: token};

    webContents
      .executeJavaScript(`sendData('${JSON.stringify(data)}')`)
      .catch(console.error)
  });

  webContents.on('openLink', url => {
    console.log('openLink event received');
    openURL(url);
  })

  webContents.on('publish', name => {
    console.log('received publish event');
    publish(name, webContents);
  })



  browserWindow.loadURL(require('../resources/webview.html'))
}

// When the plugin is shutdown by Sketch (for example when the user disable the plugin)
// we need to close the webview if it's open
export function onShutdown() {
  const existingWebview = getWebview(webviewIdentifier)
  if (existingWebview) {
    existingWebview.close()
  }
}
