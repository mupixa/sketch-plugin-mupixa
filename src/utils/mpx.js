const fetch = require('sketch-polyfill-fetch');
const { newGuid } = require("./general");

const apiEndpoint = 'https://api.mupixa.com/';
const disableNetwork = false;

/**
 *
 */
function storeAsset(token, projectId, imgUrl) {
    let url =  apiEndpoint + 'asset?project=' + projectId;
	return new Promise((resolve, reject) => {
        var requestConfig = {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'plg': token
            },
            body: {
                base64: imgUrl
            }
        };
        fetch(url, requestConfig)
            .then((response) => {
                return response.text()
            })
            .then(assetId => {
                console.log('Asset stored: ' + assetId);
                return resolve(assetId);
            }).catch(err => {
                console.log('err:' + JSON.stringify(err));
                return reject();
            });
	});
}

/**
 *
 */
function storePrj(token, prj, config) {
    let url = apiEndpoint + 'prj';
	return new Promise((resolve, reject) => {
        if (disableNetwork) {
            return resolve(5);
        }
        
        var requestConfig = {
            method: 'post',
            headers: {
                'Content-Type': 'application/json',
                'plg': token
            },
            body: {
                project:  prj,
                config: config
            }
        };
        fetch(url, requestConfig)
            .then((response) => {
                return response.text()
            })
            .then(prjId => {
                return resolve(prjId);
            })
            .catch(err => {
                console.log('err:' + err);
                return reject();
            });
	});
}

function getInitialPrj() {
	return {
	  id: '',
	  name: '',
	  pages: [],
	  res: {
	      width: 0,
	      height: 0
	  }
	};
}

function createPage(artboardId, name, assetId, flowsMap, isHomepage) {
    let page = {
        id: newGuid(),
        name: name,
        imgURL: '',
        assetId: assetId,
        hotspots: []
        // isHomepage: isHomepage // TODO
    };
    if (flowsMap.hasOwnProperty(artboardId)) {
        flowsMap[artboardId].forEach(hotspot => {
            page.hotspots.push(
                Object.assign({}, hotspot, {id: page.id + '|' + hotspot.id})
            );
        });
    }
	return page;
}

function getInitialConfig() {
	return {
		quests: [],
		allowedIPs: []
	};
}

module.exports = {
    storeAsset,
    storePrj,
    getInitialPrj,
    getInitialConfig,
    createPage
}
