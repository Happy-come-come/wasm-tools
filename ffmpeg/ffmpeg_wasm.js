// ==UserScript==
// @name			ffmpeg_wasm
// @description		ffmpegのwasmを読み込むためのヘルパークラス
// @namespace		https://greasyfork.org/ja/users/1023652
// @version			1.0.0.0
// @author			ゆにてぃー
// @license			MIT
// @match			*://*/*
// @connect			raw.githubusercontent.com
// @grant			GM_xmlhttpRequest
// ==/UserScript==

(function(global){
	// src/const.ts
	const ffmpegCoreUrl = 'https://raw.githubusercontent.com/Happy-come-come/wasm-tools/refs/heads/master/ffmpeg/ffmpeg';
	const ffmpegCoreWorkerUrl = `https://raw.githubusercontent.com/Happy-come-come/wasm-tools/refs/heads/master/ffmpeg/ffmpeg-core.worker.js`;
	const ffmpegWorkerUrl = `https://raw.githubusercontent.com/Happy-come-come/wasm-tools/refs/heads/master/ffmpeg/worker.js`;
	const ffmpegWasmUrl = `https://raw.githubusercontent.com/Happy-come-come/wasm-tools/refs/heads/master/ffmpeg/ffmpeg.wasm`;
	const ffmpegWasmVersion = "1.0.0.0";
	// src/utils.ts
	var getMessageID = (() => {
		let messageID = 0;
		return () => messageID++;
	})();

	// src/errors.ts
	var ERROR_UNKNOWN_MESSAGE_TYPE = new Error("unknown message type");
	var ERROR_NOT_LOADED = new Error("ffmpeg is not loaded, call `await ffmpeg.load()` first");
	var ERROR_TERMINATED = new Error("called FFmpeg.terminate()");
	var ERROR_IMPORT_FAILURE = new Error("failed to import ffmpeg-core.js");

	// src/classes.ts
	class FFmpeg {
		#worker = null;
		#resolves = {};
		#rejects = {};
		#logEventCallbacks = [];
		#progressEventCallbacks = [];
		loaded = false;
		#registerHandlers = () => {
			if(this.#worker){
				this.#worker.onmessage = ({
					data: { id, type, data }
				}) => {
					switch (type){
						case "LOAD" /* LOAD */:
							this.loaded = true;
							this.#resolves[id](data);
							break;
						case "MOUNT" /* MOUNT */:
						case "UNMOUNT" /* UNMOUNT */:
						case "EXEC" /* EXEC */:
						case "FFPROBE" /* FFPROBE */:
						case "WRITE_FILE" /* WRITE_FILE */:
						case "READ_FILE" /* READ_FILE */:
						case "DELETE_FILE" /* DELETE_FILE */:
						case "RENAME" /* RENAME */:
						case "CREATE_DIR" /* CREATE_DIR */:
						case "LIST_DIR" /* LIST_DIR */:
						case "DELETE_DIR" /* DELETE_DIR */:
							this.#resolves[id](data);
							break;
						case "LOG" /* LOG */:
							this.#logEventCallbacks.forEach((f) => f(data));
							break;
						case "PROGRESS" /* PROGRESS */:
							this.#progressEventCallbacks.forEach((f) => f(data));
							break;
						case "ERROR" /* ERROR */:
							this.#rejects[id](data);
							break;
					}
					delete this.#resolves[id];
					delete this.#rejects[id];
				};
			}
		};
		#send = ({ type, data }, trans = [], signal) => {
			if(!this.#worker){
				return Promise.reject(ERROR_NOT_LOADED);
			}
			return new Promise((resolve, reject) => {
				const id = getMessageID();
				this.#worker && this.#worker.postMessage({ id, type, data }, trans);
				this.#resolves[id] = resolve;
				this.#rejects[id] = reject;
				signal?.addEventListener("abort", () => {
					reject(new DOMException(`Message # ${id} was aborted`, "AbortError"));
				}, { once: true });
			});
		};
		on(event, callback){
			if(event === "log"){
				this.#logEventCallbacks.push(callback);
			}else if(event === "progress"){
				this.#progressEventCallbacks.push(callback);
			}
		}
		off(event, callback){
			if(event === "log"){
				this.#logEventCallbacks = this.#logEventCallbacks.filter((f) => f !== callback);
			}else if(event === "progress"){
				this.#progressEventCallbacks = this.#progressEventCallbacks.filter((f) => f !== callback);
			}
		}
		load = async ({ ...config } = {}, { signal } = {}) => {
			const isUseCache = config.useCache !== false;
			const wasmUrl = await this.#getWasm(config.wasmURL || ffmpegWasmUrl, isUseCache, config.wasmVersion || ffmpegWasmVersion);
			const coreUrl = await this.#getCore(config.coreURL || ffmpegCoreUrl, isUseCache, config.coreVersion || ffmpegWasmVersion);
			const coreWorkerUrl = await this.#getCoreWorker(config.workerURL || ffmpegCoreWorkerUrl, isUseCache, config.coreWorkerVersion || ffmpegWasmVersion);
			const classWorkerURL = await this.#getWorker(ffmpegWorkerUrl, isUseCache, ffmpegWasmVersion);
			if(!this.#worker){
				this.#worker = classWorkerURL ? new Worker(new URL(classWorkerURL), {
					type: "module"
				}) : new Worker(new URL("./worker.js", document.location.href), {
					type: "module"
				});
				this.#registerHandlers();
			}
			URL.revokeObjectURL(classWorkerURL);
			config.wasmURL = wasmUrl;
			config.coreURL = coreUrl;
			config.workerURL = coreWorkerUrl;
			const sendRes = await this.#send({
				type: "LOAD" /* LOAD */,
				data: config
			}, undefined, signal);
			URL.revokeObjectURL(wasmUrl);
			URL.revokeObjectURL(coreUrl);
			URL.revokeObjectURL(coreWorkerUrl);
			return sendRes;
		};
		#getWorker = async (ffmpegWorkerUrl, useCache, version) => {
			if(useCache){
				const cachedWorker = await getFromIndexedDB('FFmpegWasm', 'ffmpegWorker', 522);
				if(cachedWorker?.data && compareVersions(version, cachedWorker?.version) === 0){
					const workerUrl = URL.createObjectURL(new Blob([cachedWorker.data], { type: 'application/javascript' }));
					return workerUrl;
				}else{
					const downloadedWorker = await request({
						url: ffmpegWorkerUrl,
						respType: 'text',
						onlyResponse: true
					});
					const workerUrl = URL.createObjectURL(new Blob([downloadedWorker], { type: 'application/javascript' }));
					await saveToIndexedDB('FFmpegWasm', 'ffmpegWorker', {data: downloadedWorker, version: version}, 522);
					return workerUrl;
				}
			}else{
				const downloadedWorker = await request({
					url: ffmpegWorkerUrl,
					respType: 'text',
					onlyResponse: true
				});
				const workerUrl = URL.createObjectURL(new Blob([downloadedWorker], { type: 'application/javascript' }));
				return workerUrl;
			}
		};
		#getCoreWorker = async (ffmpegCoreWorkerUrl, useCache, version) => {
			if(useCache){
				const cachedCoreWorker = await getFromIndexedDB('FFmpegWasm', 'ffmpegCoreWorker', 522);
				if(cachedCoreWorker?.data && compareVersions(version, cachedCoreWorker?.version) === 0){
					const coreWorkerUrl = URL.createObjectURL(new Blob([cachedCoreWorker.data], { type: 'application/javascript' }));
					return coreWorkerUrl;
				}else{
					const downloadedCoreWorker = await request({
						url: ffmpegCoreWorkerUrl,
						respType: 'text',
						onlyResponse: true
					});
					const coreWorkerUrl = URL.createObjectURL(new Blob([downloadedCoreWorker], { type: 'application/javascript' }));
					await saveToIndexedDB('FFmpegWasm', 'ffmpegCoreWorker', {data: downloadedCoreWorker, version: version}, 522);
					return coreWorkerUrl;
				}
			}else{
				const downloadedCoreWorker = await request({
					url: ffmpegCoreWorkerUrl,
					respType: 'text',
					onlyResponse: true
				});
				const coreWorkerUrl = URL.createObjectURL(new Blob([downloadedCoreWorker], { type: 'application/javascript' }));
				return coreWorkerUrl;
			}
		};
		#getWasm = async (ffmpegWasmUrl, useCache, version) => {
			if(useCache){
				const cachedWasm = await getFromIndexedDB('FFmpegWasm', 'ffmpegWasm', 522);
				if(cachedWasm?.data && compareVersions(version, cachedWasm?.version) === 0){
					const wasmUrl = URL.createObjectURL(new Blob([cachedWasm.data], { type: 'application/wasm' }));
					return wasmUrl;
				}else{
					const downloadedWasm = await request({
						url: ffmpegWasmUrl,
						respType: 'arraybuffer',
						onlyResponse: true
					});
					const wasmUrl = URL.createObjectURL(new Blob([downloadedWasm], { type: 'application/wasm' }));
					await saveToIndexedDB('FFmpegWasm', 'ffmpegWasm', {data: downloadedWasm, version: version}, 522);
					return wasmUrl;
				}
			}else{
				const downloadedWasm = await request({
					url: ffmpegWasmUrl,
					respType: 'arraybuffer',
					onlyResponse: true
				});
				const wasmUrl = URL.createObjectURL(new Blob([downloadedWasm], { type: 'application/wasm' }));
				return wasmUrl;
			}
		};
		#getCore = async (ffmpegCoreUrl, useCache, version) => {
			if(useCache){
				const cachedCore = await getFromIndexedDB('FFmpegWasm', 'ffmpegCore', 522);
				if(cachedCore?.data && compareVersions(version, cachedCore?.version) === 0){
					const coreUrl = URL.createObjectURL(new Blob([cachedCore.data], { type: 'application/javascript' }));
					return coreUrl;
				}else{
					const downloadedCore = await request({
						url: ffmpegCoreUrl,
						respType: 'text',
						onlyResponse: true
					});
					const coreUrl = URL.createObjectURL(new Blob([downloadedCore], { type: 'application/javascript' }));
					await saveToIndexedDB('FFmpegWasm', 'ffmpegCore', {data: downloadedCore, version: version}, 522);
					return coreUrl;
				}
			}else{
				const downloadedCore = await request({
					url: ffmpegCoreUrl,
					respType: 'text',
					onlyResponse: true
				});
				const coreUrl = URL.createObjectURL(new Blob([downloadedCore], { type: 'application/javascript' }));
				return coreUrl;
			}
		};
		exec = (args, timeout = -1, { signal } = {}) => this.#send({
			type: "EXEC" /* EXEC */,
			data: { args, timeout }
		}, undefined, signal);
		ffprobe = (args, timeout = -1, { signal } = {}) => this.#send({
			type: "FFPROBE" /* FFPROBE */,
			data: { args, timeout }
		}, undefined, signal);
		terminate = () => {
			const ids = Object.keys(this.#rejects);
			for(const id of ids){
				this.#rejects[id](ERROR_TERMINATED);
				delete this.#rejects[id];
				delete this.#resolves[id];
			}
			if(this.#worker){
				this.#worker.terminate();
				this.#worker = null;
				this.loaded = false;
			}
		};
		writeFile = (path, data, { signal } = {}) => {
			const trans = [];
			if(data instanceof Uint8Array){
				trans.push(data.buffer);
			}
			return this.#send({
				type: "WRITE_FILE" /* WRITE_FILE */,
				data: { path, data }
			}, trans, signal);
		};
		mount = (fsType, options, mountPoint) => {
			const trans = [];
			return this.#send({
				type: "MOUNT" /* MOUNT */,
				data: { fsType, options, mountPoint }
			}, trans);
		};
		unmount = (mountPoint) => {
			const trans = [];
			return this.#send({
				type: "UNMOUNT" /* UNMOUNT */,
				data: { mountPoint }
			}, trans);
		};
		readFile = (path, encoding = "binary", { signal } = {}) => this.#send({
			type: "READ_FILE" /* READ_FILE */,
			data: { path, encoding }
		}, undefined, signal);
		deleteFile = (path, { signal } = {}) => this.#send({
			type: "DELETE_FILE" /* DELETE_FILE */,
			data: { path }
		}, undefined, signal);
		rename = (oldPath, newPath, { signal } = {}) => this.#send({
			type: "RENAME" /* RENAME */,
			data: { oldPath, newPath }
		}, undefined, signal);
		createDir = (path, { signal } = {}) => this.#send({
			type: "CREATE_DIR" /* CREATE_DIR */,
			data: { path }
		}, undefined, signal);
		listDir = (path, { signal } = {}) => this.#send({
			type: "LIST_DIR" /* LIST_DIR */,
			data: { path }
		}, undefined, signal);
		deleteDir = (path, { signal } = {}) => this.#send({
			type: "DELETE_DIR" /* DELETE_DIR */,
			data: { path }
		}, undefined, signal);
	}
	// src/types.ts
	var FFFSType;
	((FFFSType2) => {
		FFFSType2["MEMFS"] = "MEMFS";
		FFFSType2["NODEFS"] = "NODEFS";
		FFFSType2["NODERAWFS"] = "NODERAWFS";
		FFFSType2["IDBFS"] = "IDBFS";
		FFFSType2["WORKERFS"] = "WORKERFS";
		FFFSType2["PROXYFS"] = "PROXYFS";
	})(FFFSType ||= {});

	function compareVersions(version1, version2){
		// 同じなら0, v1が大きいなら1, v2が大きいなら-1
		if(version1 === version2)return 0;
		if(!version1)return -1;
		if(!version2)return 1;
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

	global.FFmpeg = FFmpeg;
	global.FFFSType = FFFSType;
})(this);
