(function(global){
	'use strict';

	class VipsWasm {
		#initPromise = null;
		#module = null;
		constructor({vipsJsUrl, wasmUrl} = {}){
			this.vipsJsUrl = vipsJsUrl;
			this.wasmUrl = wasmUrl;
		}

		async init(vipsJsUrl = this.vipsJsUrl, wasmUrl = this.wasmUrl){
			if(this.#module)return this.#module;
			if(this.#initPromise)return this.#initPromise;
			this.#initPromise = (async()=>{
				if(typeof vipsJsUrl !== 'string'){
					throw new Error('vipsJsUrl must be a string');
				}
				if(typeof wasmUrl !== 'string'){
					throw new Error('wasmUrl must be a string');
				}
				sessionStorage.setItem('vipsWasm_wasmUrl', wasmUrl);
				sessionStorage.setItem('vipsWasm_jsUrl', vipsJsUrl);
				const vipsModule = await import(/* webpackIgnore: true */ vipsJsUrl);
				this.#module = await vipsModule.default();
				return this.#module;
			})();
			return this.#initPromise;
		}
	}
	global.VipsWasm = VipsWasm;
})(typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : this);