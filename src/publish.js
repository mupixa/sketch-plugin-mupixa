import sketch from 'sketch'
const { fetchToken, purgeToken } = require("./utils/token");
const mpxUtils = require('./utils/mpx');
const cocoaApiWrapper = require('./cocoa-api-wrapper');
const BrowserWindow = require('sketch-module-web-view');
const { newGuid } = require("./utils/general");
const Artboard = require('sketch/dom').Artboard;
var layerWidth = null;
var layerHeight = null;
var token = null;
var selectedPage = null;
var flowStartArtboard = null;
const HOTSPOT_TYPE_GOTO = 0;
const HOTSPOT_TYPE_BACK = 4;

var artboardLayers = [];
var modifiedLayerCoords = {};
var layerCoordsPromises = [];

export default function() {
  publish();
}

function publish() {
  console.log('-------------- BEGIN -------------')
  token = fetchToken();
  console.log('got token: ' + token);
  selectedPage = getSelectedPage(sketch.getSelectedDocument().pages);

  if(!selectedPage) {
    // page needs to be selected otherwise we need to export artboards for all pages
    sketch.UI.message('At least one page must be selected!');
    return null;
  }
  // The following snippet is an option for creating custom UI
  // let win = new BrowserWindow({ width: 800, height: 600 })
  // win.on('closed', () => {
  //   win = null
  // })

  // Load a remote URL
  //win.loadURL('http://localhost')
  var response = cocoaApiWrapper.popUpModalDialog(sketch);
  _processDialogResponse(response);
  
  console.log('-------------- END -------------')
}

function exportBoards(page) {
  const options = { formats: 'jpg', output: false } // output is the path to export the artboards, defaults to "~/Documents/Sketch Exports"
  var artboards = [];

  for (let layer of page.layers) {
    console.log(layer.name +' with ID '+layer.id+'is being exported');
    if(!layer instanceof Artboard) continue;
    artboardLayers.push(layer);

    let size = getLayerSize(layer);
    const buffer = sketch.export(layer, options);
    let artboard = {id: layer.id,
                    name: layer.name,
                    width: size.width,
                    height: size.height, 
                    content: _arrayBufferToBase64(buffer)};

    if(layer.flowStartPoint) {
      flowStartArtboard = layer;
      artboards.unshift(artboard);
    } else {
      artboards.push(artboard);
    }

    for( let l of layer.layers) {
      modifiedLayerCoords[l.id] = {x: l.frame.x, y: l.frame.y};
      layerCoordsPromises.push(adjustLayerCoordinates(l));
    }
  }
  
  return artboards;
}

var _generateFlowMap = (artboards) => {
  let map = {};

  for(let artboard of artboards) {
    if(!artboard.layers) continue;
    map[artboard.id] = nestedFlows(artboard, artboard.layers, []);
  }
  return map;
}

var nestedFlows = (artboard, layers, hotspots) => {
  if(!layers) return hotspots;
  for(let layer of layers) {
    if(layer.flow) {
      console.log("Hotspots size: " + hotspots.length);
      hotspots.push(_createHotspot(artboard, layer));
    }
    hotspots = nestedFlows(artboard, layer.layers, hotspots);
  }
  return hotspots;
}

var adjustLayerCoordinates = (layer) => {
  if(!layer.layers) {
    return layer;
  }

  for(let childLayer of layer.layers) {
    let x = childLayer.frame.x + modifiedLayerCoords[layer.id].x;
    let y = childLayer.frame.y + modifiedLayerCoords[layer.id].y;
    modifiedLayerCoords[childLayer.id] = {x: x, y: y};
    adjustLayerCoordinates(childLayer);
  }
  return layer;
}

const _createHotspot = (artboard, innerLayer) => {
  let frame = innerLayer.frame;
  let flow = innerLayer.flow; 
  let type = innerLayer.flow.targetId == 'back' ? HOTSPOT_TYPE_BACK : HOTSPOT_TYPE_GOTO;
  let coordsObj = modifiedLayerCoords[innerLayer.id];

  return {
      id: newGuid(),
      name: artboard.name,
      type: type,
      toPageId: flow.targetId,
      area: {
          position: {
              x: coordsObj.x,
              y: coordsObj.y
          },
          size: {
              width: frame.width,
              height: frame.height
          }
      }
  };
}

function publishArtboards(projectName) {

  var artboards = exportBoards(selectedPage);
  var flowsMap = _generateFlowMap(artboardLayers);

  if(artboards.length < 1) {
    sketch.UI.message('No artboards available for publishing. Please make sure the selected page contains at least one artboard.');
    return null;
  }
  
  console.log('got artboards');

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

    let artboardToPageMap = {};
    Promise.all(assetPromises)
      .then(assetIds => {
          assetIds.map((assetId, idx) => {
              const isHomepage = flowStartArtboard && flowStartArtboard.id == artboards[idx].id ? true : false;

              let page = mpxUtils.createPage(
                artboards[idx].id,
                artboards[idx].name,
                assetId,
                flowsMap,
                isHomepage
            );

            artboardToPageMap[artboards[idx].id] = page.id;
            prj.pages.push(page);
          });

          prj.pages = prj.pages.map(page => {
            let newHotspots = page.hotspots.map( hotspot => {
                if (artboardToPageMap.hasOwnProperty(hotspot.toPageId)) {
                    return Object.assign({}, hotspot, {toPageId: artboardToPageMap[hotspot.toPageId]});
                }
                return hotspot;
            });
            
            return Object.assign({}, page, {hotspots: newHotspots});
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
      chr2 = i < input.length ? input[i++] : Number.NaN; // Not sure if the index 
      chr3 = i < input.length ? input[i++] : Number.NaN; // checks are needed here

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