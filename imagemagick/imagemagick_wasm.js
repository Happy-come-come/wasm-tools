/*
* WasmLoader クラス
* このファイルはtampermonkeyで @require で読み込むことを想定しています。
* GM_xmlhttpRequest が使える環境でのみ動作します。
* このファイルは Emscripten で生成された wasm ファイルを読み込むためのヘルパークラスです。
* const imageMagickWasm = new ImageMagickWasm().load();
* でモジュールを読み込むことができます。
*/
// ==UserScript==
// @connect			raw.githubusercontent.com
// @grant			GM_xmlhttpRequest
// ==/UserScript==

(function(global){
	'use strict';
	const _jsUrl = 'https://raw.githubusercontent.com/Happy-come-come/wasm-tools/raw/refs/heads/master/imagemagick/magick';
	const _wasmUrl = 'https://raw.githubusercontent.com/Happy-come-come/wasm-tools/raw/refs/heads/master/imagemagick/magick.wasm';
	const _jsVersion = '1.0.0.0';
	const _wasmVersion = '1.0.0.0';
	class ImageMagickWasm{
		constructor({jsUrl = _jsUrl, wasmUrl = _wasmUrl, jsVersion = _jsVersion, wasmVersion = _wasmVersion, useCache = true} = {}){
			this.jsUrl = jsUrl;
			this.wasmUrl = wasmUrl;
			this.jsVersion = jsVersion;
			this.wasmVersion = wasmVersion;
			this.js = null;
			this.wasm = null;
			this.module = null;
			this.useCache = useCache;
		}

		async load(){
			try{
				const js = await this.jsLoad();
				const wasm = await this.wasmLoad();
				this.js = js;
				this.wasm = wasm;
				const jsBlob = new Blob([js], {type: 'application/javascript'});
				const jsBlobUrl = URL.createObjectURL(jsBlob);
				const module = await import(jsBlobUrl);
				console.log(module);
				this.module = module.createModule(wasm);
				URL.revokeObjectURL(jsBlobUrl);
				return this.module;
			}catch(error){
				console.error(error);
				return null;
			}
		}

		async jsLoad(){
			if(this.useCache){
				const cachedJs = await getFromIndexedDB('ImageMagickWasm', 'js', 522);
				if(cachedJs?.data && cachedJs?.version){
					if(compareVersions(cachedJs.version, this.jsVersion) >= 0){
						return cachedJs.data;
					}
				}
			}
			const js = await request({url: this.jsUrl, respType: 'text'});
			if(this.useCache)await saveToIndexedDB('ImageMagickWasm', 'js', {data: js, version: this.jsVersion});
			return js;
		}

		async wasmLoad(){
			if(this.useCache){
				const cachedWasm = await getFromIndexedDB('ImageMagickWasm', 'wasm', 522);
				if(cachedWasm?.data && cachedWasm?.version){
					if(compareVersions(cachedWasm.version, this.wasmVersion) >= 0){
						return cachedWasm.data;
					}
				}
			}
			const wasm = await request({url: this.wasmUrl, respType: 'arraybuffer'});
			if(this.useCache)await saveToIndexedDB('ImageMagickWasm', 'wasm', {data: wasm, version: this.wasmVersion});
			return wasm;
		}
	}


	// グローバルに公開
	global.ImageMagickWasm = ImageMagickWasm;

	function openIndexedDB(dbName, storeName){
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(dbName);

			request.onerror = (event) => {
				reject("Database error: " + event.target.errorCode);
			};

			request.onsuccess = (event) => {
				let db = event.target.result;
				if(db.objectStoreNames.contains(storeName)){
					resolve(db);
				}else{
					db.close();
					const newVersion = db.version + 1;
					const versionRequest = indexedDB.open(dbName, newVersion);
					versionRequest.onupgradeneeded = (event) => {
						db = event.target.result;
						db.createObjectStore(storeName, { keyPath: 'id' });
					};
					versionRequest.onsuccess = (event) => {
						resolve(event.target.result);
					};
					versionRequest.onerror = (event) => {
						reject("Database error: " + event.target.errorCode);
					};
				}
			};

			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				db.createObjectStore(storeName, { keyPath: 'id' });
			};
		});
	}

	function saveToIndexedDB(dbName, storeName, data, id = 522){
		return new Promise(async (resolve, reject) => {
			try{
				const db = await openIndexedDB(dbName, storeName);
				const transaction = db.transaction(storeName, 'readwrite');
				const store = transaction.objectStore(storeName);
				const putRequest = store.put({ id: id, data: data });

				putRequest.onsuccess = () => {
					resolve("Data saved successfully.");
				};

				putRequest.onerror = (event) => {
					reject("Data save error: " + event.target.errorCode);
				};
			}catch(error){
				reject(error);
			}
		});
	}

	function getFromIndexedDB(dbName, storeName, id = 522){
		return new Promise(async (resolve, reject) => {
			try{
				const db = await openIndexedDB(dbName, storeName);
				const transaction = db.transaction(storeName, 'readonly');
				const store = transaction.objectStore(storeName);
				const getRequest = store.get(id);

				getRequest.onsuccess = (event) => {
					if(event.target.result){
						// こうしないとfirefox系ブラウザで
						// Error: Not allowed to define cross-origin object as property on [Object] or [Array] XrayWrapper
						// というエラーが出ることがあるので、構造化クローンを使ってコピーする
						// でかいオブジェクトだと効率が悪いのでなにかいい方法があれば教えてください
						resolve(structuredClone(event.target.result.data));
					}else{
						resolve(null);
					}
				};

				getRequest.onerror = (event) => {
					reject("Data fetch error: " + event.target.errorCode);
				};
			}catch(error){
				reject(error);
			}
		});
	}

	function compareVersions(version1, version2){
		// 同じなら0, v1が大きいなら1, v2が大きいなら-1
		const v1Parts = version1.split('.').map(Number);
		const v2Parts = version2.split('.').map(Number);
		const length = Math.max(v1Parts.length, v2Parts.length);
		for(let i = 0; i < length; i++){
			const v1Part = v1Parts[i] || 0;
			const v2Part = v2Parts[i] || 0;
			if(v1Part > v2Part){
				return 1;
			}
			if(v1Part < v2Part){
				return -1;
			}
		}
		return 0;
	}

	const userAgent = navigator.userAgent || navigator.vendor || window.opera;
	async function request({url, method = 'GET', respType = 'json', headers = {}, dontUseGenericHeaders = false, body = null, anonymous = false, cookie = null, maxRetries = 0, timeout = 60000, onlyResponse = true} = {}){
		if(!url)throw('url is not defined');

		const requestObject = {
			method,
			respType,
			url,
			headers: dontUseGenericHeaders ? headers : Object.assign({
				'Content-Type': '*/*',
				'Accept-Encoding': 'br, gzip, deflate, zstd',
				'User-agent': userAgent,
				'Accept': '*/*',
				'Referer': url,
				//'Sec-Fetch-Dest': 'empty',
				'Sec-Fetch-Mode': 'cors',
				'Sec-Fetch-Site': 'same-origin',
				...(cookie ? {'Cookie': cookie} : {}),
			}, headers),
			body,
			anonymous,
		};
		let retryCount = 0;
		while(retryCount <= maxRetries){
			try{
				const response = await new Promise((resolve, reject) => {
					GM_xmlhttpRequest({
						method: requestObject.method,
						url: requestObject.url,
						headers: requestObject.headers,
						responseType: requestObject.respType,
						data: requestObject.body,
						anonymous: requestObject.anonymous,
						timeout: timeout,
						onload: function(responseDetails){
							if(responseDetails.status >= 200 && responseDetails.status < 300){
								if(onlyResponse == false || method == 'HEAD'){
									return resolve(responseDetails);
								}else{
									return resolve(responseDetails.response);
								}
							}else if(responseDetails.status >= 500 || responseDetails.status === 429){
								console.warn(`Retrying due to response status: ${responseDetails.status}`);
								return reject({
									function_name: 'request',
									reason: `Server error or too many requests (status: ${responseDetails.status})`,
									response: responseDetails,
									requestObject: requestObject
								});
							}
						},
						ontimeout: function(responseDetails){
							console.warn(responseDetails);
							return reject({
								function_name: 'request',
								reason: 'time out',
								response: responseDetails,
								requestObject: requestObject
							});
						},
						onerror: function(responseDetails){
							console.warn(responseDetails);
							return reject({
								function_name: 'request',
								reason: 'error',
								response: responseDetails,
								requestObject: requestObject
							});
						}
					});
				});
				return response;
			}catch(error){
				retryCount++;
				console.warn({
					error: error,
					url: requestObject.url,
					Retry: retryCount,
					object: requestObject,
				});
				if(retryCount === maxRetries){
					throw({
						error: error,
						url: requestObject.url,
						Retry: retryCount,
						object: requestObject,
					});
				}
			}
		}
	}
})(this);
