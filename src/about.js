import sketch from 'sketch'
const { showAboutWindow } = require("./cocoa-api-wrapper");

export default function() {
    showAboutWindow( 
              'About Mupixa',
              'A handy plugin used for publishing prototypes on the UX evaluation platform Mupixa',
              'www.mupixa.com',
              'Version 1.0.0')
}