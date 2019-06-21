import sketch from 'sketch'
const { fetchToken, purgeToken } = require("./utils/token");
const mpxUtils = require('./utils/mpx');
const cocoaApiWrapper = require('./cocoa-api-wrapper');
const BrowserWindow = require('sketch-module-web-view')
var layerWidth = null;
var layerHeight = null;
var token = null;
var selectedPage = null;

export default function() {
  publish();
}

function publish() {
  token = fetchToken();
  console.log('got token: ' + token);
  selectedPage = getSelectedPage(sketch.getSelectedDocument().pages);

  if(!selectedPage) {
    sketch.UI.message('At least one page must be selected!');
    return null;
  } 
  var response = cocoaApiWrapper.popUpModalDialog(sketch);
  _processDialogResponse(response);
}

function exportBoards(page) {
  const options = { formats: 'jpg', output: false }
  var artboards = [];

  for (let layer of page.layers) {
    console.log(layer.name +' is being exported');

    let size = getLayerSize(layer);

    const buffer = sketch.export(layer, options);
    artboards.push({name: layer.name,
                    width: size.width,
                    height: size.height, 
                    content: _arrayBufferToBase64(buffer)});
  }
  
  return artboards;
}

function publishArtboards(projectName) {

  var artboards = exportBoards(selectedPage);

  if(artboards.length < 1) {
    sketch.UI.message('No artboards available for publishing. Please make sure the selected page contains at least one artboard.');
    return null;
  }
  
  console.log('got artboards')

  var prj = mpxUtils.getInitialPrj();
  prj.name = projectName;
  var config = mpxUtils.getInitialConfig();

  let assetPromises = [];

  sketch.UI.message('Creating project \'' + projectName + '\' ...');

  mpxUtils.storePrj(token, prj, config).then(prjId => {
    prj.id = prjId;
    console.log("prj id is " + prjId);
    sketch.UI.message('Uploading artboards ...');
    artboards.map(artboard => {
      assetPromises.push(
          mpxUtils.storeAsset(token, prj.id, artboard.content)
      );
    });
    prj.res.width = artboards[0].width;
    prj.res.height = artboards[0].height;
  
    Promise.all(assetPromises)
      .then(assetIds => {
          assetIds.map((assetId, idx) => {
              let page = mpxUtils.getInitialPage();
              page.name = artboards[idx].name;
              page.assetId = assetId;
              prj.pages.push(page);
          });

          sketch.UI.message('Assigning uploaded artboards to the project');

          // save updated project
          mpxUtils.storePrj(token, prj, config)
              .then(prjId => {
                  console.log('Project published.');
                  sketch.UI.message('Your project \'' + projectName + '\' has been published to Mupixa!');
              });
      });
  })
  .catch(err => {
    return showError("An error occured", "Please make sure you have internet access.\nIf the error persists, 'Reset authorisation' and try again.");
  })

}

function getLayerSize(layer) {
  if(!layerWidth) {
    layerWidth = layer.frame.width;
  }
  if(!layerHeight) {
    layerHeight = layer.frame.height;
  }
  
  return {width: layerWidth, height: layerHeight};
}

function getSelectedPage(pages) {
  for (let page of pages) {
    if(page.selected) {
      return page;
    }
  }
  return null;
}

function _processDialogResponse(response) {
  let projectName = response.projectName;
  if(response.code === cocoaApiWrapper.PUBLISH && projectName == '') {
    console.log('in')
    return showError('Publish failed!', 'Please specify a project name.');
  }
  switch(response.code) {
      case cocoaApiWrapper.PUBLISH:
          publishArtboards(projectName)
          break;
      case cocoaApiWrapper.RESET_AUTHORIZATION:
          console.log('reset authorization')
          purgeToken();
          publish();
          break;
      default:
          console.log('closing ... no action');
  }
}

function _arrayBufferToBase64( buffer ) {
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  console.log('ArrayBuffer size: ' + len);

  return 'data:image/jpeg;base64,' + encode(bytes);
}

function showError(title, description) {
  var response = cocoaApiWrapper.showAlertError(title, description);
  if(response == cocoaApiWrapper.PUBLISH) {
    return publish();
  }
  return null;
}

function encode (input) {
  var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  var output = "";
  var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
  var i = 0;

  while (i < input.length) {
      chr1 = input[i++];
      chr2 = i < input.length ? input[i++] : Number.NaN;
      chr3 = i < input.length ? input[i++] : Number.NaN;

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
          enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
          enc4 = 64;
      }
      output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                keyStr.charAt(enc3) + keyStr.charAt(enc4);
  }
  return output;
}