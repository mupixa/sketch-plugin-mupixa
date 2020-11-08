import sketch from 'sketch'
import { eventTypes, progressStatus } from '../resources/constants';
const { fetchToken } = require("./utils/token");
const mpxUtils = require('./utils/mpx');
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
var webContents = null;

export function publish(name, webc) {
  webContents = webc;
  token = fetchToken();
  
  selectedPage = getSelectedPage(sketch.getSelectedDocument().pages);

  console.log(name);

  if(!selectedPage) {
    // page needs to be selected otherwise we need to export artboards for all pages
    setResult('Could not publish project. At least one page must be selected.');
    return null;
  }

  publishArtboards(name);
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

    if(!layer.layers) continue;

    for( let l of layer.layers) {
      modifiedLayerCoords[l.id] = {x: l.frame.x, y: l.frame.y};
      layerCoordsPromises.push(adjustLayerCoordinates(l));
    }
  }

  return artboards;
}

const updateProgress = (val) => {
  const data = {type: eventTypes.SET_PROGRESS, payload: val}
  
  webContents
      .executeJavaScript(`sendData('${JSON.stringify(data)}')`)
      .catch(console.error)
  
}

const setResult = (result, projectId) => {
  const payload = {result: result, projectId: projectId};
  const data = {type: eventTypes.SET_RESULT, payload: payload}
  webContents
      .executeJavaScript(`sendData('${JSON.stringify(data)}')`)
      .catch(console.error)
}

var generateFlowMap = (artboards) => {
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

  updateProgress(progressStatus.PREPARING_ARTBOARDS);

  var artboards = exportBoards(selectedPage);

  var flowsMap = generateFlowMap(artboardLayers);

  if(artboards.length < 1) {
    setResult('No artboards available for publishing. Please make sure the selected page contains at least one artboard.');
    return null;
  }
  
  console.log('Got artboards');

  var prj = mpxUtils.getInitialPrj();
  prj.name = projectName;
  var config = mpxUtils.getInitialConfig();

  let assetPromises = [];

  updateProgress(progressStatus.CREATING_PROJECT);

  mpxUtils.storePrj(token, prj, config).then(prjId => {
    prj.id = prjId;
    console.log("Project id: " + prjId);
    
    updateProgress(progressStatus.UPLOADING_ARTBOARDS);
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

          updateProgress(progressStatus.ASSIGNING_ARTBOARDS);
          // save updated project
          mpxUtils.storePrj(token, prj, config)
              .then(prjId => {
                  setResult(`Project ${projectName} published successfully!`, prjId);
              });
      });
  })
  .catch(err => {
    return setResult(`Project ${projectName} could not be published. Please make sure you have internet access. If the problem persists, reset token and try again.`);
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

function _arrayBufferToBase64( buffer ) {
  var bytes = new Uint8Array( buffer );
  var len = bytes.byteLength;
  console.log('ArrayBuffer size: ' + len);

  return 'data:image/jpeg;base64,' + encode(bytes);
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