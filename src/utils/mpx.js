let axios = require('axios');
const fetch = require('sketch-polyfill-fetch');
const { newGuid } = require("./general");

const apiEndpoint = 'https://api.mupixa.com/';
const disableNetwork = false;

/**
 *
 */
function storeAsset(token, projectId, imgUrl) {
    let url =  apiEndpoint + 'asset?project=' + projectId;
    console.log('entered storing assets ' + url)
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
        console.log('storeAsset => request');
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
        console.log('storePrj => request');
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

function getInitialConfig() {
	return {
		quests: [],
		allowedIPs: []
	};
}

function getInitialPage() {
	return {
        id: newGuid(),
        name: '',
        imgURL: '',
        assetId: '',
        hotspots: []
	};
}

module.exports = {
    storeAsset,
    storePrj,
    getInitialPrj,
    getInitialConfig,
    getInitialPage
}
