var createFFmpegCore = (() => {
	var _scriptName = typeof document != 'undefined' ? document.currentScript?.src : undefined;

	return (
		function(moduleArg = {}){
			var moduleRtn;

			var Module = moduleArg;
			var readyPromiseResolve, readyPromiseReject;
			var readyPromise = new Promise((resolve, reject) => {
				readyPromiseResolve = resolve;
				readyPromiseReject = reject
			});
			["_ffmpeg", "_abort", "_malloc", "_ffprobe", "_memory", "_ff_h264_cabac_tables", "___indirect_function_table", "onRuntimeInitialized"].forEach(prop => {
				if(!Object.getOwnPropertyDescriptor(readyPromise, prop)){
					Object.defineProperty(readyPromise, prop, {
						get: () => abort("You are getting " + prop + " on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js"),
						set: () => abort("You are setting " + prop + " on the Promise object, instead of the instance. Use .then() to get called back with the instance, see the MODULARIZE docs in src/settings.js")
					})
				}
			});
			var ENVIRONMENT_IS_WEB = typeof window == "object";
			var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
			var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string" && process.type != "renderer";
			var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
			const NULL = 0;
			const SIZE_I32 = Uint32Array.BYTES_PER_ELEMENT;
			const DEFAULT_ARGS = ["./ffmpeg", "-nostdin", "-y"];
			const DEFAULT_ARGS_FFPROBE = ["./ffprobe"];
			Module["NULL"] = NULL;
			Module["SIZE_I32"] = SIZE_I32;
			Module["DEFAULT_ARGS"] = DEFAULT_ARGS;
			Module["DEFAULT_ARGS_FFPROBE"] = DEFAULT_ARGS_FFPROBE;
			Module["ret"] = -1;
			Module["timeout"] = -1;
			Module["logger"] = () => {};
			Module["progress"] = () => {};

			function stringToPtr(str){
				const len = Module["lengthBytesUTF8"](str) + 1;
				const ptr = Module["_malloc"](len);
				Module["stringToUTF8"](str, ptr, len);
				return ptr
			}

			function stringsToPtr(strs){
				const len = strs.length;
				const ptr = Module["_malloc"](len * SIZE_I32);
				for(let i = 0; i < len; i++){
					Module["setValue"](ptr + SIZE_I32 * i, stringToPtr(strs[i]), "i32")
				}
				return ptr
			}

			function print(message){
				Module["logger"]({
					type: "stdout",
					message
				})
			}

			function printErr(message){
				if(!message.startsWith("Aborted(native code called abort())")) Module["logger"]({
					type: "stderr",
					message
				})
			}

			function exec(..._args){
				const args = [...Module["DEFAULT_ARGS"], ..._args];
				try{
					Module["_ffmpeg"](args.length, stringsToPtr(args))
				}catch(e){
					if(!e.message.startsWith("Aborted")){
						throw e
					}
				}
				return Module["ret"]
			}

			function ffprobe(..._args){
				const args = [...Module["DEFAULT_ARGS_FFPROBE"], ..._args];
				try{
					Module["_ffprobe"](args.length, stringsToPtr(args))
				}catch(e){
					if(!e.message.startsWith("Aborted")){
						throw e
					}
				}
				return Module["ret"]
			}

			function setLogger(logger){
				Module["logger"] = logger
			}

			function setTimeout(timeout){
				Module["timeout"] = timeout
			}

			function setProgress(handler){
				Module["progress"] = handler
			}

			function receiveProgress(progress, time){
				Module["progress"]({
					progress, time
				})
			}

			function reset(){
				Module["ret"] = -1;
				Module["timeout"] = -1
			}

			function _locateFile(path, prefix){
				const mainScriptUrlOrBlob = Module["mainScriptUrlOrBlob"];
				if(mainScriptUrlOrBlob){
					const {
						wasmURL, workerURL
					} = JSON.parse(atob(mainScriptUrlOrBlob));
					if(path.endsWith(".wasm")) return wasmURL;
					if(path.endsWith(".worker.js")) return workerURL
				}
				return prefix + path
			}
			Module["stringToPtr"] = stringToPtr;
			Module["stringsToPtr"] = stringsToPtr;
			Module["print"] = print;
			Module["printErr"] = printErr;
			Module["locateFile"] = _locateFile;
			Module["exec"] = exec;
			Module["ffprobe"] = ffprobe;
			Module["setLogger"] = setLogger;
			Module["setTimeout"] = setTimeout;
			Module["setProgress"] = setProgress;
			Module["reset"] = reset;
			Module["receiveProgress"] = receiveProgress;
			var moduleOverrides = Object.assign({}, Module);
			var arguments_ = [];
			var thisProgram = "./this.program";
			var quit_ = (status, toThrow) => {
				throw toThrow
			};
			var scriptDirectory = "";

			function locateFile(path){
				if(Module["locateFile"]){
					return Module["locateFile"](path, scriptDirectory)
				}
				return scriptDirectory + path
			}
			var readAsync, readBinary;
			if(ENVIRONMENT_IS_SHELL){
				if(typeof process == "object" && typeof require === "function" || typeof window == "object" || typeof importScripts == "function") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)")
			}else if(ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER){
				if(ENVIRONMENT_IS_WORKER){
					scriptDirectory = self.location.href
				}else if(typeof document != "undefined" && document.currentScript){
					scriptDirectory = document.currentScript.src
				}
				if(_scriptName){
					scriptDirectory = _scriptName
				}
				if(scriptDirectory.startsWith("blob:")){
					scriptDirectory = ""
				}else{
					scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1)
				}
				if(!(typeof window == "object" || typeof importScripts == "function")) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)"); {
					if(ENVIRONMENT_IS_WORKER){
						readBinary = url => {
							var xhr = new XMLHttpRequest;
							xhr.open("GET", url, false);
							xhr.responseType = "arraybuffer";
							xhr.send(null);
							return new Uint8Array(xhr.response)
						}
					}
					readAsync = url => {
						assert(!isFileURI(url), "readAsync does not work with file:// URLs");
						return fetch(url, {
							credentials: "same-origin"
						}).then(response => {
							if(response.ok){
								return response.arrayBuffer()
							}
							return Promise.reject(new Error(response.status + " : " + response.url))
						})
					}
				}
			}else{
				throw new Error("environment detection error")
			}
			var out = Module["print"] || console.log.bind(console);
			var err = Module["printErr"] || console.error.bind(console);
			Object.assign(Module, moduleOverrides);
			moduleOverrides = null;
			checkIncomingModuleAPI();
			if(Module["arguments"]) arguments_ = Module["arguments"];
			legacyModuleProp("arguments", "arguments_");
			if(Module["thisProgram"]) thisProgram = Module["thisProgram"];
			legacyModuleProp("thisProgram", "thisProgram");
			assert(typeof Module["memoryInitializerPrefixURL"] == "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");
			assert(typeof Module["pthreadMainPrefixURL"] == "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");
			assert(typeof Module["cdInitializerPrefixURL"] == "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");
			assert(typeof Module["filePackagePrefixURL"] == "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");
			assert(typeof Module["read"] == "undefined", "Module.read option was removed");
			assert(typeof Module["readAsync"] == "undefined", "Module.readAsync option was removed (modify readAsync in JS)");
			assert(typeof Module["readBinary"] == "undefined", "Module.readBinary option was removed (modify readBinary in JS)");
			assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");
			assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");
			legacyModuleProp("asm", "wasmExports");
			legacyModuleProp("readAsync", "readAsync");
			legacyModuleProp("readBinary", "readBinary");
			legacyModuleProp("setWindowTitle", "setWindowTitle");
			assert(!ENVIRONMENT_IS_NODE, "node environment detected but not enabled at build time.  Add `node` to `-sENVIRONMENT` to enable.");
			assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.");
			var wasmBinary = Module["wasmBinary"];
			legacyModuleProp("wasmBinary", "wasmBinary");
			if(typeof WebAssembly != "object"){
				err("no native wasm support detected")
			}
			var wasmMemory;
			var ABORT = false;
			var EXITSTATUS;

			function assert(condition, text){
				if(!condition){
					abort("Assertion failed" + (text ? ": " + text : ""))
				}
			}
			var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAP64, HEAPU64, HEAPF64;

			function updateMemoryViews(){
				var b = wasmMemory.buffer;
				Module["HEAP8"] = HEAP8 = new Int8Array(b);
				Module["HEAP16"] = HEAP16 = new Int16Array(b);
				Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
				Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
				Module["HEAP32"] = HEAP32 = new Int32Array(b);
				Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
				Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
				Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
				Module["HEAP64"] = HEAP64 = new BigInt64Array(b);
				Module["HEAPU64"] = HEAPU64 = new BigUint64Array(b)
			}
			assert(!Module["STACK_SIZE"], "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");
			assert(typeof Int32Array != "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined, "JS engine does not provide full typed array support");
			assert(!Module["wasmMemory"], "Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally");
			assert(!Module["INITIAL_MEMORY"], "Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically");

			function writeStackCookie(){
				var max = _emscripten_stack_get_end();
				assert((max & 3) == 0);
				if(max == 0){
					max += 4
				}
				HEAPU32[max >> 2] = 34821223;
				HEAPU32[max + 4 >> 2] = 2310721022;
				HEAPU32[0 >> 2] = 1668509029
			}

			function checkStackCookie(){
				if(ABORT) return;
				var max = _emscripten_stack_get_end();
				if(max == 0){
					max += 4
				}
				var cookie1 = HEAPU32[max >> 2];
				var cookie2 = HEAPU32[max + 4 >> 2];
				if(cookie1 != 34821223 || cookie2 != 2310721022){
					abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`)
				}
				if(HEAPU32[0 >> 2] != 1668509029){
					abort("Runtime error: The application has corrupted its heap memory area (address zero)!")
				}
			}
			var __ATPRERUN__ = [];
			var __ATINIT__ = [];
			var __ATPOSTRUN__ = [];
			var runtimeInitialized = false;

			function preRun(){
				var preRuns = Module["preRun"];
				if(preRuns){
					if(typeof preRuns == "function") preRuns = [preRuns];
					preRuns.forEach(addOnPreRun)
				}
				callRuntimeCallbacks(__ATPRERUN__)
			}

			function initRuntime(){
				assert(!runtimeInitialized);
				runtimeInitialized = true;
				checkStackCookie();
				if(!Module["noFSInit"] && !FS.initialized) FS.init();
				FS.ignorePermissions = false;
				TTY.init();
				callRuntimeCallbacks(__ATINIT__)
			}

			function postRun(){
				checkStackCookie();
				var postRuns = Module["postRun"];
				if(postRuns){
					if(typeof postRuns == "function") postRuns = [postRuns];
					postRuns.forEach(addOnPostRun)
				}
				callRuntimeCallbacks(__ATPOSTRUN__)
			}

			function addOnPreRun(cb){
				__ATPRERUN__.unshift(cb)
			}

			function addOnInit(cb){
				__ATINIT__.unshift(cb)
			}

			function addOnPostRun(cb){
				__ATPOSTRUN__.unshift(cb)
			}
			assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
			assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
			assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
			assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");
			var runDependencies = 0;
			var runDependencyWatcher = null;
			var dependenciesFulfilled = null;
			var runDependencyTracking = {};

			function getUniqueRunDependency(id){
				var orig = id;
				while(1){
					if(!runDependencyTracking[id]) return id;
					id = orig + Math.random()
				}
			}

			function addRunDependency(id){
				runDependencies++;
				Module["monitorRunDependencies"]?.(runDependencies);
				if(id){
					assert(!runDependencyTracking[id]);
					runDependencyTracking[id] = 1;
					if(runDependencyWatcher === null && typeof setInterval != "undefined"){
						runDependencyWatcher = setInterval(() => {
							if(ABORT){
								clearInterval(runDependencyWatcher);
								runDependencyWatcher = null;
								return
							}
							var shown = false;
							for(var dep in runDependencyTracking){
								if(!shown){
									shown = true;
									err("still waiting on run dependencies:")
								}
								err(`dependency: ${dep}`)
							}
							if(shown){
								err("(end of list)")
							}
						}, 1e4)
					}
				}else{
					err("warning: run dependency added without ID")
				}
			}

			function removeRunDependency(id){
				runDependencies--;
				Module["monitorRunDependencies"]?.(runDependencies);
				if(id){
					assert(runDependencyTracking[id]);
					delete runDependencyTracking[id]
				}else{
					err("warning: run dependency removed without ID")
				}
				if(runDependencies == 0){
					if(runDependencyWatcher !== null){
						clearInterval(runDependencyWatcher);
						runDependencyWatcher = null
					}
					if(dependenciesFulfilled){
						var callback = dependenciesFulfilled;
						dependenciesFulfilled = null;
						callback()
					}
				}
			}

			function abort(what){
				Module["onAbort"]?.(what);
				what = "Aborted(" + what + ")";
				err(what);
				ABORT = true;
				var e = new WebAssembly.RuntimeError(what);
				readyPromiseReject(e);
				throw e
			}
			var dataURIPrefix = "data:application/octet-stream;base64,";
			var isDataURI = filename => filename.startsWith(dataURIPrefix);
			var isFileURI = filename => filename.startsWith("file://");

			function createExportWrapper(name, nargs){
				return (...args) => {
					assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
					var f = wasmExports[name];
					assert(f, `exported native function \`${name}\` not found`);
					assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
					return f(...args)
				}
			}

			function findWasmBinary(){
				var f = "ffmpeg_g.wasm";
				if(!isDataURI(f)){
					return locateFile(f)
				}
				return f
			}
			var wasmBinaryFile;

			function getBinarySync(file){
				if(file == wasmBinaryFile && wasmBinary){
					return new Uint8Array(wasmBinary)
				}
				if(readBinary){
					return readBinary(file)
				}
				throw "both async and sync fetching of the wasm failed"
			}

			function getBinaryPromise(binaryFile){
				if(!wasmBinary){
					return readAsync(binaryFile).then(response => new Uint8Array(response), () => getBinarySync(binaryFile))
				}
				return Promise.resolve().then(() => getBinarySync(binaryFile))
			}

			function instantiateArrayBuffer(binaryFile, imports, receiver){
				return getBinaryPromise(binaryFile).then(binary => WebAssembly.instantiate(binary, imports)).then(receiver, reason => {
					err(`failed to asynchronously prepare wasm: ${reason}`);
					if(isFileURI(wasmBinaryFile)){
						err(`warning: Loading from a file URI (${wasmBinaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`)
					}
					abort(reason)
				})
			}

			function instantiateAsync(binary, binaryFile, imports, callback){
				if(!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && typeof fetch == "function"){
					return fetch(binaryFile, {
						credentials: "same-origin"
					}).then(response => {
						var result = WebAssembly.instantiateStreaming(response, imports);
						return result.then(callback, function(reason){
							err(`wasm streaming compile failed: ${reason}`);
							err("falling back to ArrayBuffer instantiation");
							return instantiateArrayBuffer(binaryFile, imports, callback)
						})
					})
				}
				return instantiateArrayBuffer(binaryFile, imports, callback)
			}

			function getWasmImports(){
				return {
					env: wasmImports,
					wasi_snapshot_preview1: wasmImports
				}
			}

			function createWasm(){
				var info = getWasmImports();

				function receiveInstance(instance, module){
					wasmExports = instance.exports;
					wasmMemory = wasmExports["memory"];
					assert(wasmMemory, "memory not found in wasm exports");
					updateMemoryViews();
					wasmTable = wasmExports["__indirect_function_table"];
					assert(wasmTable, "table not found in wasm exports");
					addOnInit(wasmExports["__wasm_call_ctors"]);
					removeRunDependency("wasm-instantiate");
					return wasmExports
				}
				addRunDependency("wasm-instantiate");
				var trueModule = Module;

				function receiveInstantiationResult(result){
					assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
					trueModule = null;
					receiveInstance(result["instance"])
				}
				if(Module["instantiateWasm"]){
					try{
						return Module["instantiateWasm"](info, receiveInstance)
					}catch(e){
						err(`Module.instantiateWasm callback failed with error: ${e}`);
						readyPromiseReject(e)
					}
				}
				wasmBinaryFile??=findWasmBinary();
				instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult).catch(readyPromiseReject);
				return {}
			}(() => {
				var h16 = new Int16Array(1);
				var h8 = new Int8Array(h16.buffer);
				h16[0] = 25459;
				if(h8[0] !== 115 || h8[1] !== 99) throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)"
			})();
			if(Module["ENVIRONMENT"]){
				throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)")
			}

			function legacyModuleProp(prop, newName, incoming = true){
				if(!Object.getOwnPropertyDescriptor(Module, prop)){
					Object.defineProperty(Module, prop, {
						configurable: true,
						get(){
							let extra = incoming ? " (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)" : "";
							abort(`\`Module.${prop}\` has been replaced by \`${newName}\`` + extra)
						}
					})
				}
			}

			function ignoredModuleProp(prop){
				if(Object.getOwnPropertyDescriptor(Module, prop)){
					abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`)
				}
			}

			function isExportedByForceFilesystem(name){
				return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_unlink" || name === "addRunDependency" || name === "FS_createLazyFile" || name === "FS_createDevice" || name === "removeRunDependency"
			}

			function hookGlobalSymbolAccess(sym, func){}

			function missingGlobal(sym, msg){
				hookGlobalSymbolAccess(sym, () => {
					warnOnce(`\`${sym}\` is not longer defined by emscripten. ${msg}`)
				})
			}
			missingGlobal("buffer", "Please use HEAP8.buffer or wasmMemory.buffer");
			missingGlobal("asm", "Please use wasmExports instead");

			function missingLibrarySymbol(sym){
				hookGlobalSymbolAccess(sym, () => {
					var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
					var librarySymbol = sym;
					if(!librarySymbol.startsWith("_")){
						librarySymbol = "$" + sym
					}
					msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
					if(isExportedByForceFilesystem(sym)){
						msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you"
					}
					warnOnce(msg)
				});
				unexportedRuntimeSymbol(sym)
			}

			function unexportedRuntimeSymbol(sym){
				if(!Object.getOwnPropertyDescriptor(Module, sym)){
					Object.defineProperty(Module, sym, {
						configurable: true,
						get(){
							var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
							if(isExportedByForceFilesystem(sym)){
								msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you"
							}
							abort(msg)
						}
					})
				}
			}

			function ExitStatus(status){
				this.name = "ExitStatus";
				this.message = `Program terminated with exit(${status})`;
				this.status = status
			}
			var callRuntimeCallbacks = callbacks => {
				callbacks.forEach(f => f(Module))
			};

			function getValue(ptr, type = "i8"){
				if(type.endsWith("*")) type = "*";
				switch (type){
					case "i1":
						return HEAP8[ptr];
					case "i8":
						return HEAP8[ptr];
					case "i16":
						return HEAP16[ptr >> 1];
					case "i32":
						return HEAP32[ptr >> 2];
					case "i64":
						return HEAP64[ptr >> 3];
					case "float":
						return HEAPF32[ptr >> 2];
					case "double":
						return HEAPF64[ptr >> 3];
					case "*":
						return HEAPU32[ptr >> 2];
					default:
						abort(`invalid type for getValue: ${type}`)
				}
			}
			var noExitRuntime = Module["noExitRuntime"] || true;
			var ptrToString = ptr => {
				assert(typeof ptr === "number");
				ptr >>>= 0;
				return "0x" + ptr.toString(16).padStart(8, "0")
			};

			function setValue(ptr, value, type = "i8"){
				if(type.endsWith("*")) type = "*";
				switch (type){
					case "i1":
						HEAP8[ptr] = value;
						break;
					case "i8":
						HEAP8[ptr] = value;
						break;
					case "i16":
						HEAP16[ptr >> 1] = value;
						break;
					case "i32":
						HEAP32[ptr >> 2] = value;
						break;
					case "i64":
						HEAP64[ptr >> 3] = BigInt(value);
						break;
					case "float":
						HEAPF32[ptr >> 2] = value;
						break;
					case "double":
						HEAPF64[ptr >> 3] = value;
						break;
					case "*":
						HEAPU32[ptr >> 2] = value;
						break;
					default:
						abort(`invalid type for setValue: ${type}`)
				}
			}
			var stackRestore = val => __emscripten_stack_restore(val);
			var stackSave = () => _emscripten_stack_get_current();
			var warnOnce = text => {
				warnOnce.shown ||= {};
				if(!warnOnce.shown[text]){
					warnOnce.shown[text] = 1;
					err(text)
				}
			};
			var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder : undefined;
			var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead = NaN) => {
				var endIdx = idx + maxBytesToRead;
				var endPtr = idx;
				while(heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
				if(endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder){
					return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))
				}
				var str = "";
				while(idx < endPtr){
					var u0 = heapOrArray[idx++];
					if(!(u0 & 128)){
						str += String.fromCharCode(u0);
						continue
					}
					var u1 = heapOrArray[idx++] & 63;
					if((u0 & 224) == 192){
						str += String.fromCharCode((u0 & 31) << 6 | u1);
						continue
					}
					var u2 = heapOrArray[idx++] & 63;
					if((u0 & 240) == 224){
						u0 = (u0 & 15) << 12 | u1 << 6 | u2
					}else{
						if((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte " + ptrToString(u0) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!");
						u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63
					}
					if(u0 < 65536){
						str += String.fromCharCode(u0)
					}else{
						var ch = u0 - 65536;
						str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
					}
				}
				return str
			};
			var UTF8ToString = (ptr, maxBytesToRead) => {
				assert(typeof ptr == "number", `UTF8ToString expects a number (got ${typeof ptr})`);
				return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
			};
			var ___assert_fail = (condition, filename, line, func) => {
				abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"])
			};
			var wasmTableMirror = [];
			var wasmTable;
			var getWasmTableEntry = funcPtr => {
				var func = wasmTableMirror[funcPtr];
				if(!func){
					if(funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
					wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr)
				}
				assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
				return func
			};
			var ___call_sighandler = (fp, sig) => getWasmTableEntry(fp)(sig);
			var PATH = {
				isAbs: path => path.charAt(0) === "/",
				splitPath: filename => {
					var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
					return splitPathRe.exec(filename).slice(1)
				},
				normalizeArray: (parts, allowAboveRoot) => {
					var up = 0;
					for(var i = parts.length - 1; i >= 0; i--){
						var last = parts[i];
						if(last === "."){
							parts.splice(i, 1)
						}else if(last === ".."){
							parts.splice(i, 1);
							up++
						}else if(up){
							parts.splice(i, 1);
							up--
						}
					}
					if(allowAboveRoot){
						for(; up; up--){
							parts.unshift("..")
						}
					}
					return parts
				},
				normalize: path => {
					var isAbsolute = PATH.isAbs(path),
						trailingSlash = path.substr(-1) === "/";
					path = PATH.normalizeArray(path.split("/").filter(p => !!p), !isAbsolute).join("/");
					if(!path && !isAbsolute){
						path = "."
					}
					if(path && trailingSlash){
						path += "/"
					}
					return (isAbsolute ? "/" : "") + path
				},
				dirname: path => {
					var result = PATH.splitPath(path),
						root = result[0],
						dir = result[1];
					if(!root && !dir){
						return "."
					}
					if(dir){
						dir = dir.substr(0, dir.length - 1)
					}
					return root + dir
				},
				basename: path => {
					if(path === "/") return "/";
					path = PATH.normalize(path);
					path = path.replace(/\/$/, "");
					var lastSlash = path.lastIndexOf("/");
					if(lastSlash === -1) return path;
					return path.substr(lastSlash + 1)
				},
				join: (...paths) => PATH.normalize(paths.join("/")),
				join2: (l, r) => PATH.normalize(l + "/" + r)
			};
			var initRandomFill = () => {
				if(typeof crypto == "object" && typeof crypto["getRandomValues"] == "function"){
					return view => crypto.getRandomValues(view)
				}else abort("no cryptographic support found for randomDevice. consider polyfilling it if you want to use something insecure like Math.random(), e.g. put this in a --pre-js: var crypto = { getRandomValues: (array) => { for(var i = 0; i < array.length; i++) array[i] = (Math.random()*256)|0 } };")
			};
			var randomFill = view => (randomFill = initRandomFill())(view);
			var PATH_FS = {
				resolve: (...args) => {
					var resolvedPath = "",
						resolvedAbsolute = false;
					for(var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--){
						var path = i >= 0 ? args[i] : FS.cwd();
						if(typeof path != "string"){
							throw new TypeError("Arguments to path.resolve must be strings")
						}else if(!path){
							return ""
						}
						resolvedPath = path + "/" + resolvedPath;
						resolvedAbsolute = PATH.isAbs(path)
					}
					resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(p => !!p), !resolvedAbsolute).join("/");
					return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
				},
				relative: (from, to) => {
					from = PATH_FS.resolve(from).substr(1);
					to = PATH_FS.resolve(to).substr(1);

					function trim(arr){
						var start = 0;
						for(; start < arr.length; start++){
							if(arr[start] !== "") break
						}
						var end = arr.length - 1;
						for(; end >= 0; end--){
							if(arr[end] !== "") break
						}
						if(start > end) return [];
						return arr.slice(start, end - start + 1)
					}
					var fromParts = trim(from.split("/"));
					var toParts = trim(to.split("/"));
					var length = Math.min(fromParts.length, toParts.length);
					var samePartsLength = length;
					for(var i = 0; i < length; i++){
						if(fromParts[i] !== toParts[i]){
							samePartsLength = i;
							break
						}
					}
					var outputParts = [];
					for(var i = samePartsLength; i < fromParts.length; i++){
						outputParts.push("..")
					}
					outputParts = outputParts.concat(toParts.slice(samePartsLength));
					return outputParts.join("/")
				}
			};
			var FS_stdin_getChar_buffer = [];
			var lengthBytesUTF8 = str => {
				var len = 0;
				for(var i = 0; i < str.length; ++i){
					var c = str.charCodeAt(i);
					if(c <= 127){
						len++
					}else if(c <= 2047){
						len += 2
					}else if(c >= 55296 && c <= 57343){
						len += 4;
						++i
					}else{
						len += 3
					}
				}
				return len
			};
			var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
				assert(typeof str === "string", `stringToUTF8Array expects a string (got ${typeof str})`);
				if(!(maxBytesToWrite > 0)) return 0;
				var startIdx = outIdx;
				var endIdx = outIdx + maxBytesToWrite - 1;
				for(var i = 0; i < str.length; ++i){
					var u = str.charCodeAt(i);
					if(u >= 55296 && u <= 57343){
						var u1 = str.charCodeAt(++i);
						u = 65536 + ((u & 1023) << 10) | u1 & 1023
					}
					if(u <= 127){
						if(outIdx >= endIdx) break;
						heap[outIdx++] = u
					}else if(u <= 2047){
						if(outIdx + 1 >= endIdx) break;
						heap[outIdx++] = 192 | u >> 6;
						heap[outIdx++] = 128 | u & 63
					}else if(u <= 65535){
						if(outIdx + 2 >= endIdx) break;
						heap[outIdx++] = 224 | u >> 12;
						heap[outIdx++] = 128 | u >> 6 & 63;
						heap[outIdx++] = 128 | u & 63
					}else{
						if(outIdx + 3 >= endIdx) break;
						if(u > 1114111) warnOnce("Invalid Unicode code point " + ptrToString(u) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).");
						heap[outIdx++] = 240 | u >> 18;
						heap[outIdx++] = 128 | u >> 12 & 63;
						heap[outIdx++] = 128 | u >> 6 & 63;
						heap[outIdx++] = 128 | u & 63
					}
				}
				heap[outIdx] = 0;
				return outIdx - startIdx
			};

			function intArrayFromString(stringy, dontAddNull, length){
				var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
				var u8array = new Array(len);
				var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
				if(dontAddNull) u8array.length = numBytesWritten;
				return u8array
			}
			var FS_stdin_getChar = () => {
				if(!FS_stdin_getChar_buffer.length){
					var result = null;
					if(typeof window != "undefined" && typeof window.prompt == "function"){
						result = window.prompt("Input: ");
						if(result !== null){
							result += "\n"
						}
					}else{}
					if(!result){
						return null
					}
					FS_stdin_getChar_buffer = intArrayFromString(result, true)
				}
				return FS_stdin_getChar_buffer.shift()
			};
			var TTY = {
				ttys: [],
				init(){},
				shutdown(){},
				register(dev, ops){
					TTY.ttys[dev] = {
						input: [],
						output: [],
						ops
					};
					FS.registerDevice(dev, TTY.stream_ops)
				},
				stream_ops: {
					open(stream){
						var tty = TTY.ttys[stream.node.rdev];
						if(!tty){
							throw new FS.ErrnoError(43)
						}
						stream.tty = tty;
						stream.seekable = false
					}, close(stream){
						stream.tty.ops.fsync(stream.tty)
					}, fsync(stream){
						stream.tty.ops.fsync(stream.tty)
					}, read(stream, buffer, offset, length, pos){
						if(!stream.tty || !stream.tty.ops.get_char){
							throw new FS.ErrnoError(60)
						}
						var bytesRead = 0;
						for(var i = 0; i < length; i++){
							var result;
							try{
								result = stream.tty.ops.get_char(stream.tty)
							}catch(e){
								throw new FS.ErrnoError(29)
							}
							if(result === undefined && bytesRead === 0){
								throw new FS.ErrnoError(6)
							}
							if(result === null || result === undefined) break;
							bytesRead++;
							buffer[offset + i] = result
						}
						if(bytesRead){
							stream.node.timestamp = Date.now()
						}
						return bytesRead
					}, write(stream, buffer, offset, length, pos){
						if(!stream.tty || !stream.tty.ops.put_char){
							throw new FS.ErrnoError(60)
						}
						try{
							for(var i = 0; i < length; i++){
								stream.tty.ops.put_char(stream.tty, buffer[offset + i])
							}
						}catch(e){
							throw new FS.ErrnoError(29)
						}
						if(length){
							stream.node.timestamp = Date.now()
						}
						return i
					}
				},
				default_tty_ops: {
					get_char(tty){
						return FS_stdin_getChar()
					}, put_char(tty, val){
						if(val === null || val === 10){
							out(UTF8ArrayToString(tty.output));
							tty.output = []
						}else{
							if(val != 0) tty.output.push(val)
						}
					}, fsync(tty){
						if(tty.output && tty.output.length > 0){
							out(UTF8ArrayToString(tty.output));
							tty.output = []
						}
					}, ioctl_tcgets(tty){
						return {
							c_iflag: 25856,
							c_oflag: 5,
							c_cflag: 191,
							c_lflag: 35387,
							c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
						}
					}, ioctl_tcsets(tty, optional_actions, data){
						return 0
					}, ioctl_tiocgwinsz(tty){
						return [24, 80]
					}
				},
				default_tty1_ops: {
					put_char(tty, val){
						if(val === null || val === 10){
							err(UTF8ArrayToString(tty.output));
							tty.output = []
						}else{
							if(val != 0) tty.output.push(val)
						}
					}, fsync(tty){
						if(tty.output && tty.output.length > 0){
							err(UTF8ArrayToString(tty.output));
							tty.output = []
						}
					}
				}
			};
			var zeroMemory = (address, size) => {
				HEAPU8.fill(0, address, address + size)
			};
			var alignMemory = (size, alignment) => {
				assert(alignment, "alignment argument is required");
				return Math.ceil(size / alignment) * alignment
			};
			var mmapAlloc = size => {
				size = alignMemory(size, 65536);
				var ptr = _emscripten_builtin_memalign(65536, size);
				if(ptr) zeroMemory(ptr, size);
				return ptr
			};
			var MEMFS = {
				ops_table: null,
				mount(mount){
					return MEMFS.createNode(null, "/", 16384 | 511, 0)
				},
				createNode(parent, name, mode, dev){
					if(FS.isBlkdev(mode) || FS.isFIFO(mode)){
						throw new FS.ErrnoError(63)
					}
					MEMFS.ops_table ||= {
						dir: {
							node: {
								getattr: MEMFS.node_ops.getattr,
								setattr: MEMFS.node_ops.setattr,
								lookup: MEMFS.node_ops.lookup,
								mknod: MEMFS.node_ops.mknod,
								rename: MEMFS.node_ops.rename,
								unlink: MEMFS.node_ops.unlink,
								rmdir: MEMFS.node_ops.rmdir,
								readdir: MEMFS.node_ops.readdir,
								symlink: MEMFS.node_ops.symlink
							},
							stream: {
								llseek: MEMFS.stream_ops.llseek
							}
						},
						file: {
							node: {
								getattr: MEMFS.node_ops.getattr,
								setattr: MEMFS.node_ops.setattr
							},
							stream: {
								llseek: MEMFS.stream_ops.llseek,
								read: MEMFS.stream_ops.read,
								write: MEMFS.stream_ops.write,
								allocate: MEMFS.stream_ops.allocate,
								mmap: MEMFS.stream_ops.mmap,
								msync: MEMFS.stream_ops.msync
							}
						},
						link: {
							node: {
								getattr: MEMFS.node_ops.getattr,
								setattr: MEMFS.node_ops.setattr,
								readlink: MEMFS.node_ops.readlink
							},
							stream: {}
						},
						chrdev: {
							node: {
								getattr: MEMFS.node_ops.getattr,
								setattr: MEMFS.node_ops.setattr
							},
							stream: FS.chrdev_stream_ops
						}
					};
					var node = FS.createNode(parent, name, mode, dev);
					if(FS.isDir(node.mode)){
						node.node_ops = MEMFS.ops_table.dir.node;
						node.stream_ops = MEMFS.ops_table.dir.stream;
						node.contents = {}
					}else if(FS.isFile(node.mode)){
						node.node_ops = MEMFS.ops_table.file.node;
						node.stream_ops = MEMFS.ops_table.file.stream;
						node.usedBytes = 0;
						node.contents = null
					}else if(FS.isLink(node.mode)){
						node.node_ops = MEMFS.ops_table.link.node;
						node.stream_ops = MEMFS.ops_table.link.stream
					}else if(FS.isChrdev(node.mode)){
						node.node_ops = MEMFS.ops_table.chrdev.node;
						node.stream_ops = MEMFS.ops_table.chrdev.stream
					}
					node.timestamp = Date.now();
					if(parent){
						parent.contents[name] = node;
						parent.timestamp = node.timestamp
					}
					return node
				},
				getFileDataAsTypedArray(node){
					if(!node.contents) return new Uint8Array(0);
					if(node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
					return new Uint8Array(node.contents)
				},
				expandFileStorage(node, newCapacity){
					var prevCapacity = node.contents ? node.contents.length : 0;
					if(prevCapacity >= newCapacity) return;
					var CAPACITY_DOUBLING_MAX = 1024 * 1024;
					newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
					if(prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
					var oldContents = node.contents;
					node.contents = new Uint8Array(newCapacity);
					if(node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0)
				},
				resizeFileStorage(node, newSize){
					if(node.usedBytes == newSize) return;
					if(newSize == 0){
						node.contents = null;
						node.usedBytes = 0
					}else{
						var oldContents = node.contents;
						node.contents = new Uint8Array(newSize);
						if(oldContents){
							node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
						}
						node.usedBytes = newSize
					}
				},
				node_ops: {
					getattr(node){
						var attr = {};
						attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
						attr.ino = node.id;
						attr.mode = node.mode;
						attr.nlink = 1;
						attr.uid = 0;
						attr.gid = 0;
						attr.rdev = node.rdev;
						if(FS.isDir(node.mode)){
							attr.size = 4096
						}else if(FS.isFile(node.mode)){
							attr.size = node.usedBytes
						}else if(FS.isLink(node.mode)){
							attr.size = node.link.length
						}else{
							attr.size = 0
						}
						attr.atime = new Date(node.timestamp);
						attr.mtime = new Date(node.timestamp);
						attr.ctime = new Date(node.timestamp);
						attr.blksize = 4096;
						attr.blocks = Math.ceil(attr.size / attr.blksize);
						return attr
					}, setattr(node, attr){
						if(attr.mode !== undefined){
							node.mode = attr.mode
						}
						if(attr.timestamp !== undefined){
							node.timestamp = attr.timestamp
						}
						if(attr.size !== undefined){
							MEMFS.resizeFileStorage(node, attr.size)
						}
					}, lookup(parent, name){
						throw FS.genericErrors[44]
					}, mknod(parent, name, mode, dev){
						return MEMFS.createNode(parent, name, mode, dev)
					}, rename(old_node, new_dir, new_name){
						if(FS.isDir(old_node.mode)){
							var new_node;
							try{
								new_node = FS.lookupNode(new_dir, new_name)
							}catch(e){}
							if(new_node){
								for(var i in new_node.contents){
									throw new FS.ErrnoError(55)
								}
							}
						}
						delete old_node.parent.contents[old_node.name];
						old_node.parent.timestamp = Date.now();
						old_node.name = new_name;
						new_dir.contents[new_name] = old_node;
						new_dir.timestamp = old_node.parent.timestamp
					}, unlink(parent, name){
						delete parent.contents[name];
						parent.timestamp = Date.now()
					}, rmdir(parent, name){
						var node = FS.lookupNode(parent, name);
						for(var i in node.contents){
							throw new FS.ErrnoError(55)
						}
						delete parent.contents[name];
						parent.timestamp = Date.now()
					}, readdir(node){
						var entries = [".", ".."];
						for(var key of Object.keys(node.contents)){
							entries.push(key)
						}
						return entries
					}, symlink(parent, newname, oldpath){
						var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
						node.link = oldpath;
						return node
					}, readlink(node){
						if(!FS.isLink(node.mode)){
							throw new FS.ErrnoError(28)
						}
						return node.link
					}
				},
				stream_ops: {
					read(stream, buffer, offset, length, position){
						var contents = stream.node.contents;
						if(position >= stream.node.usedBytes) return 0;
						var size = Math.min(stream.node.usedBytes - position, length);
						assert(size >= 0);
						if(size > 8 && contents.subarray){
							buffer.set(contents.subarray(position, position + size), offset)
						}else{
							for(var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
						}
						return size
					}, write(stream, buffer, offset, length, position, canOwn){
						assert(!(buffer instanceof ArrayBuffer));
						if(buffer.buffer === HEAP8.buffer){
							canOwn = false
						}
						if(!length) return 0;
						var node = stream.node;
						node.timestamp = Date.now();
						if(buffer.subarray && (!node.contents || node.contents.subarray)){
							if(canOwn){
								assert(position === 0, "canOwn must imply no weird position inside the file");
								node.contents = buffer.subarray(offset, offset + length);
								node.usedBytes = length;
								return length
							}else if(node.usedBytes === 0 && position === 0){
								node.contents = buffer.slice(offset, offset + length);
								node.usedBytes = length;
								return length
							}else if(position + length <= node.usedBytes){
								node.contents.set(buffer.subarray(offset, offset + length), position);
								return length
							}
						}
						MEMFS.expandFileStorage(node, position + length);
						if(node.contents.subarray && buffer.subarray){
							node.contents.set(buffer.subarray(offset, offset + length), position)
						}else{
							for(var i = 0; i < length; i++){
								node.contents[position + i] = buffer[offset + i]
							}
						}
						node.usedBytes = Math.max(node.usedBytes, position + length);
						return length
					}, llseek(stream, offset, whence){
						var position = offset;
						if(whence === 1){
							position += stream.position
						}else if(whence === 2){
							if(FS.isFile(stream.node.mode)){
								position += stream.node.usedBytes
							}
						}
						if(position < 0){
							throw new FS.ErrnoError(28)
						}
						return position
					}, allocate(stream, offset, length){
						MEMFS.expandFileStorage(stream.node, offset + length);
						stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
					}, mmap(stream, length, position, prot, flags){
						if(!FS.isFile(stream.node.mode)){
							throw new FS.ErrnoError(43)
						}
						var ptr;
						var allocated;
						var contents = stream.node.contents;
						if(!(flags & 2) && contents && contents.buffer === HEAP8.buffer){
							allocated = false;
							ptr = contents.byteOffset
						}else{
							allocated = true;
							ptr = mmapAlloc(length);
							if(!ptr){
								throw new FS.ErrnoError(48)
							}
							if(contents){
								if(position > 0 || position + length < contents.length){
									if(contents.subarray){
										contents = contents.subarray(position, position + length)
									}else{
										contents = Array.prototype.slice.call(contents, position, position + length)
									}
								}
								HEAP8.set(contents, ptr)
							}
						}
						return {
							ptr, allocated
						}
					}, msync(stream, buffer, offset, length, mmapFlags){
						MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
						return 0
					}
				}
			};
			var asyncLoad = (url, onload, onerror, noRunDep) => {
				var dep = !noRunDep ? getUniqueRunDependency(`al ${url}`) : "";
				readAsync(url).then(arrayBuffer => {
					assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
					onload(new Uint8Array(arrayBuffer));
					if(dep) removeRunDependency(dep)
				}, err => {
					if(onerror){
						onerror()
					}else{
						throw `Loading data file "${url}" failed.`
					}
				});
				if(dep) addRunDependency(dep)
			};
			var FS_createDataFile = (parent, name, fileData, canRead, canWrite, canOwn) => {
				FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn)
			};
			var preloadPlugins = Module["preloadPlugins"] || [];
			var FS_handledByPreloadPlugin = (byteArray, fullname, finish, onerror) => {
				if(typeof Browser != "undefined") Browser.init();
				var handled = false;
				preloadPlugins.forEach(plugin => {
					if(handled) return;
					if(plugin["canHandle"](fullname)){
						plugin["handle"](byteArray, fullname, finish, onerror);
						handled = true
					}
				});
				return handled
			};
			var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
				var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
				var dep = getUniqueRunDependency(`cp ${fullname}`);

				function processData(byteArray){
					function finish(byteArray){
						preFinish?.();
						if(!dontCreateFile){
							FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
						}
						onload?.();
						removeRunDependency(dep)
					}
					if(FS_handledByPreloadPlugin(byteArray, fullname, finish, () => {
							onerror?.();
							removeRunDependency(dep)
						})){
						return
					}
					finish(byteArray)
				}
				addRunDependency(dep);
				if(typeof url == "string"){
					asyncLoad(url, processData, onerror)
				}else{
					processData(url)
				}
			};
			var FS_modeStringToFlags = str => {
				var flagModes = {
					r: 0,
					"r+": 2,
					w: 512 | 64 | 1,
					"w+": 512 | 64 | 2,
					a: 1024 | 64 | 1,
					"a+": 1024 | 64 | 2
				};
				var flags = flagModes[str];
				if(typeof flags == "undefined"){
					throw new Error(`Unknown file open mode: ${str}`)
				}
				return flags
			};
			var FS_getMode = (canRead, canWrite) => {
				var mode = 0;
				if(canRead) mode |= 292 | 73;
				if(canWrite) mode |= 146;
				return mode
			};
			var strError = errno => UTF8ToString(_strerror(errno));
			var ERRNO_CODES = {
				EPERM: 63,
				ENOENT: 44,
				ESRCH: 71,
				EINTR: 27,
				EIO: 29,
				ENXIO: 60,
				E2BIG: 1,
				ENOEXEC: 45,
				EBADF: 8,
				ECHILD: 12,
				EAGAIN: 6,
				EWOULDBLOCK: 6,
				ENOMEM: 48,
				EACCES: 2,
				EFAULT: 21,
				ENOTBLK: 105,
				EBUSY: 10,
				EEXIST: 20,
				EXDEV: 75,
				ENODEV: 43,
				ENOTDIR: 54,
				EISDIR: 31,
				EINVAL: 28,
				ENFILE: 41,
				EMFILE: 33,
				ENOTTY: 59,
				ETXTBSY: 74,
				EFBIG: 22,
				ENOSPC: 51,
				ESPIPE: 70,
				EROFS: 69,
				EMLINK: 34,
				EPIPE: 64,
				EDOM: 18,
				ERANGE: 68,
				ENOMSG: 49,
				EIDRM: 24,
				ECHRNG: 106,
				EL2NSYNC: 156,
				EL3HLT: 107,
				EL3RST: 108,
				ELNRNG: 109,
				EUNATCH: 110,
				ENOCSI: 111,
				EL2HLT: 112,
				EDEADLK: 16,
				ENOLCK: 46,
				EBADE: 113,
				EBADR: 114,
				EXFULL: 115,
				ENOANO: 104,
				EBADRQC: 103,
				EBADSLT: 102,
				EDEADLOCK: 16,
				EBFONT: 101,
				ENOSTR: 100,
				ENODATA: 116,
				ETIME: 117,
				ENOSR: 118,
				ENONET: 119,
				ENOPKG: 120,
				EREMOTE: 121,
				ENOLINK: 47,
				EADV: 122,
				ESRMNT: 123,
				ECOMM: 124,
				EPROTO: 65,
				EMULTIHOP: 36,
				EDOTDOT: 125,
				EBADMSG: 9,
				ENOTUNIQ: 126,
				EBADFD: 127,
				EREMCHG: 128,
				ELIBACC: 129,
				ELIBBAD: 130,
				ELIBSCN: 131,
				ELIBMAX: 132,
				ELIBEXEC: 133,
				ENOSYS: 52,
				ENOTEMPTY: 55,
				ENAMETOOLONG: 37,
				ELOOP: 32,
				EOPNOTSUPP: 138,
				EPFNOSUPPORT: 139,
				ECONNRESET: 15,
				ENOBUFS: 42,
				EAFNOSUPPORT: 5,
				EPROTOTYPE: 67,
				ENOTSOCK: 57,
				ENOPROTOOPT: 50,
				ESHUTDOWN: 140,
				ECONNREFUSED: 14,
				EADDRINUSE: 3,
				ECONNABORTED: 13,
				ENETUNREACH: 40,
				ENETDOWN: 38,
				ETIMEDOUT: 73,
				EHOSTDOWN: 142,
				EHOSTUNREACH: 23,
				EINPROGRESS: 26,
				EALREADY: 7,
				EDESTADDRREQ: 17,
				EMSGSIZE: 35,
				EPROTONOSUPPORT: 66,
				ESOCKTNOSUPPORT: 137,
				EADDRNOTAVAIL: 4,
				ENETRESET: 39,
				EISCONN: 30,
				ENOTCONN: 53,
				ETOOMANYREFS: 141,
				EUSERS: 136,
				EDQUOT: 19,
				ESTALE: 72,
				ENOTSUP: 138,
				ENOMEDIUM: 148,
				EILSEQ: 25,
				EOVERFLOW: 61,
				ECANCELED: 11,
				ENOTRECOVERABLE: 56,
				EOWNERDEAD: 62,
				ESTRPIPE: 135
			};
			var FS = {
				root: null,
				mounts: [],
				devices: {},
				streams: [],
				nextInode: 1,
				nameTable: null,
				currentPath: "/",
				initialized: false,
				ignorePermissions: true,
				ErrnoError: class extends Error {
					constructor(errno){
						super(runtimeInitialized ? strError(errno) : "");
						this.name = "ErrnoError";
						this.errno = errno;
						for(var key in ERRNO_CODES){
							if(ERRNO_CODES[key] === errno){
								this.code = key;
								break
							}
						}
					}
				},
				genericErrors: {},
				filesystems: null,
				syncFSRequests: 0,
				readFiles: {},
				FSStream: class {
					constructor(){
						this.shared = {}
					}
					get object(){
						return this.node
					}
					set object(val){
						this.node = val
					}
					get isRead(){
						return (this.flags & 2097155) !== 1
					}
					get isWrite(){
						return (this.flags & 2097155) !== 0
					}
					get isAppend(){
						return this.flags & 1024
					}
					get flags(){
						return this.shared.flags
					}
					set flags(val){
						this.shared.flags = val
					}
					get position(){
						return this.shared.position
					}
					set position(val){
						this.shared.position = val
					}
				},
				FSNode: class {
					constructor(parent, name, mode, rdev){
						if(!parent){
							parent = this
						}
						this.parent = parent;
						this.mount = parent.mount;
						this.mounted = null;
						this.id = FS.nextInode++;
						this.name = name;
						this.mode = mode;
						this.node_ops = {};
						this.stream_ops = {};
						this.rdev = rdev;
						this.readMode = 292 | 73;
						this.writeMode = 146
					}
					get read(){
						return (this.mode & this.readMode) === this.readMode
					}
					set read(val){
						val ? this.mode |= this.readMode : this.mode &= ~this.readMode
					}
					get write(){
						return (this.mode & this.writeMode) === this.writeMode
					}
					set write(val){
						val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode
					}
					get isFolder(){
						return FS.isDir(this.mode)
					}
					get isDevice(){
						return FS.isChrdev(this.mode)
					}
				},
				lookupPath(path, opts = {}){
					path = PATH_FS.resolve(path);
					if(!path) return {
						path: "",
						node: null
					};
					var defaults = {
						follow_mount: true,
						recurse_count: 0
					};
					opts = Object.assign(defaults, opts);
					if(opts.recurse_count > 8){
						throw new FS.ErrnoError(32)
					}
					var parts = path.split("/").filter(p => !!p);
					var current = FS.root;
					var current_path = "/";
					for(var i = 0; i < parts.length; i++){
						var islast = i === parts.length - 1;
						if(islast && opts.parent){
							break
						}
						current = FS.lookupNode(current, parts[i]);
						current_path = PATH.join2(current_path, parts[i]);
						if(FS.isMountpoint(current)){
							if(!islast || islast && opts.follow_mount){
								current = current.mounted.root
							}
						}
						if(!islast || opts.follow){
							var count = 0;
							while(FS.isLink(current.mode)){
								var link = FS.readlink(current_path);
								current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
								var lookup = FS.lookupPath(current_path, {
									recurse_count: opts.recurse_count + 1
								});
								current = lookup.node;
								if(count++ > 40){
									throw new FS.ErrnoError(32)
								}
							}
						}
					}
					return {
						path: current_path,
						node: current
					}
				},
				getPath(node){
					var path;
					while(true){
						if(FS.isRoot(node)){
							var mount = node.mount.mountpoint;
							if(!path) return mount;
							return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path
						}
						path = path ? `${node.name}/${path}` : node.name;
						node = node.parent
					}
				},
				hashName(parentid, name){
					var hash = 0;
					for(var i = 0; i < name.length; i++){
						hash = (hash << 5) - hash + name.charCodeAt(i) | 0
					}
					return (parentid + hash >>> 0) % FS.nameTable.length
				},
				hashAddNode(node){
					var hash = FS.hashName(node.parent.id, node.name);
					node.name_next = FS.nameTable[hash];
					FS.nameTable[hash] = node
				},
				hashRemoveNode(node){
					var hash = FS.hashName(node.parent.id, node.name);
					if(FS.nameTable[hash] === node){
						FS.nameTable[hash] = node.name_next
					}else{
						var current = FS.nameTable[hash];
						while(current){
							if(current.name_next === node){
								current.name_next = node.name_next;
								break
							}
							current = current.name_next
						}
					}
				},
				lookupNode(parent, name){
					var errCode = FS.mayLookup(parent);
					if(errCode){
						throw new FS.ErrnoError(errCode)
					}
					var hash = FS.hashName(parent.id, name);
					for(var node = FS.nameTable[hash]; node; node = node.name_next){
						var nodeName = node.name;
						if(node.parent.id === parent.id && nodeName === name){
							return node
						}
					}
					return FS.lookup(parent, name)
				},
				createNode(parent, name, mode, rdev){
					assert(typeof parent == "object");
					var node = new FS.FSNode(parent, name, mode, rdev);
					FS.hashAddNode(node);
					return node
				},
				destroyNode(node){
					FS.hashRemoveNode(node)
				},
				isRoot(node){
					return node === node.parent
				},
				isMountpoint(node){
					return !!node.mounted
				},
				isFile(mode){
					return (mode & 61440) === 32768
				},
				isDir(mode){
					return (mode & 61440) === 16384
				},
				isLink(mode){
					return (mode & 61440) === 40960
				},
				isChrdev(mode){
					return (mode & 61440) === 8192
				},
				isBlkdev(mode){
					return (mode & 61440) === 24576
				},
				isFIFO(mode){
					return (mode & 61440) === 4096
				},
				isSocket(mode){
					return (mode & 49152) === 49152
				},
				flagsToPermissionString(flag){
					var perms = ["r", "w", "rw"][flag & 3];
					if(flag & 512){
						perms += "w"
					}
					return perms
				},
				nodePermissions(node, perms){
					if(FS.ignorePermissions){
						return 0
					}
					if(perms.includes("r") && !(node.mode & 292)){
						return 2
					}else if(perms.includes("w") && !(node.mode & 146)){
						return 2
					}else if(perms.includes("x") && !(node.mode & 73)){
						return 2
					}
					return 0
				},
				mayLookup(dir){
					if(!FS.isDir(dir.mode)) return 54;
					var errCode = FS.nodePermissions(dir, "x");
					if(errCode) return errCode;
					if(!dir.node_ops.lookup) return 2;
					return 0
				},
				mayCreate(dir, name){
					try{
						var node = FS.lookupNode(dir, name);
						return 20
					}catch(e){}
					return FS.nodePermissions(dir, "wx")
				},
				mayDelete(dir, name, isdir){
					var node;
					try{
						node = FS.lookupNode(dir, name)
					}catch(e){
						return e.errno
					}
					var errCode = FS.nodePermissions(dir, "wx");
					if(errCode){
						return errCode
					}
					if(isdir){
						if(!FS.isDir(node.mode)){
							return 54
						}
						if(FS.isRoot(node) || FS.getPath(node) === FS.cwd()){
							return 10
						}
					}else{
						if(FS.isDir(node.mode)){
							return 31
						}
					}
					return 0
				},
				mayOpen(node, flags){
					if(!node){
						return 44
					}
					if(FS.isLink(node.mode)){
						return 32
					}else if(FS.isDir(node.mode)){
						if(FS.flagsToPermissionString(flags) !== "r" || flags & 512){
							return 31
						}
					}
					return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
				},
				MAX_OPEN_FDS: 4096,
				nextfd(){
					for(var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++){
						if(!FS.streams[fd]){
							return fd
						}
					}
					throw new FS.ErrnoError(33)
				},
				getStreamChecked(fd){
					var stream = FS.getStream(fd);
					if(!stream){
						throw new FS.ErrnoError(8)
					}
					return stream
				},
				getStream: fd => FS.streams[fd],
				createStream(stream, fd = -1){
					assert(fd >= -1);
					stream = Object.assign(new FS.FSStream, stream);
					if(fd == -1){
						fd = FS.nextfd()
					}
					stream.fd = fd;
					FS.streams[fd] = stream;
					return stream
				},
				closeStream(fd){
					FS.streams[fd] = null
				},
				dupStream(origStream, fd = -1){
					var stream = FS.createStream(origStream, fd);
					stream.stream_ops?.dup?.(stream);
					return stream
				},
				chrdev_stream_ops: {
					open(stream){
						var device = FS.getDevice(stream.node.rdev);
						stream.stream_ops = device.stream_ops;
						stream.stream_ops.open?.(stream)
					}, llseek(){
						throw new FS.ErrnoError(70)
					}
				},
				major: dev => dev >> 8,
				minor: dev => dev & 255,
				makedev: (ma, mi) => ma << 8 | mi,
				registerDevice(dev, ops){
					FS.devices[dev] = {
						stream_ops: ops
					}
				},
				getDevice: dev => FS.devices[dev],
				getMounts(mount){
					var mounts = [];
					var check = [mount];
					while(check.length){
						var m = check.pop();
						mounts.push(m);
						check.push(...m.mounts)
					}
					return mounts
				},
				syncfs(populate, callback){
					if(typeof populate == "function"){
						callback = populate;
						populate = false
					}
					FS.syncFSRequests++;
					if(FS.syncFSRequests > 1){
						err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`)
					}
					var mounts = FS.getMounts(FS.root.mount);
					var completed = 0;

					function doCallback(errCode){
						assert(FS.syncFSRequests > 0);
						FS.syncFSRequests--;
						return callback(errCode)
					}

					function done(errCode){
						if(errCode){
							if(!done.errored){
								done.errored = true;
								return doCallback(errCode)
							}
							return
						}
						if(++completed >= mounts.length){
							doCallback(null)
						}
					}
					mounts.forEach(mount => {
						if(!mount.type.syncfs){
							return done(null)
						}
						mount.type.syncfs(mount, populate, done)
					})
				},
				mount(type, opts, mountpoint){
					if(typeof type == "string"){
						throw type
					}
					var root = mountpoint === "/";
					var pseudo = !mountpoint;
					var node;
					if(root && FS.root){
						throw new FS.ErrnoError(10)
					}else if(!root && !pseudo){
						var lookup = FS.lookupPath(mountpoint, {
							follow_mount: false
						});
						mountpoint = lookup.path;
						node = lookup.node;
						if(FS.isMountpoint(node)){
							throw new FS.ErrnoError(10)
						}
						if(!FS.isDir(node.mode)){
							throw new FS.ErrnoError(54)
						}
					}
					var mount = {
						type, opts, mountpoint, mounts: []
					};
					var mountRoot = type.mount(mount);
					mountRoot.mount = mount;
					mount.root = mountRoot;
					if(root){
						FS.root = mountRoot
					}else if(node){
						node.mounted = mount;
						if(node.mount){
							node.mount.mounts.push(mount)
						}
					}
					return mountRoot
				},
				unmount(mountpoint){
					var lookup = FS.lookupPath(mountpoint, {
						follow_mount: false
					});
					if(!FS.isMountpoint(lookup.node)){
						throw new FS.ErrnoError(28)
					}
					var node = lookup.node;
					var mount = node.mounted;
					var mounts = FS.getMounts(mount);
					Object.keys(FS.nameTable).forEach(hash => {
						var current = FS.nameTable[hash];
						while(current){
							var next = current.name_next;
							if(mounts.includes(current.mount)){
								FS.destroyNode(current)
							}
							current = next
						}
					});
					node.mounted = null;
					var idx = node.mount.mounts.indexOf(mount);
					assert(idx !== -1);
					node.mount.mounts.splice(idx, 1)
				},
				lookup(parent, name){
					return parent.node_ops.lookup(parent, name)
				},
				mknod(path, mode, dev){
					var lookup = FS.lookupPath(path, {
						parent: true
					});
					var parent = lookup.node;
					var name = PATH.basename(path);
					if(!name || name === "." || name === ".."){
						throw new FS.ErrnoError(28)
					}
					var errCode = FS.mayCreate(parent, name);
					if(errCode){
						throw new FS.ErrnoError(errCode)
					}
					if(!parent.node_ops.mknod){
						throw new FS.ErrnoError(63)
					}
					return parent.node_ops.mknod(parent, name, mode, dev)
				},
				create(path, mode){
					mode = mode !== undefined ? mode : 438;
					mode &= 4095;
					mode |= 32768;
					return FS.mknod(path, mode, 0)
				},
				mkdir(path, mode){
					mode = mode !== undefined ? mode : 511;
					mode &= 511 | 512;
					mode |= 16384;
					return FS.mknod(path, mode, 0)
				},
				mkdirTree(path, mode){
					var dirs = path.split("/");
					var d = "";
					for(var i = 0; i < dirs.length; ++i){
						if(!dirs[i]) continue;
						d += "/" + dirs[i];
						try{
							FS.mkdir(d, mode)
						}catch(e){
							if(e.errno != 20) throw e
						}
					}
				},
				mkdev(path, mode, dev){
					if(typeof dev == "undefined"){
						dev = mode;
						mode = 438
					}
					mode |= 8192;
					return FS.mknod(path, mode, dev)
				},
				symlink(oldpath, newpath){
					if(!PATH_FS.resolve(oldpath)){
						throw new FS.ErrnoError(44)
					}
					var lookup = FS.lookupPath(newpath, {
						parent: true
					});
					var parent = lookup.node;
					if(!parent){
						throw new FS.ErrnoError(44)
					}
					var newname = PATH.basename(newpath);
					var errCode = FS.mayCreate(parent, newname);
					if(errCode){
						throw new FS.ErrnoError(errCode)
					}
					if(!parent.node_ops.symlink){
						throw new FS.ErrnoError(63)
					}
					return parent.node_ops.symlink(parent, newname, oldpath)
				},
				rename(old_path, new_path){
					var old_dirname = PATH.dirname(old_path);
					var new_dirname = PATH.dirname(new_path);
					var old_name = PATH.basename(old_path);
					var new_name = PATH.basename(new_path);
					var lookup, old_dir, new_dir;
					lookup = FS.lookupPath(old_path, {
						parent: true
					});
					old_dir = lookup.node;
					lookup = FS.lookupPath(new_path, {
						parent: true
					});
					new_dir = lookup.node;
					if(!old_dir || !new_dir) throw new FS.ErrnoError(44);
					if(old_dir.mount !== new_dir.mount){
						throw new FS.ErrnoError(75)
					}
					var old_node = FS.lookupNode(old_dir, old_name);
					var relative = PATH_FS.relative(old_path, new_dirname);
					if(relative.charAt(0) !== "."){
						throw new FS.ErrnoError(28)
					}
					relative = PATH_FS.relative(new_path, old_dirname);
					if(relative.charAt(0) !== "."){
						throw new FS.ErrnoError(55)
					}
					var new_node;
					try{
						new_node = FS.lookupNode(new_dir, new_name)
					}catch(e){}
					if(old_node === new_node){
						return
					}
					var isdir = FS.isDir(old_node.mode);
					var errCode = FS.mayDelete(old_dir, old_name, isdir);
					if(errCode){
						throw new FS.ErrnoError(errCode)
					}
					errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
					if(errCode){
						throw new FS.ErrnoError(errCode)
					}
					if(!old_dir.node_ops.rename){
						throw new FS.ErrnoError(63)
					}
					if(FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)){
						throw new FS.ErrnoError(10)
					}
					if(new_dir !== old_dir){
						errCode = FS.nodePermissions(old_dir, "w");
						if(errCode){
							throw new FS.ErrnoError(errCode)
						}
					}
					FS.hashRemoveNode(old_node);
					try{
						old_dir.node_ops.rename(old_node, new_dir, new_name);
						old_node.parent = new_dir
					}catch(e){
						throw e
					} finally {
						FS.hashAddNode(old_node)
					}
				},
				rmdir(path){
					var lookup = FS.lookupPath(path, {
						parent: true
					});
					var parent = lookup.node;
					var name = PATH.basename(path);
					var node = FS.lookupNode(parent, name);
					var errCode = FS.mayDelete(parent, name, true);
					if(errCode){
						throw new FS.ErrnoError(errCode)
					}
					if(!parent.node_ops.rmdir){
						throw new FS.ErrnoError(63)
					}
					if(FS.isMountpoint(node)){
						throw new FS.ErrnoError(10)
					}
					parent.node_ops.rmdir(parent, name);
					FS.destroyNode(node)
				},
				readdir(path){
					var lookup = FS.lookupPath(path, {
						follow: true
					});
					var node = lookup.node;
					if(!node.node_ops.readdir){
						throw new FS.ErrnoError(54)
					}
					return node.node_ops.readdir(node)
				},
				unlink(path){
					var lookup = FS.lookupPath(path, {
						parent: true
					});
					var parent = lookup.node;
					if(!parent){
						throw new FS.ErrnoError(44)
					}
					var name = PATH.basename(path);
					var node = FS.lookupNode(parent, name);
					var errCode = FS.mayDelete(parent, name, false);
					if(errCode){
						throw new FS.ErrnoError(errCode)
					}
					if(!parent.node_ops.unlink){
						throw new FS.ErrnoError(63)
					}
					if(FS.isMountpoint(node)){
						throw new FS.ErrnoError(10)
					}
					parent.node_ops.unlink(parent, name);
					FS.destroyNode(node)
				},
				readlink(path){
					var lookup = FS.lookupPath(path);
					var link = lookup.node;
					if(!link){
						throw new FS.ErrnoError(44)
					}
					if(!link.node_ops.readlink){
						throw new FS.ErrnoError(28)
					}
					return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
				},
				stat(path, dontFollow){
					var lookup = FS.lookupPath(path, {
						follow: !dontFollow
					});
					var node = lookup.node;
					if(!node){
						throw new FS.ErrnoError(44)
					}
					if(!node.node_ops.getattr){
						throw new FS.ErrnoError(63)
					}
					return node.node_ops.getattr(node)
				},
				lstat(path){
					return FS.stat(path, true)
				},
				chmod(path, mode, dontFollow){
					var node;
					if(typeof path == "string"){
						var lookup = FS.lookupPath(path, {
							follow: !dontFollow
						});
						node = lookup.node
					}else{
						node = path
					}
					if(!node.node_ops.setattr){
						throw new FS.ErrnoError(63)
					}
					node.node_ops.setattr(node, {
						mode: mode & 4095 | node.mode & ~4095,
						timestamp: Date.now()
					})
				},
				lchmod(path, mode){
					FS.chmod(path, mode, true)
				},
				fchmod(fd, mode){
					var stream = FS.getStreamChecked(fd);
					FS.chmod(stream.node, mode)
				},
				chown(path, uid, gid, dontFollow){
					var node;
					if(typeof path == "string"){
						var lookup = FS.lookupPath(path, {
							follow: !dontFollow
						});
						node = lookup.node
					}else{
						node = path
					}
					if(!node.node_ops.setattr){
						throw new FS.ErrnoError(63)
					}
					node.node_ops.setattr(node, {
						timestamp: Date.now()
					})
				},
				lchown(path, uid, gid){
					FS.chown(path, uid, gid, true)
				},
				fchown(fd, uid, gid){
					var stream = FS.getStreamChecked(fd);
					FS.chown(stream.node, uid, gid)
				},
				truncate(path, len){
					if(len < 0){
						throw new FS.ErrnoError(28)
					}
					var node;
					if(typeof path == "string"){
						var lookup = FS.lookupPath(path, {
							follow: true
						});
						node = lookup.node
					}else{
						node = path
					}
					if(!node.node_ops.setattr){
						throw new FS.ErrnoError(63)
					}
					if(FS.isDir(node.mode)){
						throw new FS.ErrnoError(31)
					}
					if(!FS.isFile(node.mode)){
						throw new FS.ErrnoError(28)
					}
					var errCode = FS.nodePermissions(node, "w");
					if(errCode){
						throw new FS.ErrnoError(errCode)
					}
					node.node_ops.setattr(node, {
						size: len,
						timestamp: Date.now()
					})
				},
				ftruncate(fd, len){
					var stream = FS.getStreamChecked(fd);
					if((stream.flags & 2097155) === 0){
						throw new FS.ErrnoError(28)
					}
					FS.truncate(stream.node, len)
				},
				utime(path, atime, mtime){
					var lookup = FS.lookupPath(path, {
						follow: true
					});
					var node = lookup.node;
					node.node_ops.setattr(node, {
						timestamp: Math.max(atime, mtime)
					})
				},
				open(path, flags, mode){
					if(path === ""){
						throw new FS.ErrnoError(44)
					}
					flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
					if(flags & 64){
						mode = typeof mode == "undefined" ? 438 : mode;
						mode = mode & 4095 | 32768
					}else{
						mode = 0
					}
					var node;
					if(typeof path == "object"){
						node = path
					}else{
						path = PATH.normalize(path);
						try{
							var lookup = FS.lookupPath(path, {
								follow: !(flags & 131072)
							});
							node = lookup.node
						}catch(e){}
					}
					var created = false;
					if(flags & 64){
						if(node){
							if(flags & 128){
								throw new FS.ErrnoError(20)
							}
						}else{
							node = FS.mknod(path, mode, 0);
							created = true
						}
					}
					if(!node){
						throw new FS.ErrnoError(44)
					}
					if(FS.isChrdev(node.mode)){
						flags &= ~512
					}
					if(flags & 65536 && !FS.isDir(node.mode)){
						throw new FS.ErrnoError(54)
					}
					if(!created){
						var errCode = FS.mayOpen(node, flags);
						if(errCode){
							throw new FS.ErrnoError(errCode)
						}
					}
					if(flags & 512 && !created){
						FS.truncate(node, 0)
					}
					flags &= ~(128 | 512 | 131072);
					var stream = FS.createStream({
						node, path: FS.getPath(node), flags, seekable: true, position: 0, stream_ops: node.stream_ops, ungotten: [], error: false
					});
					if(stream.stream_ops.open){
						stream.stream_ops.open(stream)
					}
					if(Module["logReadFiles"] && !(flags & 1)){
						if(!(path in FS.readFiles)){
							FS.readFiles[path] = 1
						}
					}
					return stream
				},
				close(stream){
					if(FS.isClosed(stream)){
						throw new FS.ErrnoError(8)
					}
					if(stream.getdents) stream.getdents = null;
					try{
						if(stream.stream_ops.close){
							stream.stream_ops.close(stream)
						}
					}catch(e){
						throw e
					} finally {
						FS.closeStream(stream.fd)
					}
					stream.fd = null
				},
				isClosed(stream){
					return stream.fd === null
				},
				llseek(stream, offset, whence){
					if(FS.isClosed(stream)){
						throw new FS.ErrnoError(8)
					}
					if(!stream.seekable || !stream.stream_ops.llseek){
						throw new FS.ErrnoError(70)
					}
					if(whence != 0 && whence != 1 && whence != 2){
						throw new FS.ErrnoError(28)
					}
					stream.position = stream.stream_ops.llseek(stream, offset, whence);
					stream.ungotten = [];
					return stream.position
				},
				read(stream, buffer, offset, length, position){
					assert(offset >= 0);
					if(length < 0 || position < 0){
						throw new FS.ErrnoError(28)
					}
					if(FS.isClosed(stream)){
						throw new FS.ErrnoError(8)
					}
					if((stream.flags & 2097155) === 1){
						throw new FS.ErrnoError(8)
					}
					if(FS.isDir(stream.node.mode)){
						throw new FS.ErrnoError(31)
					}
					if(!stream.stream_ops.read){
						throw new FS.ErrnoError(28)
					}
					var seeking = typeof position != "undefined";
					if(!seeking){
						position = stream.position
					}else if(!stream.seekable){
						throw new FS.ErrnoError(70)
					}
					var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
					if(!seeking) stream.position += bytesRead;
					return bytesRead
				},
				write(stream, buffer, offset, length, position, canOwn){
					assert(offset >= 0);
					if(length < 0 || position < 0){
						throw new FS.ErrnoError(28)
					}
					if(FS.isClosed(stream)){
						throw new FS.ErrnoError(8)
					}
					if((stream.flags & 2097155) === 0){
						throw new FS.ErrnoError(8)
					}
					if(FS.isDir(stream.node.mode)){
						throw new FS.ErrnoError(31)
					}
					if(!stream.stream_ops.write){
						throw new FS.ErrnoError(28)
					}
					if(stream.seekable && stream.flags & 1024){
						FS.llseek(stream, 0, 2)
					}
					var seeking = typeof position != "undefined";
					if(!seeking){
						position = stream.position
					}else if(!stream.seekable){
						throw new FS.ErrnoError(70)
					}
					var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
					if(!seeking) stream.position += bytesWritten;
					return bytesWritten
				},
				allocate(stream, offset, length){
					if(FS.isClosed(stream)){
						throw new FS.ErrnoError(8)
					}
					if(offset < 0 || length <= 0){
						throw new FS.ErrnoError(28)
					}
					if((stream.flags & 2097155) === 0){
						throw new FS.ErrnoError(8)
					}
					if(!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)){
						throw new FS.ErrnoError(43)
					}
					if(!stream.stream_ops.allocate){
						throw new FS.ErrnoError(138)
					}
					stream.stream_ops.allocate(stream, offset, length)
				},
				mmap(stream, length, position, prot, flags){
					if((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2){
						throw new FS.ErrnoError(2)
					}
					if((stream.flags & 2097155) === 1){
						throw new FS.ErrnoError(2)
					}
					if(!stream.stream_ops.mmap){
						throw new FS.ErrnoError(43)
					}
					if(!length){
						throw new FS.ErrnoError(28)
					}
					return stream.stream_ops.mmap(stream, length, position, prot, flags)
				},
				msync(stream, buffer, offset, length, mmapFlags){
					assert(offset >= 0);
					if(!stream.stream_ops.msync){
						return 0
					}
					return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
				},
				ioctl(stream, cmd, arg){
					if(!stream.stream_ops.ioctl){
						throw new FS.ErrnoError(59)
					}
					return stream.stream_ops.ioctl(stream, cmd, arg)
				},
				readFile(path, opts = {}){
					opts.flags = opts.flags || 0;
					opts.encoding = opts.encoding || "binary";
					if(opts.encoding !== "utf8" && opts.encoding !== "binary"){
						throw new Error(`Invalid encoding type "${opts.encoding}"`)
					}
					var ret;
					var stream = FS.open(path, opts.flags);
					var stat = FS.stat(path);
					var length = stat.size;
					var buf = new Uint8Array(length);
					FS.read(stream, buf, 0, length, 0);
					if(opts.encoding === "utf8"){
						ret = UTF8ArrayToString(buf)
					}else if(opts.encoding === "binary"){
						ret = buf
					}
					FS.close(stream);
					return ret
				},
				writeFile(path, data, opts = {}){
					opts.flags = opts.flags || 577;
					var stream = FS.open(path, opts.flags, opts.mode);
					if(typeof data == "string"){
						var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
						var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
						FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
					}else if(ArrayBuffer.isView(data)){
						FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
					}else{
						throw new Error("Unsupported data type")
					}
					FS.close(stream)
				},
				cwd: () => FS.currentPath,
				chdir(path){
					var lookup = FS.lookupPath(path, {
						follow: true
					});
					if(lookup.node === null){
						throw new FS.ErrnoError(44)
					}
					if(!FS.isDir(lookup.node.mode)){
						throw new FS.ErrnoError(54)
					}
					var errCode = FS.nodePermissions(lookup.node, "x");
					if(errCode){
						throw new FS.ErrnoError(errCode)
					}
					FS.currentPath = lookup.path
				},
				createDefaultDirectories(){
					FS.mkdir("/tmp");
					FS.mkdir("/home");
					FS.mkdir("/home/web_user")
				},
				createDefaultDevices(){
					FS.mkdir("/dev");
					FS.registerDevice(FS.makedev(1, 3), {
						read: () => 0,
						write: (stream, buffer, offset, length, pos) => length
					});
					FS.mkdev("/dev/null", FS.makedev(1, 3));
					TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
					TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
					FS.mkdev("/dev/tty", FS.makedev(5, 0));
					FS.mkdev("/dev/tty1", FS.makedev(6, 0));
					var randomBuffer = new Uint8Array(1024),
						randomLeft = 0;
					var randomByte = () => {
						if(randomLeft === 0){
							randomLeft = randomFill(randomBuffer).byteLength
						}
						return randomBuffer[--randomLeft]
					};
					FS.createDevice("/dev", "random", randomByte);
					FS.createDevice("/dev", "urandom", randomByte);
					FS.mkdir("/dev/shm");
					FS.mkdir("/dev/shm/tmp")
				},
				createSpecialDirectories(){
					FS.mkdir("/proc");
					var proc_self = FS.mkdir("/proc/self");
					FS.mkdir("/proc/self/fd");
					FS.mount({
						mount(){
							var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
							node.node_ops = {
								lookup(parent, name){
									var fd = +name;
									var stream = FS.getStreamChecked(fd);
									var ret = {
										parent: null,
										mount: {
											mountpoint: "fake"
										},
										node_ops: {
											readlink: () => stream.path
										}
									};
									ret.parent = ret;
									return ret
								}
							};
							return node
						}
					}, {}, "/proc/self/fd")
				},
				createStandardStreams(input, output, error){
					if(input){
						FS.createDevice("/dev", "stdin", input)
					}else{
						FS.symlink("/dev/tty", "/dev/stdin")
					}
					if(output){
						FS.createDevice("/dev", "stdout", null, output)
					}else{
						FS.symlink("/dev/tty", "/dev/stdout")
					}
					if(error){
						FS.createDevice("/dev", "stderr", null, error)
					}else{
						FS.symlink("/dev/tty1", "/dev/stderr")
					}
					var stdin = FS.open("/dev/stdin", 0);
					var stdout = FS.open("/dev/stdout", 1);
					var stderr = FS.open("/dev/stderr", 1);
					assert(stdin.fd === 0, `invalid handle for stdin (${stdin.fd})`);
					assert(stdout.fd === 1, `invalid handle for stdout (${stdout.fd})`);
					assert(stderr.fd === 2, `invalid handle for stderr (${stderr.fd})`)
				},
				staticInit(){
					[44].forEach(code => {
						FS.genericErrors[code] = new FS.ErrnoError(code);
						FS.genericErrors[code].stack = "<generic error, no stack>"
					});
					FS.nameTable = new Array(4096);
					FS.mount(MEMFS, {}, "/");
					FS.createDefaultDirectories();
					FS.createDefaultDevices();
					FS.createSpecialDirectories();
					FS.filesystems = {
						MEMFS
					}
				},
				init(input, output, error){
					assert(!FS.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
					FS.initialized = true;
					input??=Module["stdin"];
					output??=Module["stdout"];
					error??=Module["stderr"];
					FS.createStandardStreams(input, output, error)
				},
				quit(){
					FS.initialized = false;
					_fflush(0);
					for(var i = 0; i < FS.streams.length; i++){
						var stream = FS.streams[i];
						if(!stream){
							continue
						}
						FS.close(stream)
					}
				},
				findObject(path, dontResolveLastLink){
					var ret = FS.analyzePath(path, dontResolveLastLink);
					if(!ret.exists){
						return null
					}
					return ret.object
				},
				analyzePath(path, dontResolveLastLink){
					try{
						var lookup = FS.lookupPath(path, {
							follow: !dontResolveLastLink
						});
						path = lookup.path
					}catch(e){}
					var ret = {
						isRoot: false,
						exists: false,
						error: 0,
						name: null,
						path: null,
						object: null,
						parentExists: false,
						parentPath: null,
						parentObject: null
					};
					try{
						var lookup = FS.lookupPath(path, {
							parent: true
						});
						ret.parentExists = true;
						ret.parentPath = lookup.path;
						ret.parentObject = lookup.node;
						ret.name = PATH.basename(path);
						lookup = FS.lookupPath(path, {
							follow: !dontResolveLastLink
						});
						ret.exists = true;
						ret.path = lookup.path;
						ret.object = lookup.node;
						ret.name = lookup.node.name;
						ret.isRoot = lookup.path === "/"
					}catch(e){
						ret.error = e.errno
					}
					return ret
				},
				createPath(parent, path, canRead, canWrite){
					parent = typeof parent == "string" ? parent : FS.getPath(parent);
					var parts = path.split("/").reverse();
					while(parts.length){
						var part = parts.pop();
						if(!part) continue;
						var current = PATH.join2(parent, part);
						try{
							FS.mkdir(current)
						}catch(e){}
						parent = current
					}
					return current
				},
				createFile(parent, name, properties, canRead, canWrite){
					var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
					var mode = FS_getMode(canRead, canWrite);
					return FS.create(path, mode)
				},
				createDataFile(parent, name, data, canRead, canWrite, canOwn){
					var path = name;
					if(parent){
						parent = typeof parent == "string" ? parent : FS.getPath(parent);
						path = name ? PATH.join2(parent, name) : parent
					}
					var mode = FS_getMode(canRead, canWrite);
					var node = FS.create(path, mode);
					if(data){
						if(typeof data == "string"){
							var arr = new Array(data.length);
							for(var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
							data = arr
						}
						FS.chmod(node, mode | 146);
						var stream = FS.open(node, 577);
						FS.write(stream, data, 0, data.length, 0, canOwn);
						FS.close(stream);
						FS.chmod(node, mode)
					}
				},
				createDevice(parent, name, input, output){
					var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
					var mode = FS_getMode(!!input, !!output);
					FS.createDevice.major??=64;
					var dev = FS.makedev(FS.createDevice.major++, 0);
					FS.registerDevice(dev, {
						open(stream){
							stream.seekable = false
						}, close(stream){
							if(output?.buffer?.length){
								output(10)
							}
						}, read(stream, buffer, offset, length, pos){
							var bytesRead = 0;
							for(var i = 0; i < length; i++){
								var result;
								try{
									result = input()
								}catch(e){
									throw new FS.ErrnoError(29)
								}
								if(result === undefined && bytesRead === 0){
									throw new FS.ErrnoError(6)
								}
								if(result === null || result === undefined) break;
								bytesRead++;
								buffer[offset + i] = result
							}
							if(bytesRead){
								stream.node.timestamp = Date.now()
							}
							return bytesRead
						}, write(stream, buffer, offset, length, pos){
							for(var i = 0; i < length; i++){
								try{
									output(buffer[offset + i])
								}catch(e){
									throw new FS.ErrnoError(29)
								}
							}
							if(length){
								stream.node.timestamp = Date.now()
							}
							return i
						}
					});
					return FS.mkdev(path, mode, dev)
				},
				forceLoadFile(obj){
					if(obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
					if(typeof XMLHttpRequest != "undefined"){
						throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
					}else{
						try{
							obj.contents = readBinary(obj.url);
							obj.usedBytes = obj.contents.length
						}catch(e){
							throw new FS.ErrnoError(29)
						}
					}
				},
				createLazyFile(parent, name, url, canRead, canWrite){
					class LazyUint8Array {
						constructor(){
							this.lengthKnown = false;
							this.chunks = []
						}
						get(idx){
							if(idx > this.length - 1 || idx < 0){
								return undefined
							}
							var chunkOffset = idx % this.chunkSize;
							var chunkNum = idx / this.chunkSize | 0;
							return this.getter(chunkNum)[chunkOffset]
						}
						setDataGetter(getter){
							this.getter = getter
						}
						cacheLength(){
							var xhr = new XMLHttpRequest;
							xhr.open("HEAD", url, false);
							xhr.send(null);
							if(!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
							var datalength = Number(xhr.getResponseHeader("Content-length"));
							var header;
							var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
							var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
							var chunkSize = 1024 * 1024;
							if(!hasByteServing) chunkSize = datalength;
							var doXHR = (from, to) => {
								if(from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
								if(to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
								var xhr = new XMLHttpRequest;
								xhr.open("GET", url, false);
								if(datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
								xhr.responseType = "arraybuffer";
								if(xhr.overrideMimeType){
									xhr.overrideMimeType("text/plain; charset=x-user-defined")
								}
								xhr.send(null);
								if(!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
								if(xhr.response !== undefined){
									return new Uint8Array(xhr.response || [])
								}
								return intArrayFromString(xhr.responseText || "", true)
							};
							var lazyArray = this;
							lazyArray.setDataGetter(chunkNum => {
								var start = chunkNum * chunkSize;
								var end = (chunkNum + 1) * chunkSize - 1;
								end = Math.min(end, datalength - 1);
								if(typeof lazyArray.chunks[chunkNum] == "undefined"){
									lazyArray.chunks[chunkNum] = doXHR(start, end)
								}
								if(typeof lazyArray.chunks[chunkNum] == "undefined") throw new Error("doXHR failed!");
								return lazyArray.chunks[chunkNum]
							});
							if(usesGzip || !datalength){
								chunkSize = datalength = 1;
								datalength = this.getter(0).length;
								chunkSize = datalength;
								out("LazyFiles on gzip forces download of the whole file when length is accessed")
							}
							this._length = datalength;
							this._chunkSize = chunkSize;
							this.lengthKnown = true
						}
						get length(){
							if(!this.lengthKnown){
								this.cacheLength()
							}
							return this._length
						}
						get chunkSize(){
							if(!this.lengthKnown){
								this.cacheLength()
							}
							return this._chunkSize
						}
					}
					if(typeof XMLHttpRequest != "undefined"){
						if(!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
						var lazyArray = new LazyUint8Array;
						var properties = {
							isDevice: false,
							contents: lazyArray
						}
					}else{
						var properties = {
							isDevice: false,
							url
						}
					}
					var node = FS.createFile(parent, name, properties, canRead, canWrite);
					if(properties.contents){
						node.contents = properties.contents
					}else if(properties.url){
						node.contents = null;
						node.url = properties.url
					}
					Object.defineProperties(node, {
						usedBytes: {
							get: function(){
								return this.contents.length
							}
						}
					});
					var stream_ops = {};
					var keys = Object.keys(node.stream_ops);
					keys.forEach(key => {
						var fn = node.stream_ops[key];
						stream_ops[key] = (...args) => {
							FS.forceLoadFile(node);
							return fn(...args)
						}
					});

					function writeChunks(stream, buffer, offset, length, position){
						var contents = stream.node.contents;
						if(position >= contents.length) return 0;
						var size = Math.min(contents.length - position, length);
						assert(size >= 0);
						if(contents.slice){
							for(var i = 0; i < size; i++){
								buffer[offset + i] = contents[position + i]
							}
						}else{
							for(var i = 0; i < size; i++){
								buffer[offset + i] = contents.get(position + i)
							}
						}
						return size
					}
					stream_ops.read = (stream, buffer, offset, length, position) => {
						FS.forceLoadFile(node);
						return writeChunks(stream, buffer, offset, length, position)
					};
					stream_ops.mmap = (stream, length, position, prot, flags) => {
						FS.forceLoadFile(node);
						var ptr = mmapAlloc(length);
						if(!ptr){
							throw new FS.ErrnoError(48)
						}
						writeChunks(stream, HEAP8, ptr, length, position);
						return {
							ptr, allocated: true
						}
					};
					node.stream_ops = stream_ops;
					return node
				},
				absolutePath(){
					abort("FS.absolutePath has been removed; use PATH_FS.resolve instead")
				},
				createFolder(){
					abort("FS.createFolder has been removed; use FS.mkdir instead")
				},
				createLink(){
					abort("FS.createLink has been removed; use FS.symlink instead")
				},
				joinPath(){
					abort("FS.joinPath has been removed; use PATH.join instead")
				},
				mmapAlloc(){
					abort("FS.mmapAlloc has been replaced by the top level function mmapAlloc")
				},
				standardizePath(){
					abort("FS.standardizePath has been removed; use PATH.normalize instead")
				}
			};
			var SYSCALLS = {
				DEFAULT_POLLMASK: 5,
				calculateAt(dirfd, path, allowEmpty){
					if(PATH.isAbs(path)){
						return path
					}
					var dir;
					if(dirfd === -100){
						dir = FS.cwd()
					}else{
						var dirstream = SYSCALLS.getStreamFromFD(dirfd);
						dir = dirstream.path
					}
					if(path.length == 0){
						if(!allowEmpty){
							throw new FS.ErrnoError(44)
						}
						return dir
					}
					return PATH.join2(dir, path)
				},
				doStat(func, path, buf){
					var stat = func(path);
					HEAP32[buf >> 2] = stat.dev;
					HEAP32[buf + 4 >> 2] = stat.mode;
					HEAPU32[buf + 8 >> 2] = stat.nlink;
					HEAP32[buf + 12 >> 2] = stat.uid;
					HEAP32[buf + 16 >> 2] = stat.gid;
					HEAP32[buf + 20 >> 2] = stat.rdev;
					HEAP64[buf + 24 >> 3] = BigInt(stat.size);
					HEAP32[buf + 32 >> 2] = 4096;
					HEAP32[buf + 36 >> 2] = stat.blocks;
					var atime = stat.atime.getTime();
					var mtime = stat.mtime.getTime();
					var ctime = stat.ctime.getTime();
					HEAP64[buf + 40 >> 3] = BigInt(Math.floor(atime / 1e3));
					HEAPU32[buf + 48 >> 2] = atime % 1e3 * 1e3 * 1e3;
					HEAP64[buf + 56 >> 3] = BigInt(Math.floor(mtime / 1e3));
					HEAPU32[buf + 64 >> 2] = mtime % 1e3 * 1e3 * 1e3;
					HEAP64[buf + 72 >> 3] = BigInt(Math.floor(ctime / 1e3));
					HEAPU32[buf + 80 >> 2] = ctime % 1e3 * 1e3 * 1e3;
					HEAP64[buf + 88 >> 3] = BigInt(stat.ino);
					return 0
				},
				doMsync(addr, stream, len, flags, offset){
					if(!FS.isFile(stream.node.mode)){
						throw new FS.ErrnoError(43)
					}
					if(flags & 2){
						return 0
					}
					var buffer = HEAPU8.slice(addr, addr + len);
					FS.msync(stream, buffer, offset, len, flags)
				},
				getStreamFromFD(fd){
					var stream = FS.getStreamChecked(fd);
					return stream
				},
				varargs: undefined,
				getStr(ptr){
					var ret = UTF8ToString(ptr);
					return ret
				}
			};

			function ___syscall__newselect(nfds, readfds, writefds, exceptfds, timeout){
				try{
					assert(nfds <= 64, "nfds must be less than or equal to 64");
					var total = 0;
					var srcReadLow = readfds ? HEAP32[readfds >> 2] : 0,
						srcReadHigh = readfds ? HEAP32[readfds + 4 >> 2] : 0;
					var srcWriteLow = writefds ? HEAP32[writefds >> 2] : 0,
						srcWriteHigh = writefds ? HEAP32[writefds + 4 >> 2] : 0;
					var srcExceptLow = exceptfds ? HEAP32[exceptfds >> 2] : 0,
						srcExceptHigh = exceptfds ? HEAP32[exceptfds + 4 >> 2] : 0;
					var dstReadLow = 0,
						dstReadHigh = 0;
					var dstWriteLow = 0,
						dstWriteHigh = 0;
					var dstExceptLow = 0,
						dstExceptHigh = 0;
					var allLow = (readfds ? HEAP32[readfds >> 2] : 0) | (writefds ? HEAP32[writefds >> 2] : 0) | (exceptfds ? HEAP32[exceptfds >> 2] : 0);
					var allHigh = (readfds ? HEAP32[readfds + 4 >> 2] : 0) | (writefds ? HEAP32[writefds + 4 >> 2] : 0) | (exceptfds ? HEAP32[exceptfds + 4 >> 2] : 0);
					var check = function(fd, low, high, val){
						return fd < 32 ? low & val : high & val
					};
					for(var fd = 0; fd < nfds; fd++){
						var mask = 1 << fd % 32;
						if(!check(fd, allLow, allHigh, mask)){
							continue
						}
						var stream = SYSCALLS.getStreamFromFD(fd);
						var flags = SYSCALLS.DEFAULT_POLLMASK;
						if(stream.stream_ops.poll){
							var timeoutInMillis = -1;
							if(timeout){
								var tv_sec = readfds ? HEAP32[timeout >> 2] : 0,
									tv_usec = readfds ? HEAP32[timeout + 4 >> 2] : 0;
								timeoutInMillis = (tv_sec + tv_usec / 1e6) * 1e3
							}
							flags = stream.stream_ops.poll(stream, timeoutInMillis)
						}
						if(flags & 1 && check(fd, srcReadLow, srcReadHigh, mask)){
							fd < 32 ? dstReadLow = dstReadLow | mask : dstReadHigh = dstReadHigh | mask;
							total++
						}
						if(flags & 4 && check(fd, srcWriteLow, srcWriteHigh, mask)){
							fd < 32 ? dstWriteLow = dstWriteLow | mask : dstWriteHigh = dstWriteHigh | mask;
							total++
						}
						if(flags & 2 && check(fd, srcExceptLow, srcExceptHigh, mask)){
							fd < 32 ? dstExceptLow = dstExceptLow | mask : dstExceptHigh = dstExceptHigh | mask;
							total++
						}
					}
					if(readfds){
						HEAP32[readfds >> 2] = dstReadLow;
						HEAP32[readfds + 4 >> 2] = dstReadHigh
					}
					if(writefds){
						HEAP32[writefds >> 2] = dstWriteLow;
						HEAP32[writefds + 4 >> 2] = dstWriteHigh
					}
					if(exceptfds){
						HEAP32[exceptfds >> 2] = dstExceptLow;
						HEAP32[exceptfds + 4 >> 2] = dstExceptHigh
					}
					return total
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_chmod(path, mode){
				try{
					path = SYSCALLS.getStr(path);
					FS.chmod(path, mode);
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_faccessat(dirfd, path, amode, flags){
				try{
					path = SYSCALLS.getStr(path);
					assert(flags === 0 || flags == 512);
					path = SYSCALLS.calculateAt(dirfd, path);
					if(amode & ~7){
						return -28
					}
					var lookup = FS.lookupPath(path, {
						follow: true
					});
					var node = lookup.node;
					if(!node){
						return -44
					}
					var perms = "";
					if(amode & 4) perms += "r";
					if(amode & 2) perms += "w";
					if(amode & 1) perms += "x";
					if(perms && FS.nodePermissions(node, perms)){
						return -2
					}
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function syscallGetVarargI(){
				assert(SYSCALLS.varargs != undefined);
				var ret = HEAP32[+SYSCALLS.varargs >> 2];
				SYSCALLS.varargs += 4;
				return ret
			}
			var syscallGetVarargP = syscallGetVarargI;

			function ___syscall_fcntl64(fd, cmd, varargs){
				SYSCALLS.varargs = varargs;
				try{
					var stream = SYSCALLS.getStreamFromFD(fd);
					switch (cmd){
						case 0:
							{
								var arg = syscallGetVarargI();
								if(arg < 0){
									return -28
								}
								while(FS.streams[arg]){
									arg++
								}
								var newStream;
								newStream = FS.dupStream(stream, arg);
								return newStream.fd
							}
						case 1:
						case 2:
							return 0;
						case 3:
							return stream.flags;
						case 4:
							{
								var arg = syscallGetVarargI();
								stream.flags |= arg;
								return 0
							}
						case 12:
							{
								var arg = syscallGetVarargP();
								var offset = 0;
								HEAP16[arg + offset >> 1] = 2;
								return 0
							}
						case 13:
						case 14:
							return 0
					}
					return -28
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_fstat64(fd, buf){
				try{
					var stream = SYSCALLS.getStreamFromFD(fd);
					return SYSCALLS.doStat(FS.stat, stream.path, buf)
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_statfs64(path, size, buf){
				try{
					path = SYSCALLS.getStr(path);
					assert(size === 64);
					HEAP32[buf + 4 >> 2] = 4096;
					HEAP32[buf + 40 >> 2] = 4096;
					HEAP32[buf + 8 >> 2] = 1e6;
					HEAP32[buf + 12 >> 2] = 5e5;
					HEAP32[buf + 16 >> 2] = 5e5;
					HEAP32[buf + 20 >> 2] = FS.nextInode;
					HEAP32[buf + 24 >> 2] = 1e6;
					HEAP32[buf + 28 >> 2] = 42;
					HEAP32[buf + 44 >> 2] = 2;
					HEAP32[buf + 36 >> 2] = 255;
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_fstatfs64(fd, size, buf){
				try{
					var stream = SYSCALLS.getStreamFromFD(fd);
					return ___syscall_statfs64(0, size, buf)
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}
			var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
				assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
				return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
			};

			function ___syscall_getcwd(buf, size){
				try{
					if(size === 0) return -28;
					var cwd = FS.cwd();
					var cwdLengthInBytes = lengthBytesUTF8(cwd) + 1;
					if(size < cwdLengthInBytes) return -68;
					stringToUTF8(cwd, buf, size);
					return cwdLengthInBytes
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_getdents64(fd, dirp, count){
				try{
					var stream = SYSCALLS.getStreamFromFD(fd);
					stream.getdents ||= FS.readdir(stream.path);
					var struct_size = 280;
					var pos = 0;
					var off = FS.llseek(stream, 0, 1);
					var idx = Math.floor(off / struct_size);
					while(idx < stream.getdents.length && pos + struct_size <= count){
						var id;
						var type;
						var name = stream.getdents[idx];
						if(name === "."){
							id = stream.node.id;
							type = 4
						}else if(name === ".."){
							var lookup = FS.lookupPath(stream.path, {
								parent: true
							});
							id = lookup.node.id;
							type = 4
						}else{
							var child = FS.lookupNode(stream.node, name);
							id = child.id;
							type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8
						}
						assert(id);
						HEAP64[dirp + pos >> 3] = BigInt(id);
						HEAP64[dirp + pos + 8 >> 3] = BigInt((idx + 1) * struct_size);
						HEAP16[dirp + pos + 16 >> 1] = 280;
						HEAP8[dirp + pos + 18] = type;
						stringToUTF8(name, dirp + pos + 19, 256);
						pos += struct_size;
						idx += 1
					}
					FS.llseek(stream, idx * struct_size, 0);
					return pos
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_ioctl(fd, op, varargs){
				SYSCALLS.varargs = varargs;
				try{
					var stream = SYSCALLS.getStreamFromFD(fd);
					switch (op){
						case 21509:
							{
								if(!stream.tty) return -59;
								return 0
							}
						case 21505:
							{
								if(!stream.tty) return -59;
								if(stream.tty.ops.ioctl_tcgets){
									var termios = stream.tty.ops.ioctl_tcgets(stream);
									var argp = syscallGetVarargP();
									HEAP32[argp >> 2] = termios.c_iflag || 0;
									HEAP32[argp + 4 >> 2] = termios.c_oflag || 0;
									HEAP32[argp + 8 >> 2] = termios.c_cflag || 0;
									HEAP32[argp + 12 >> 2] = termios.c_lflag || 0;
									for(var i = 0; i < 32; i++){
										HEAP8[argp + i + 17] = termios.c_cc[i] || 0
									}
									return 0
								}
								return 0
							}
						case 21510:
						case 21511:
						case 21512:
							{
								if(!stream.tty) return -59;
								return 0
							}
						case 21506:
						case 21507:
						case 21508:
							{
								if(!stream.tty) return -59;
								if(stream.tty.ops.ioctl_tcsets){
									var argp = syscallGetVarargP();
									var c_iflag = HEAP32[argp >> 2];
									var c_oflag = HEAP32[argp + 4 >> 2];
									var c_cflag = HEAP32[argp + 8 >> 2];
									var c_lflag = HEAP32[argp + 12 >> 2];
									var c_cc = [];
									for(var i = 0; i < 32; i++){
										c_cc.push(HEAP8[argp + i + 17])
									}
									return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
										c_iflag, c_oflag, c_cflag, c_lflag, c_cc
									})
								}
								return 0
							}
						case 21519:
							{
								if(!stream.tty) return -59;
								var argp = syscallGetVarargP();
								HEAP32[argp >> 2] = 0;
								return 0
							}
						case 21520:
							{
								if(!stream.tty) return -59;
								return -28
							}
						case 21531:
							{
								var argp = syscallGetVarargP();
								return FS.ioctl(stream, op, argp)
							}
						case 21523:
							{
								if(!stream.tty) return -59;
								if(stream.tty.ops.ioctl_tiocgwinsz){
									var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
									var argp = syscallGetVarargP();
									HEAP16[argp >> 1] = winsize[0];
									HEAP16[argp + 2 >> 1] = winsize[1]
								}
								return 0
							}
						case 21524:
							{
								if(!stream.tty) return -59;
								return 0
							}
						case 21515:
							{
								if(!stream.tty) return -59;
								return 0
							}
						default:
							return -28
					}
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_lstat64(path, buf){
				try{
					path = SYSCALLS.getStr(path);
					return SYSCALLS.doStat(FS.lstat, path, buf)
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_mkdirat(dirfd, path, mode){
				try{
					path = SYSCALLS.getStr(path);
					path = SYSCALLS.calculateAt(dirfd, path);
					path = PATH.normalize(path);
					if(path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
					FS.mkdir(path, mode, 0);
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_newfstatat(dirfd, path, buf, flags){
				try{
					path = SYSCALLS.getStr(path);
					var nofollow = flags & 256;
					var allowEmpty = flags & 4096;
					flags = flags & ~6400;
					assert(!flags, `unknown flags in __syscall_newfstatat: ${flags}`);
					path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
					return SYSCALLS.doStat(nofollow ? FS.lstat : FS.stat, path, buf)
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_openat(dirfd, path, flags, varargs){
				SYSCALLS.varargs = varargs;
				try{
					path = SYSCALLS.getStr(path);
					path = SYSCALLS.calculateAt(dirfd, path);
					var mode = varargs ? syscallGetVarargI() : 0;
					return FS.open(path, flags, mode).fd
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_readlinkat(dirfd, path, buf, bufsize){
				try{
					path = SYSCALLS.getStr(path);
					path = SYSCALLS.calculateAt(dirfd, path);
					if(bufsize <= 0) return -28;
					var ret = FS.readlink(path);
					var len = Math.min(bufsize, lengthBytesUTF8(ret));
					var endChar = HEAP8[buf + len];
					stringToUTF8(ret, buf, bufsize + 1);
					HEAP8[buf + len] = endChar;
					return len
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath){
				try{
					oldpath = SYSCALLS.getStr(oldpath);
					newpath = SYSCALLS.getStr(newpath);
					oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
					newpath = SYSCALLS.calculateAt(newdirfd, newpath);
					FS.rename(oldpath, newpath);
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_rmdir(path){
				try{
					path = SYSCALLS.getStr(path);
					FS.rmdir(path);
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_stat64(path, buf){
				try{
					path = SYSCALLS.getStr(path);
					return SYSCALLS.doStat(FS.stat, path, buf)
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_symlink(target, linkpath){
				try{
					target = SYSCALLS.getStr(target);
					linkpath = SYSCALLS.getStr(linkpath);
					FS.symlink(target, linkpath);
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function ___syscall_unlinkat(dirfd, path, flags){
				try{
					path = SYSCALLS.getStr(path);
					path = SYSCALLS.calculateAt(dirfd, path);
					if(flags === 0){
						FS.unlink(path)
					}else if(flags === 512){
						FS.rmdir(path)
					}else{
						abort("Invalid flags passed to unlinkat")
					}
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}
			var readI53FromI64 = ptr => HEAPU32[ptr >> 2] + HEAP32[ptr + 4 >> 2] * 4294967296;

			function ___syscall_utimensat(dirfd, path, times, flags){
				try{
					path = SYSCALLS.getStr(path);
					assert(flags === 0);
					path = SYSCALLS.calculateAt(dirfd, path, true);
					var now = Date.now(),
						atime, mtime;
					if(!times){
						atime = now;
						mtime = now
					}else{
						var seconds = readI53FromI64(times);
						var nanoseconds = HEAP32[times + 8 >> 2];
						if(nanoseconds == 1073741823){
							atime = now
						}else if(nanoseconds == 1073741822){
							atime = -1
						}else{
							atime = seconds * 1e3 + nanoseconds / (1e3 * 1e3)
						}
						times += 16;
						seconds = readI53FromI64(times);
						nanoseconds = HEAP32[times + 8 >> 2];
						if(nanoseconds == 1073741823){
							mtime = now
						}else if(nanoseconds == 1073741822){
							mtime = -1
						}else{
							mtime = seconds * 1e3 + nanoseconds / (1e3 * 1e3)
						}
					}
					if(mtime != -1 || atime != -1){
						FS.utime(path, atime, mtime)
					}
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}
			var __abort_js = () => {
				abort("native code called abort()")
			};
			var embindRepr = v => {
				if(v === null){
					return "null"
				}
				var t = typeof v;
				if(t === "object" || t === "array" || t === "function"){
					return v.toString()
				}else{
					return "" + v
				}
			};
			var embind_init_charCodes = () => {
				var codes = new Array(256);
				for(var i = 0; i < 256; ++i){
					codes[i] = String.fromCharCode(i)
				}
				embind_charCodes = codes
			};
			var embind_charCodes;
			var readLatin1String = ptr => {
				var ret = "";
				var c = ptr;
				while(HEAPU8[c]){
					ret += embind_charCodes[HEAPU8[c++]]
				}
				return ret
			};
			var awaitingDependencies = {};
			var registeredTypes = {};
			var typeDependencies = {};
			var BindingError;
			var throwBindingError = message => {
				throw new BindingError(message)
			};
			var InternalError;
			var throwInternalError = message => {
				throw new InternalError(message)
			};

			function sharedRegisterType(rawType, registeredInstance, options = {}){
				var name = registeredInstance.name;
				if(!rawType){
					throwBindingError(`type "${name}" must have a positive integer typeid pointer`)
				}
				if(registeredTypes.hasOwnProperty(rawType)){
					if(options.ignoreDuplicateRegistrations){
						return
					}else{
						throwBindingError(`Cannot register type '${name}' twice`)
					}
				}
				registeredTypes[rawType] = registeredInstance;
				delete typeDependencies[rawType];
				if(awaitingDependencies.hasOwnProperty(rawType)){
					var callbacks = awaitingDependencies[rawType];
					delete awaitingDependencies[rawType];
					callbacks.forEach(cb => cb())
				}
			}

			function registerType(rawType, registeredInstance, options = {}){
				if(registeredInstance.argPackAdvance === undefined){
					throw new TypeError("registerType registeredInstance requires argPackAdvance")
				}
				return sharedRegisterType(rawType, registeredInstance, options)
			}
			var integerReadValueFromPointer = (name, width, signed) => {
				switch (width){
					case 1:
						return signed ? pointer => HEAP8[pointer] : pointer => HEAPU8[pointer];
					case 2:
						return signed ? pointer => HEAP16[pointer >> 1] : pointer => HEAPU16[pointer >> 1];
					case 4:
						return signed ? pointer => HEAP32[pointer >> 2] : pointer => HEAPU32[pointer >> 2];
					case 8:
						return signed ? pointer => HEAP64[pointer >> 3] : pointer => HEAPU64[pointer >> 3];
					default:
						throw new TypeError(`invalid integer width (${width}): ${name}`)
				}
			};
			var __embind_register_bigint = (primitiveType, name, size, minRange, maxRange) => {
				name = readLatin1String(name);
				var isUnsignedType = name.indexOf("u") != -1;
				if(isUnsignedType){
					maxRange = (1n << 64n) - 1n
				}
				registerType(primitiveType, {
					name, fromWireType: value => value, toWireType: function(destructors, value){
						if(typeof value != "bigint" && typeof value != "number"){
							throw new TypeError(`Cannot convert "${embindRepr(value)}" to ${this.name}`)
						}
						if(typeof value == "number"){
							value = BigInt(value)
						}
						if(value < minRange || value > maxRange){
							throw new TypeError(`Passing a number "${embindRepr(value)}" from JS side to C/C++ side to an argument of type "${name}", which is outside the valid range [${minRange}, ${maxRange}]!`)
						}
						return value
					}, argPackAdvance: GenericWireTypeSize, readValueFromPointer: integerReadValueFromPointer(name, size, !isUnsignedType), destructorFunction: null
				})
			};
			var GenericWireTypeSize = 8;
			var __embind_register_bool = (rawType, name, trueValue, falseValue) => {
				name = readLatin1String(name);
				registerType(rawType, {
					name, fromWireType: function(wt){
						return !!wt
					}, toWireType: function(destructors, o){
						return o ? trueValue : falseValue
					}, argPackAdvance: GenericWireTypeSize, readValueFromPointer: function(pointer){
						return this["fromWireType"](HEAPU8[pointer])
					}, destructorFunction: null
				})
			};
			var emval_freelist = [];
			var emval_handles = [];
			var __emval_decref = handle => {
				if(handle > 9 && 0 === --emval_handles[handle + 1]){
					assert(emval_handles[handle] !== undefined, `Decref for unallocated handle.`);
					emval_handles[handle] = undefined;
					emval_freelist.push(handle)
				}
			};
			var count_emval_handles = () => emval_handles.length / 2 - 5 - emval_freelist.length;
			var init_emval = () => {
				emval_handles.push(0, 1, undefined, 1, null, 1, true, 1, false, 1);
				assert(emval_handles.length === 5 * 2);
				Module["count_emval_handles"] = count_emval_handles
			};
			var Emval = {
				toValue: handle => {
					if(!handle){
						throwBindingError("Cannot use deleted val. handle = " + handle)
					}
					assert(handle === 2 || emval_handles[handle] !== undefined && handle % 2 === 0, `invalid handle: ${handle}`);
					return emval_handles[handle]
				},
				toHandle: value => {
					switch (value){
						case undefined:
							return 2;
						case null:
							return 4;
						case true:
							return 6;
						case false:
							return 8;
						default:
							{
								const handle = emval_freelist.pop() || emval_handles.length;
								emval_handles[handle] = value;
								emval_handles[handle + 1] = 1;
								return handle
							}
					}
				}
			};

			function readPointer(pointer){
				return this["fromWireType"](HEAPU32[pointer >> 2])
			}
			var EmValType = {
				name: "emscripten::val",
				fromWireType: handle => {
					var rv = Emval.toValue(handle);
					__emval_decref(handle);
					return rv
				},
				toWireType: (destructors, value) => Emval.toHandle(value),
				argPackAdvance: GenericWireTypeSize,
				readValueFromPointer: readPointer,
				destructorFunction: null
			};
			var __embind_register_emval = rawType => registerType(rawType, EmValType);
			var floatReadValueFromPointer = (name, width) => {
				switch (width){
					case 4:
						return function(pointer){
							return this["fromWireType"](HEAPF32[pointer >> 2])
						};
					case 8:
						return function(pointer){
							return this["fromWireType"](HEAPF64[pointer >> 3])
						};
					default:
						throw new TypeError(`invalid float width (${width}): ${name}`)
				}
			};
			var __embind_register_float = (rawType, name, size) => {
				name = readLatin1String(name);
				registerType(rawType, {
					name, fromWireType: value => value, toWireType: (destructors, value) => {
						if(typeof value != "number" && typeof value != "boolean"){
							throw new TypeError(`Cannot convert ${embindRepr(value)} to ${this.name}`)
						}
						return value
					}, argPackAdvance: GenericWireTypeSize, readValueFromPointer: floatReadValueFromPointer(name, size), destructorFunction: null
				})
			};
			var __embind_register_integer = (primitiveType, name, size, minRange, maxRange) => {
				name = readLatin1String(name);
				if(maxRange === -1){
					maxRange = 4294967295
				}
				var fromWireType = value => value;
				if(minRange === 0){
					var bitshift = 32 - 8 * size;
					fromWireType = value => value << bitshift >>> bitshift
				}
				var isUnsignedType = name.includes("unsigned");
				var checkAssertions = (value, toTypeName) => {
					if(typeof value != "number" && typeof value != "boolean"){
						throw new TypeError(`Cannot convert "${embindRepr(value)}" to ${toTypeName}`)
					}
					if(value < minRange || value > maxRange){
						throw new TypeError(`Passing a number "${embindRepr(value)}" from JS side to C/C++ side to an argument of type "${name}", which is outside the valid range [${minRange}, ${maxRange}]!`)
					}
				};
				var toWireType;
				if(isUnsignedType){
					toWireType = function(destructors, value){
						checkAssertions(value, this.name);
						return value >>> 0
					}
				}else{
					toWireType = function(destructors, value){
						checkAssertions(value, this.name);
						return value
					}
				}
				registerType(primitiveType, {
					name, fromWireType, toWireType, argPackAdvance: GenericWireTypeSize, readValueFromPointer: integerReadValueFromPointer(name, size, minRange !== 0), destructorFunction: null
				})
			};
			var __embind_register_memory_view = (rawType, dataTypeIndex, name) => {
				var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array, BigInt64Array, BigUint64Array];
				var TA = typeMapping[dataTypeIndex];

				function decodeMemoryView(handle){
					var size = HEAPU32[handle >> 2];
					var data = HEAPU32[handle + 4 >> 2];
					return new TA(HEAP8.buffer, data, size)
				}
				name = readLatin1String(name);
				registerType(rawType, {
					name, fromWireType: decodeMemoryView, argPackAdvance: GenericWireTypeSize, readValueFromPointer: decodeMemoryView
				}, {
					ignoreDuplicateRegistrations: true
				})
			};
			var __embind_register_std_string = (rawType, name) => {
				name = readLatin1String(name);
				var stdStringIsUTF8 = name === "std::string";
				registerType(rawType, {
					name, fromWireType(value){
						var length = HEAPU32[value >> 2];
						var payload = value + 4;
						var str;
						if(stdStringIsUTF8){
							var decodeStartPtr = payload;
							for(var i = 0; i <= length; ++i){
								var currentBytePtr = payload + i;
								if(i == length || HEAPU8[currentBytePtr] == 0){
									var maxRead = currentBytePtr - decodeStartPtr;
									var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
									if(str === undefined){
										str = stringSegment
									}else{
										str += String.fromCharCode(0);
										str += stringSegment
									}
									decodeStartPtr = currentBytePtr + 1
								}
							}
						}else{
							var a = new Array(length);
							for(var i = 0; i < length; ++i){
								a[i] = String.fromCharCode(HEAPU8[payload + i])
							}
							str = a.join("")
						}
						_free(value);
						return str
					}, toWireType(destructors, value){
						if(value instanceof ArrayBuffer){
							value = new Uint8Array(value)
						}
						var length;
						var valueIsOfTypeString = typeof value == "string";
						if(!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)){
							throwBindingError("Cannot pass non-string to std::string")
						}
						if(stdStringIsUTF8 && valueIsOfTypeString){
							length = lengthBytesUTF8(value)
						}else{
							length = value.length
						}
						var base = _malloc(4 + length + 1);
						var ptr = base + 4;
						HEAPU32[base >> 2] = length;
						if(stdStringIsUTF8 && valueIsOfTypeString){
							stringToUTF8(value, ptr, length + 1)
						}else{
							if(valueIsOfTypeString){
								for(var i = 0; i < length; ++i){
									var charCode = value.charCodeAt(i);
									if(charCode > 255){
										_free(ptr);
										throwBindingError("String has UTF-16 code units that do not fit in 8 bits")
									}
									HEAPU8[ptr + i] = charCode
								}
							}else{
								for(var i = 0; i < length; ++i){
									HEAPU8[ptr + i] = value[i]
								}
							}
						}
						if(destructors !== null){
							destructors.push(_free, base)
						}
						return base
					}, argPackAdvance: GenericWireTypeSize, readValueFromPointer: readPointer, destructorFunction(ptr){
						_free(ptr)
					}
				})
			};
			var UTF16Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf-16le") : undefined;
			var UTF16ToString = (ptr, maxBytesToRead) => {
				assert(ptr % 2 == 0, "Pointer passed to UTF16ToString must be aligned to two bytes!");
				var endPtr = ptr;
				var idx = endPtr >> 1;
				var maxIdx = idx + maxBytesToRead / 2;
				while(!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
				endPtr = idx << 1;
				if(endPtr - ptr > 32 && UTF16Decoder) return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
				var str = "";
				for(var i = 0; !(i >= maxBytesToRead / 2); ++i){
					var codeUnit = HEAP16[ptr + i * 2 >> 1];
					if(codeUnit == 0) break;
					str += String.fromCharCode(codeUnit)
				}
				return str
			};
			var stringToUTF16 = (str, outPtr, maxBytesToWrite) => {
				assert(outPtr % 2 == 0, "Pointer passed to stringToUTF16 must be aligned to two bytes!");
				assert(typeof maxBytesToWrite == "number", "stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
				maxBytesToWrite??=2147483647;
				if(maxBytesToWrite < 2) return 0;
				maxBytesToWrite -= 2;
				var startPtr = outPtr;
				var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
				for(var i = 0; i < numCharsToWrite; ++i){
					var codeUnit = str.charCodeAt(i);
					HEAP16[outPtr >> 1] = codeUnit;
					outPtr += 2
				}
				HEAP16[outPtr >> 1] = 0;
				return outPtr - startPtr
			};
			var lengthBytesUTF16 = str => str.length * 2;
			var UTF32ToString = (ptr, maxBytesToRead) => {
				assert(ptr % 4 == 0, "Pointer passed to UTF32ToString must be aligned to four bytes!");
				var i = 0;
				var str = "";
				while(!(i >= maxBytesToRead / 4)){
					var utf32 = HEAP32[ptr + i * 4 >> 2];
					if(utf32 == 0) break;
					++i;
					if(utf32 >= 65536){
						var ch = utf32 - 65536;
						str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
					}else{
						str += String.fromCharCode(utf32)
					}
				}
				return str
			};
			var stringToUTF32 = (str, outPtr, maxBytesToWrite) => {
				assert(outPtr % 4 == 0, "Pointer passed to stringToUTF32 must be aligned to four bytes!");
				assert(typeof maxBytesToWrite == "number", "stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
				maxBytesToWrite??=2147483647;
				if(maxBytesToWrite < 4) return 0;
				var startPtr = outPtr;
				var endPtr = startPtr + maxBytesToWrite - 4;
				for(var i = 0; i < str.length; ++i){
					var codeUnit = str.charCodeAt(i);
					if(codeUnit >= 55296 && codeUnit <= 57343){
						var trailSurrogate = str.charCodeAt(++i);
						codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023
					}
					HEAP32[outPtr >> 2] = codeUnit;
					outPtr += 4;
					if(outPtr + 4 > endPtr) break
				}
				HEAP32[outPtr >> 2] = 0;
				return outPtr - startPtr
			};
			var lengthBytesUTF32 = str => {
				var len = 0;
				for(var i = 0; i < str.length; ++i){
					var codeUnit = str.charCodeAt(i);
					if(codeUnit >= 55296 && codeUnit <= 57343) ++i;
					len += 4
				}
				return len
			};
			var __embind_register_std_wstring = (rawType, charSize, name) => {
				name = readLatin1String(name);
				var decodeString, encodeString, readCharAt, lengthBytesUTF;
				if(charSize === 2){
					decodeString = UTF16ToString;
					encodeString = stringToUTF16;
					lengthBytesUTF = lengthBytesUTF16;
					readCharAt = pointer => HEAPU16[pointer >> 1]
				}else if(charSize === 4){
					decodeString = UTF32ToString;
					encodeString = stringToUTF32;
					lengthBytesUTF = lengthBytesUTF32;
					readCharAt = pointer => HEAPU32[pointer >> 2]
				}
				registerType(rawType, {
					name, fromWireType: value => {
						var length = HEAPU32[value >> 2];
						var str;
						var decodeStartPtr = value + 4;
						for(var i = 0; i <= length; ++i){
							var currentBytePtr = value + 4 + i * charSize;
							if(i == length || readCharAt(currentBytePtr) == 0){
								var maxReadBytes = currentBytePtr - decodeStartPtr;
								var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
								if(str === undefined){
									str = stringSegment
								}else{
									str += String.fromCharCode(0);
									str += stringSegment
								}
								decodeStartPtr = currentBytePtr + charSize
							}
						}
						_free(value);
						return str
					}, toWireType: (destructors, value) => {
						if(!(typeof value == "string")){
							throwBindingError(`Cannot pass non-string to C++ string type ${name}`)
						}
						var length = lengthBytesUTF(value);
						var ptr = _malloc(4 + length + charSize);
						HEAPU32[ptr >> 2] = length / charSize;
						encodeString(value, ptr + 4, length + charSize);
						if(destructors !== null){
							destructors.push(_free, ptr)
						}
						return ptr
					}, argPackAdvance: GenericWireTypeSize, readValueFromPointer: readPointer, destructorFunction(ptr){
						_free(ptr)
					}
				})
			};
			var __embind_register_void = (rawType, name) => {
				name = readLatin1String(name);
				registerType(rawType, {
					isVoid: true,
					name,
					argPackAdvance: 0,
					fromWireType: () => undefined,
					toWireType: (destructors, o) => undefined
				})
			};
			var nowIsMonotonic = 1;
			var __emscripten_get_now_is_monotonic = () => nowIsMonotonic;
			var __emscripten_runtime_keepalive_clear = () => {
				noExitRuntime = false;
				runtimeKeepaliveCounter = 0
			};
			var __emscripten_throw_longjmp = () => {
				throw Infinity
			};
			var INT53_MAX = 9007199254740992;
			var INT53_MIN = -9007199254740992;
			var bigintToI53Checked = num => num < INT53_MIN || num > INT53_MAX ? NaN : Number(num);

			function __gmtime_js(time, tmPtr){
				time = bigintToI53Checked(time);
				var date = new Date(time * 1e3);
				HEAP32[tmPtr >> 2] = date.getUTCSeconds();
				HEAP32[tmPtr + 4 >> 2] = date.getUTCMinutes();
				HEAP32[tmPtr + 8 >> 2] = date.getUTCHours();
				HEAP32[tmPtr + 12 >> 2] = date.getUTCDate();
				HEAP32[tmPtr + 16 >> 2] = date.getUTCMonth();
				HEAP32[tmPtr + 20 >> 2] = date.getUTCFullYear() - 1900;
				HEAP32[tmPtr + 24 >> 2] = date.getUTCDay();
				var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
				var yday = (date.getTime() - start) / (1e3 * 60 * 60 * 24) | 0;
				HEAP32[tmPtr + 28 >> 2] = yday
			}
			var isLeapYear = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
			var MONTH_DAYS_LEAP_CUMULATIVE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
			var MONTH_DAYS_REGULAR_CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
			var ydayFromDate = date => {
				var leap = isLeapYear(date.getFullYear());
				var monthDaysCumulative = leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE;
				var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
				return yday
			};

			function __localtime_js(time, tmPtr){
				time = bigintToI53Checked(time);
				var date = new Date(time * 1e3);
				HEAP32[tmPtr >> 2] = date.getSeconds();
				HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
				HEAP32[tmPtr + 8 >> 2] = date.getHours();
				HEAP32[tmPtr + 12 >> 2] = date.getDate();
				HEAP32[tmPtr + 16 >> 2] = date.getMonth();
				HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
				HEAP32[tmPtr + 24 >> 2] = date.getDay();
				var yday = ydayFromDate(date) | 0;
				HEAP32[tmPtr + 28 >> 2] = yday;
				HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
				var start = new Date(date.getFullYear(), 0, 1);
				var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
				var winterOffset = start.getTimezoneOffset();
				var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
				HEAP32[tmPtr + 32 >> 2] = dst
			}
			var __mktime_js = function(tmPtr){
				var ret = (() => {
					var date = new Date(HEAP32[tmPtr + 20 >> 2] + 1900, HEAP32[tmPtr + 16 >> 2], HEAP32[tmPtr + 12 >> 2], HEAP32[tmPtr + 8 >> 2], HEAP32[tmPtr + 4 >> 2], HEAP32[tmPtr >> 2], 0);
					var dst = HEAP32[tmPtr + 32 >> 2];
					var guessedOffset = date.getTimezoneOffset();
					var start = new Date(date.getFullYear(), 0, 1);
					var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
					var winterOffset = start.getTimezoneOffset();
					var dstOffset = Math.min(winterOffset, summerOffset);
					if(dst < 0){
						HEAP32[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset)
					}else if(dst > 0 != (dstOffset == guessedOffset)){
						var nonDstOffset = Math.max(winterOffset, summerOffset);
						var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
						date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4)
					}
					HEAP32[tmPtr + 24 >> 2] = date.getDay();
					var yday = ydayFromDate(date) | 0;
					HEAP32[tmPtr + 28 >> 2] = yday;
					HEAP32[tmPtr >> 2] = date.getSeconds();
					HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
					HEAP32[tmPtr + 8 >> 2] = date.getHours();
					HEAP32[tmPtr + 12 >> 2] = date.getDate();
					HEAP32[tmPtr + 16 >> 2] = date.getMonth();
					HEAP32[tmPtr + 20 >> 2] = date.getYear();
					var timeMs = date.getTime();
					if(isNaN(timeMs)){
						return -1
					}
					return timeMs / 1e3
				})();
				return BigInt(ret)
			};

			function __mmap_js(len, prot, flags, fd, offset, allocated, addr){
				offset = bigintToI53Checked(offset);
				try{
					if(isNaN(offset)) return 61;
					var stream = SYSCALLS.getStreamFromFD(fd);
					var res = FS.mmap(stream, len, offset, prot, flags);
					var ptr = res.ptr;
					HEAP32[allocated >> 2] = res.allocated;
					HEAPU32[addr >> 2] = ptr;
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}

			function __munmap_js(addr, len, prot, flags, fd, offset){
				offset = bigintToI53Checked(offset);
				try{
					var stream = SYSCALLS.getStreamFromFD(fd);
					if(prot & 2){
						SYSCALLS.doMsync(addr, stream, len, flags, offset)
					}
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return -e.errno
				}
			}
			var timers = {};
			var handleException = e => {
				if(e instanceof ExitStatus || e == "unwind"){
					return EXITSTATUS
				}
				checkStackCookie();
				if(e instanceof WebAssembly.RuntimeError){
					if(_emscripten_stack_get_current() <= 0){
						err("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 65536)")
					}
				}
				quit_(1, e)
			};
			var runtimeKeepaliveCounter = 0;
			var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
			var _proc_exit = code => {
				EXITSTATUS = code;
				if(!keepRuntimeAlive()){
					Module["onExit"]?.(code);
					ABORT = true
				}
				quit_(code, new ExitStatus(code))
			};
			var exitJS = (status, implicit) => {
				EXITSTATUS = status;
				checkUnflushedContent();
				if(keepRuntimeAlive() && !implicit){
					var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
					readyPromiseReject(msg);
					err(msg)
				}
				_proc_exit(status)
			};
			var _exit = exitJS;
			var maybeExit = () => {
				if(!keepRuntimeAlive()){
					try{
						_exit(EXITSTATUS)
					}catch(e){
						handleException(e)
					}
				}
			};
			var callUserCallback = func => {
				if(ABORT){
					err("user callback triggered after runtime exited or application aborted.  Ignoring.");
					return
				}
				try{
					func();
					maybeExit()
				}catch(e){
					handleException(e)
				}
			};
			var _emscripten_get_now = () => performance.now();
			var __setitimer_js = (which, timeout_ms) => {
				if(timers[which]){
					clearTimeout(timers[which].id);
					delete timers[which]
				}
				if(!timeout_ms) return 0;
				var id = setTimeout(() => {
					assert(which in timers);
					delete timers[which];
					callUserCallback(() => __emscripten_timeout(which, _emscripten_get_now()))
				}, timeout_ms);
				timers[which] = {
					id, timeout_ms
				};
				return 0
			};
			var __tzset_js = (timezone, daylight, std_name, dst_name) => {
				var currentYear = (new Date).getFullYear();
				var winter = new Date(currentYear, 0, 1);
				var summer = new Date(currentYear, 6, 1);
				var winterOffset = winter.getTimezoneOffset();
				var summerOffset = summer.getTimezoneOffset();
				var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
				HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
				HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
				var extractZone = timezoneOffset => {
					var sign = timezoneOffset >= 0 ? "-" : "+";
					var absOffset = Math.abs(timezoneOffset);
					var hours = String(Math.floor(absOffset / 60)).padStart(2, "0");
					var minutes = String(absOffset % 60).padStart(2, "0");
					return `UTC${sign}${hours}${minutes}`
				};
				var winterName = extractZone(winterOffset);
				var summerName = extractZone(summerOffset);
				assert(winterName);
				assert(summerName);
				assert(lengthBytesUTF8(winterName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${winterName})`);
				assert(lengthBytesUTF8(summerName) <= 16, `timezone name truncated to fit in TZNAME_MAX (${summerName})`);
				if(summerOffset < winterOffset){
					stringToUTF8(winterName, std_name, 17);
					stringToUTF8(summerName, dst_name, 17)
				}else{
					stringToUTF8(winterName, dst_name, 17);
					stringToUTF8(summerName, std_name, 17)
				}
			};
			var _emscripten_date_now = () => Date.now();
			var _emscripten_err = str => err(UTF8ToString(str));
			var getHeapMax = () => 2147483648;
			var _emscripten_get_heap_max = () => getHeapMax();
			var growMemory = size => {
				var b = wasmMemory.buffer;
				var pages = (size - b.byteLength + 65535) / 65536 | 0;
				try{
					wasmMemory.grow(pages);
					updateMemoryViews();
					return 1
				}catch(e){
					err(`growMemory: Attempted to grow heap from ${b.byteLength} bytes to ${size} bytes, but got error: ${e}`)
				}
			};
			var _emscripten_resize_heap = requestedSize => {
				var oldSize = HEAPU8.length;
				requestedSize >>>= 0;
				assert(requestedSize > oldSize);
				var maxHeapSize = getHeapMax();
				if(requestedSize > maxHeapSize){
					err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
					return false
				}
				for(var cutDown = 1; cutDown <= 4; cutDown *= 2){
					var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
					overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
					var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
					var replacement = growMemory(newSize);
					if(replacement){
						return true
					}
				}
				err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
				return false
			};
			var ENV = {};
			var getExecutableName = () => thisProgram || "./this.program";
			var getEnvStrings = () => {
				if(!getEnvStrings.strings){
					var lang = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
					var env = {
						USER: "web_user",
						LOGNAME: "web_user",
						PATH: "/",
						PWD: "/",
						HOME: "/home/web_user",
						LANG: lang,
						_: getExecutableName()
					};
					for(var x in ENV){
						if(ENV[x] === undefined) delete env[x];
						else env[x] = ENV[x]
					}
					var strings = [];
					for(var x in env){
						strings.push(`${x}=${env[x]}`)
					}
					getEnvStrings.strings = strings
				}
				return getEnvStrings.strings
			};
			var stringToAscii = (str, buffer) => {
				for(var i = 0; i < str.length; ++i){
					assert(str.charCodeAt(i) === (str.charCodeAt(i) & 255));
					HEAP8[buffer++] = str.charCodeAt(i)
				}
				HEAP8[buffer] = 0
			};
			var _environ_get = (__environ, environ_buf) => {
				var bufSize = 0;
				getEnvStrings().forEach((string, i) => {
					var ptr = environ_buf + bufSize;
					HEAPU32[__environ + i * 4 >> 2] = ptr;
					stringToAscii(string, ptr);
					bufSize += string.length + 1
				});
				return 0
			};
			var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
				var strings = getEnvStrings();
				HEAPU32[penviron_count >> 2] = strings.length;
				var bufSize = 0;
				strings.forEach(string => bufSize += string.length + 1);
				HEAPU32[penviron_buf_size >> 2] = bufSize;
				return 0
			};

			function _fd_close(fd){
				try{
					var stream = SYSCALLS.getStreamFromFD(fd);
					FS.close(stream);
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return e.errno
				}
			}

			function _fd_fdstat_get(fd, pbuf){
				try{
					var rightsBase = 0;
					var rightsInheriting = 0;
					var flags = 0; {
						var stream = SYSCALLS.getStreamFromFD(fd);
						var type = stream.tty ? 2 : FS.isDir(stream.mode) ? 3 : FS.isLink(stream.mode) ? 7 : 4
					}
					HEAP8[pbuf] = type;
					HEAP16[pbuf + 2 >> 1] = flags;
					HEAP64[pbuf + 8 >> 3] = BigInt(rightsBase);
					HEAP64[pbuf + 16 >> 3] = BigInt(rightsInheriting);
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return e.errno
				}
			}
			var doReadv = (stream, iov, iovcnt, offset) => {
				var ret = 0;
				for(var i = 0; i < iovcnt; i++){
					var ptr = HEAPU32[iov >> 2];
					var len = HEAPU32[iov + 4 >> 2];
					iov += 8;
					var curr = FS.read(stream, HEAP8, ptr, len, offset);
					if(curr < 0) return -1;
					ret += curr;
					if(curr < len) break;
					if(typeof offset != "undefined"){
						offset += curr
					}
				}
				return ret
			};

			function _fd_read(fd, iov, iovcnt, pnum){
				try{
					var stream = SYSCALLS.getStreamFromFD(fd);
					var num = doReadv(stream, iov, iovcnt);
					HEAPU32[pnum >> 2] = num;
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return e.errno
				}
			}

			function _fd_seek(fd, offset, whence, newOffset){
				offset = bigintToI53Checked(offset);
				try{
					if(isNaN(offset)) return 61;
					var stream = SYSCALLS.getStreamFromFD(fd);
					FS.llseek(stream, offset, whence);
					HEAP64[newOffset >> 3] = BigInt(stream.position);
					if(stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return e.errno
				}
			}
			var doWritev = (stream, iov, iovcnt, offset) => {
				var ret = 0;
				for(var i = 0; i < iovcnt; i++){
					var ptr = HEAPU32[iov >> 2];
					var len = HEAPU32[iov + 4 >> 2];
					iov += 8;
					var curr = FS.write(stream, HEAP8, ptr, len, offset);
					if(curr < 0) return -1;
					ret += curr;
					if(curr < len){
						break
					}
					if(typeof offset != "undefined"){
						offset += curr
					}
				}
				return ret
			};

			function _fd_write(fd, iov, iovcnt, pnum){
				try{
					var stream = SYSCALLS.getStreamFromFD(fd);
					var num = doWritev(stream, iov, iovcnt);
					HEAPU32[pnum >> 2] = num;
					return 0
				}catch(e){
					if(typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
					return e.errno
				}
			}
			var stackAlloc = sz => __emscripten_stack_alloc(sz);
			FS.createPreloadedFile = FS_createPreloadedFile;
			FS.staticInit();
			embind_init_charCodes();
			BindingError = Module["BindingError"] = class BindingError extends Error {
				constructor(message){
					super(message);
					this.name = "BindingError"
				}
			};
			InternalError = Module["InternalError"] = class InternalError extends Error {
				constructor(message){
					super(message);
					this.name = "InternalError"
				}
			};
			init_emval();

			function checkIncomingModuleAPI(){
				ignoredModuleProp("fetchSettings")
			}
			var wasmImports = {
				__assert_fail: ___assert_fail,
				__call_sighandler: ___call_sighandler,
				__syscall__newselect: ___syscall__newselect,
				__syscall_chmod: ___syscall_chmod,
				__syscall_faccessat: ___syscall_faccessat,
				__syscall_fcntl64: ___syscall_fcntl64,
				__syscall_fstat64: ___syscall_fstat64,
				__syscall_fstatfs64: ___syscall_fstatfs64,
				__syscall_getcwd: ___syscall_getcwd,
				__syscall_getdents64: ___syscall_getdents64,
				__syscall_ioctl: ___syscall_ioctl,
				__syscall_lstat64: ___syscall_lstat64,
				__syscall_mkdirat: ___syscall_mkdirat,
				__syscall_newfstatat: ___syscall_newfstatat,
				__syscall_openat: ___syscall_openat,
				__syscall_readlinkat: ___syscall_readlinkat,
				__syscall_renameat: ___syscall_renameat,
				__syscall_rmdir: ___syscall_rmdir,
				__syscall_stat64: ___syscall_stat64,
				__syscall_symlink: ___syscall_symlink,
				__syscall_unlinkat: ___syscall_unlinkat,
				__syscall_utimensat: ___syscall_utimensat,
				_abort_js: __abort_js,
				_embind_register_bigint: __embind_register_bigint,
				_embind_register_bool: __embind_register_bool,
				_embind_register_emval: __embind_register_emval,
				_embind_register_float: __embind_register_float,
				_embind_register_integer: __embind_register_integer,
				_embind_register_memory_view: __embind_register_memory_view,
				_embind_register_std_string: __embind_register_std_string,
				_embind_register_std_wstring: __embind_register_std_wstring,
				_embind_register_void: __embind_register_void,
				_emscripten_get_now_is_monotonic: __emscripten_get_now_is_monotonic,
				_emscripten_runtime_keepalive_clear: __emscripten_runtime_keepalive_clear,
				_emscripten_throw_longjmp: __emscripten_throw_longjmp,
				_gmtime_js: __gmtime_js,
				_localtime_js: __localtime_js,
				_mktime_js: __mktime_js,
				_mmap_js: __mmap_js,
				_munmap_js: __munmap_js,
				_setitimer_js: __setitimer_js,
				_tzset_js: __tzset_js,
				emscripten_date_now: _emscripten_date_now,
				emscripten_err: _emscripten_err,
				emscripten_get_heap_max: _emscripten_get_heap_max,
				emscripten_get_now: _emscripten_get_now,
				emscripten_resize_heap: _emscripten_resize_heap,
				environ_get: _environ_get,
				environ_sizes_get: _environ_sizes_get,
				exit: _exit,
				fd_close: _fd_close,
				fd_fdstat_get: _fd_fdstat_get,
				fd_read: _fd_read,
				fd_seek: _fd_seek,
				fd_write: _fd_write,
				invoke_i,
				invoke_ii,
				invoke_iii,
				invoke_iiii,
				invoke_iiiii,
				invoke_iiiiii,
				invoke_iiiiiii,
				invoke_iiiiiiiii,
				invoke_iiiiiiiiii,
				invoke_iiiiiiiiiii,
				invoke_iiiiiiiiiiii,
				invoke_iiiijj,
				invoke_ij,
				invoke_v,
				invoke_vi,
				invoke_vii,
				invoke_viii,
				invoke_viiid,
				invoke_viiii,
				invoke_viiiii,
				invoke_viiiiii,
				invoke_viiiiiii,
				invoke_viiiiiiii,
				invoke_viiiiiiiii,
				invoke_viiiiiiiiiii,
				invoke_viiiiiiiiiiiii,
				invoke_viiiiiiiiiiiiiii,
				proc_exit: _proc_exit
			};
			var wasmExports = createWasm();
			var ___wasm_call_ctors = createExportWrapper("__wasm_call_ctors", 0);
			var ___getTypeName = createExportWrapper("__getTypeName", 1);
			var _abort = Module["_abort"] = createExportWrapper("abort", 0);
			var _fflush = createExportWrapper("fflush", 1);
			var _strerror = createExportWrapper("strerror", 1);
			var _ffprobe = Module["_ffprobe"] = createExportWrapper("ffprobe", 2);
			var _main = createExportWrapper("__main_argc_argv", 2);
			var _ffmpeg = Module["_ffmpeg"] = createExportWrapper("ffmpeg", 2);
			var _free = createExportWrapper("free", 1);
			var _malloc = Module["_malloc"] = createExportWrapper("malloc", 1);
			var _emscripten_builtin_memalign = createExportWrapper("emscripten_builtin_memalign", 2);
			var __emscripten_timeout = createExportWrapper("_emscripten_timeout", 2);
			var _setThrew = createExportWrapper("setThrew", 2);
			var _emscripten_stack_init = () => (_emscripten_stack_init = wasmExports["emscripten_stack_init"])();
			var _emscripten_stack_get_free = () => (_emscripten_stack_get_free = wasmExports["emscripten_stack_get_free"])();
			var _emscripten_stack_get_base = () => (_emscripten_stack_get_base = wasmExports["emscripten_stack_get_base"])();
			var _emscripten_stack_get_end = () => (_emscripten_stack_get_end = wasmExports["emscripten_stack_get_end"])();
			var __emscripten_stack_restore = a0 => (__emscripten_stack_restore = wasmExports["_emscripten_stack_restore"])(a0);
			var __emscripten_stack_alloc = a0 => (__emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"])(a0);
			var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"])();
			var ___cxa_increment_exception_refcount = createExportWrapper("__cxa_increment_exception_refcount", 1);
			var _ff_h264_cabac_tables = Module["_ff_h264_cabac_tables"] = 5294040;

			function invoke_viiii(index, a1, a2, a3, a4){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2, a3, a4)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_iii(index, a1, a2){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1, a2)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_iiiii(index, a1, a2, a3, a4){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1, a2, a3, a4)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_v(index){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)()
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_iiii(index, a1, a2, a3){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1, a2, a3)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_vii(index, a1, a2){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_iiiijj(index, a1, a2, a3, a4, a5){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1, a2, a3, a4, a5)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_viii(index, a1, a2, a3){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2, a3)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_ii(index, a1){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_vi(index, a1){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_viiid(index, a1, a2, a3, a4){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2, a3, a4)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_i(index){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)()
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_viiiii(index, a1, a2, a3, a4, a5){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2, a3, a4, a5)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_iiiiii(index, a1, a2, a3, a4, a5){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1, a2, a3, a4, a5)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_viiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_ij(index, a1){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10){
				var sp = stackSave();
				try{
					return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}

			function invoke_viiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11){
				var sp = stackSave();
				try{
					getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
				}catch(e){
					stackRestore(sp);
					if(e !== e + 0) throw e;
					_setThrew(1, 0)
				}
			}
			Module["setValue"] = setValue;
			Module["getValue"] = getValue;
			Module["UTF8ToString"] = UTF8ToString;
			Module["stringToUTF8"] = stringToUTF8;
			Module["lengthBytesUTF8"] = lengthBytesUTF8;
			Module["FS"] = FS;
			var missingLibrarySymbols = ["writeI53ToI64", "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "readI53FromU64", "convertI32PairToI53", "convertI32PairToI53Checked", "convertU32PairToI53", "getTempRet0", "setTempRet0", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "emscriptenLog", "readEmAsmArgs", "jstoi_q", "listenOnce", "autoResumeAudioContext", "getDynCaller", "dynCall", "runtimeKeepalivePush", "runtimeKeepalivePop", "asmjsMangle", "HandleAllocator", "getNativeTypeSize", "STACK_SIZE", "STACK_ALIGN", "POINTER_SIZE", "ASSERTIONS", "getCFunc", "ccall", "cwrap", "uleb128Encode", "sigToWasmTypes", "generateFuncType", "convertJsFunctionToWasm", "getEmptyTableSlot", "updateTableMap", "getFunctionAddress", "addFunction", "removeFunction", "reallyNegative", "unSign", "strLen", "reSign", "formatString", "intArrayToString", "AsciiToString", "stringToNewUTF8", "writeArrayToMemory", "registerKeyEventCallback", "maybeCStringToJsString", "findEventTarget", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "battery", "registerBatteryEventCallback", "setCanvasElementSize", "getCanvasElementSize", "jsStackTrace", "getCallstack", "convertPCtoSourceLocation", "checkWasiClock", "wasiRightsToMuslOFlags", "wasiOFlagsToMuslOFlags", "createDyncallWrapper", "safeSetTimeout", "setImmediateWrapped", "clearImmediateWrapped", "polyfillSetImmediate", "registerPostMainLoop", "registerPreMainLoop", "getPromise", "makePromise", "idsToPromises", "makePromiseCallback", "ExceptionInfo", "findMatchingCatch", "Browser_asyncPrepareDataCounter", "safeRequestAnimationFrame", "arraySum", "addDays", "getSocketFromFD", "getSocketAddress", "FS_unlink", "FS_mkdirTree", "_setNetworkCallback", "heapObjectForWebGLType", "toTypedArrayIndex", "webgl_enable_ANGLE_instanced_arrays", "webgl_enable_OES_vertex_array_object", "webgl_enable_WEBGL_draw_buffers", "webgl_enable_WEBGL_multi_draw", "webgl_enable_EXT_polygon_offset_clamp", "webgl_enable_EXT_clip_control", "webgl_enable_WEBGL_polygon_mode", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "colorChannelsInGlTextureFormat", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "__glGetActiveAttribOrUniform", "writeGLArray", "registerWebGlEventCallback", "runAndAbortIfError", "ALLOC_NORMAL", "ALLOC_STACK", "allocate", "writeStringToMemory", "writeAsciiToMemory", "setErrNo", "demangle", "stackTrace", "getTypeName", "getFunctionName", "getFunctionArgsName", "heap32VectorToArray", "requireRegisteredType", "usesDestructorStack", "createJsInvokerSignature", "checkArgCount", "getRequiredArgCount", "createJsInvoker", "throwUnboundTypeError", "ensureOverloadTable", "exposePublicSymbol", "replacePublicSymbol", "extendError", "createNamedFunction", "getBasestPointer", "registerInheritedInstance", "unregisterInheritedInstance", "getInheritedInstance", "getInheritedInstanceCount", "getLiveInheritedInstances", "enumReadValueFromPointer", "runDestructors", "newFunc", "craftInvokerFunction", "embind__requireFunction", "genericPointerToWireType", "constNoSmartPtrRawPointerToWireType", "nonConstNoSmartPtrRawPointerToWireType", "init_RegisteredPointer", "RegisteredPointer", "RegisteredPointer_fromWireType", "runDestructor", "releaseClassHandle", "detachFinalizer", "attachFinalizer", "makeClassHandle", "init_ClassHandle", "ClassHandle", "throwInstanceAlreadyDeleted", "flushPendingDeletes", "setDelayFunction", "RegisteredClass", "shallowCopyInternalPointer", "downcastPointer", "upcastPointer", "validateThis", "char_0", "char_9", "makeLegalFunctionName", "getStringOrSymbol", "emval_get_global", "emval_returnValue", "emval_lookupTypes", "emval_addMethodCaller"];
			missingLibrarySymbols.forEach(missingLibrarySymbol);
			var unexportedSymbols = ["run", "addOnPreRun", "addOnInit", "addOnPreMain", "addOnExit", "addOnPostRun", "addRunDependency", "removeRunDependency", "out", "err", "callMain", "abort", "wasmMemory", "wasmExports", "writeStackCookie", "checkStackCookie", "readI53FromI64", "INT53_MAX", "INT53_MIN", "bigintToI53Checked", "stackSave", "stackRestore", "stackAlloc", "ptrToString", "zeroMemory", "exitJS", "getHeapMax", "growMemory", "ENV", "ERRNO_CODES", "strError", "DNS", "Protocols", "Sockets", "initRandomFill", "randomFill", "timers", "warnOnce", "readEmAsmArgsArray", "jstoi_s", "getExecutableName", "handleException", "keepRuntimeAlive", "callUserCallback", "maybeExit", "asyncLoad", "alignMemory", "mmapAlloc", "wasmTable", "noExitRuntime", "freeTableIndexes", "functionsInTableMap", "PATH", "PATH_FS", "UTF8Decoder", "UTF8ArrayToString", "stringToUTF8Array", "intArrayFromString", "stringToAscii", "UTF16Decoder", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "stringToUTF8OnStack", "JSEvents", "specialHTMLTargets", "findCanvasEventTarget", "currentFullscreenStrategy", "restoreOldWindowedStyle", "UNWIND_CACHE", "ExitStatus", "getEnvStrings", "doReadv", "doWritev", "promiseMap", "uncaughtExceptionCount", "exceptionLast", "exceptionCaught", "Browser", "getPreloadedImageData__data", "wget", "MONTH_DAYS_REGULAR", "MONTH_DAYS_LEAP", "MONTH_DAYS_REGULAR_CUMULATIVE", "MONTH_DAYS_LEAP_CUMULATIVE", "isLeapYear", "ydayFromDate", "SYSCALLS", "preloadPlugins", "FS_createPreloadedFile", "FS_modeStringToFlags", "FS_getMode", "FS_stdin_getChar_buffer", "FS_stdin_getChar", "FS_createPath", "FS_createDevice", "FS_readFile", "FS_createDataFile", "FS_createLazyFile", "MEMFS", "TTY", "PIPEFS", "SOCKFS", "tempFixedLengthArray", "miniTempWebGLFloatBuffers", "miniTempWebGLIntBuffers", "GL", "AL", "GLUT", "EGL", "GLEW", "IDBStore", "SDL", "SDL_gfx", "allocateUTF8", "allocateUTF8OnStack", "print", "printErr", "InternalError", "BindingError", "throwInternalError", "throwBindingError", "registeredTypes", "awaitingDependencies", "typeDependencies", "tupleRegistrations", "structRegistrations", "sharedRegisterType", "whenDependentTypesAreResolved", "embind_charCodes", "embind_init_charCodes", "readLatin1String", "UnboundTypeError", "PureVirtualError", "GenericWireTypeSize", "EmValType", "EmValOptionalType", "embindRepr", "registeredInstances", "registeredPointers", "registerType", "integerReadValueFromPointer", "floatReadValueFromPointer", "readPointer", "finalizationRegistry", "detachFinalizer_deps", "deletionQueue", "delayFunction", "emval_freelist", "emval_handles", "emval_symbols", "init_emval", "count_emval_handles", "Emval", "emval_methodCallers", "reflectConstruct"];
			unexportedSymbols.forEach(unexportedRuntimeSymbol);
			var calledRun;
			var calledPrerun;
			dependenciesFulfilled = function runCaller(){
				if(!calledRun) run();
				if(!calledRun) dependenciesFulfilled = runCaller
			};

			function stackCheckInit(){
				_emscripten_stack_init();
				writeStackCookie()
			}

			function run(args = arguments_){
				if(runDependencies > 0){
					return
				}
				stackCheckInit();
				if(!calledPrerun){
					calledPrerun = 1;
					preRun();
					if(runDependencies > 0){
						return
					}
				}

				function doRun(){
					if(calledRun) return;
					calledRun = 1;
					Module["calledRun"] = 1;
					if(ABORT) return;
					initRuntime();
					readyPromiseResolve(Module);
					Module["onRuntimeInitialized"]?.();
					assert(!Module["_main"], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');
					postRun()
				}
				if(Module["setStatus"]){
					Module["setStatus"]("Running...");
					setTimeout(() => {
						setTimeout(() => Module["setStatus"](""), 1);
						doRun()
					}, 1)
				}else{
					doRun()
				}
				checkStackCookie()
			}

			function checkUnflushedContent(){
				var oldOut = out;
				var oldErr = err;
				var has = false;
				out = err = x => {
					has = true
				};
				try{
					_fflush(0);
					["stdout", "stderr"].forEach(name => {
						var info = FS.analyzePath("/dev/" + name);
						if(!info) return;
						var stream = info.object;
						var rdev = stream.rdev;
						var tty = TTY.ttys[rdev];
						if(tty?.output?.length){
							has = true
						}
					})
				}catch(e){}
				out = oldOut;
				err = oldErr;
				if(has){
					warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.")
				}
			}
			if(Module["preInit"]){
				if(typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
				while(Module["preInit"].length > 0){
					Module["preInit"].pop()()
				}
			}
			run();
			moduleRtn = readyPromise;
			for(const prop of Object.keys(Module)){
				if(!(prop in moduleArg)){
					Object.defineProperty(moduleArg, prop, {
						configurable: true,
						get(){
							abort(`Access to module property ('${prop}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`)
						}
					})
				}
			}


			return moduleRtn;
		}
	);
})();
if(typeof exports === 'object' && typeof module === 'object')
	module.exports = createFFmpegCore;
else if(typeof define === 'function' && define['amd'])
	define([], () => createFFmpegCore);
export default createFFmpegCore;