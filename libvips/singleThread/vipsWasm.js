(function(global){
	'use strict';

	class VipsWasm {
		#initPromise = null;
		#api = null;
		#module = null;
		constructor({vipsJsUrl, wasmUrl, vipsApiUrl} = {}){
			this.vipsJsUrl = vipsJsUrl;
			this.wasmUrl = wasmUrl;
			this.vipsApiUrl = vipsApiUrl;
		}

		async init({wasmUrl = this.wasmUrl, vipsJsUrl = this.vipsJsUrl, vipsApiUrl = this.vipsApiUrl} = {}){
			if(this.#module)return this.#module;
			if(this.#initPromise)return this.#initPromise;
			this.#initPromise = (async()=>{
				if(typeof vipsJsUrl !== 'string'){
					throw new Error('vipsJsUrl must be a string');
				}
				if(typeof wasmUrl !== 'string'){
					throw new Error('wasmUrl must be a string');
				}
				if(wasmUrl.startsWith('data:')){
					const response = await fetch(wasmUrl);
					const arrayBuffer = await response.arrayBuffer();
					const blob = new Blob([arrayBuffer], { type: 'application/wasm' });
					const wasmBlobUrl = URL.createObjectURL(blob);
					sessionStorage.setItem('vipsWasm_wasmUrl', wasmBlobUrl);
				}else{
					sessionStorage.setItem('vipsWasm_wasmUrl', wasmUrl);
				}

				const vipsJs = await fetch(vipsJsUrl);
				const vipsJsBlobUrl = URL.createObjectURL(new Blob([await vipsJs.text()], { type: 'application/javascript' }));

				const vipsApi = await fetch(vipsApiUrl);
				const vipsApiBlob = new Blob([await vipsApi.text()], { type: 'application/javascript' });
                const vipsApiBlobUrl = URL.createObjectURL(vipsApiBlob);
				const vipsModule = await import(/* webpackIgnore: true */ vipsApiBlobUrl);
				this.#api = await vipsModule.default(vipsJsBlobUrl);
				this.#module = this.#api.init();
				return this.#module;
			})();
			return this.#initPromise;
		}
	}
	global.VipsWasm = VipsWasm;
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);