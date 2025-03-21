// const.ts
var CORE_VERSION = "0.12.10";
var CORE_URL = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`;

// errors.ts
var ERROR_UNKNOWN_MESSAGE_TYPE = new Error("unknown message type");
var ERROR_NOT_LOADED = new Error("ffmpeg is not loaded, call `await ffmpeg.load()` first");
var ERROR_TERMINATED = new Error("called FFmpeg.terminate()");
var ERROR_IMPORT_FAILURE = new Error("failed to import ffmpeg-core.js");

// worker.ts
var ffmpeg;
var load = async ({
	coreURL: _coreURL,
	wasmURL: _wasmURL,
	workerURL: _workerURL
}) => {
	const first = !ffmpeg;
	try{
		if(!_coreURL)_coreURL = CORE_URL;
		importScripts(_coreURL);
	}catch{
		if(!_coreURL || _coreURL === CORE_URL)_coreURL = CORE_URL.replace("/umd/", "/esm/");
		self.createFFmpegCore = (await import(_coreURL)).default;
		if(!self.createFFmpegCore){
			throw ERROR_IMPORT_FAILURE;
		}
	}
	const coreURL = _coreURL;
	const wasmURL = _wasmURL ? _wasmURL : _coreURL.replace(/.js$/g, ".wasm");
	const workerURL = _workerURL ? _workerURL : _coreURL.replace(/.js$/g, ".worker.js");
	ffmpeg = await self.createFFmpegCore({
		mainScriptUrlOrBlob: `${btoa(JSON.stringify({ wasmURL, workerURL }))}`
	});
	ffmpeg.setLogger((data) => self.postMessage({ type: "LOG" /* LOG */, data }));
	ffmpeg.setProgress((data) => self.postMessage({
		type: "PROGRESS" /* PROGRESS */,
		data
	}));
	return first;
};
var exec = ({ args, timeout = -1 }) => {
	ffmpeg.setTimeout(timeout);
	ffmpeg.exec(...args);
	const ret = ffmpeg.ret;
	ffmpeg.reset();
	return ret;
};
var ffprobe = ({ args, timeout = -1 }) => {
	ffmpeg.setTimeout(timeout);
	ffmpeg.ffprobe(...args);
	const ret = ffmpeg.ret;
	ffmpeg.reset();
	return ret;
};
var writeFile = ({ path, data }) => {
	ffmpeg.FS.writeFile(path, data);
	return true;
};
var readFile = ({ path, encoding }) => ffmpeg.FS.readFile(path, { encoding });
var deleteFile = ({ path }) => {
	ffmpeg.FS.unlink(path);
	return true;
};
var rename = ({ oldPath, newPath }) => {
	ffmpeg.FS.rename(oldPath, newPath);
	return true;
};
var createDir = ({ path }) => {
	ffmpeg.FS.mkdir(path);
	return true;
};
var listDir = ({ path }) => {
	const names = ffmpeg.FS.readdir(path);
	const nodes = [];
	for(const name of names){
		const stat = ffmpeg.FS.stat(`${path}/${name}`);
		const isDir = ffmpeg.FS.isDir(stat.mode);
		nodes.push({ name, isDir });
	}
	return nodes;
};
var deleteDir = ({ path }) => {
	ffmpeg.FS.rmdir(path);
	return true;
};
var mount = ({ fsType, options, mountPoint }) => {
	const str = fsType;
	const fs = ffmpeg.FS.filesystems[str];
	if(!fs)return false;
	ffmpeg.FS.mount(fs, options, mountPoint);
	return true;
};
var unmount = ({ mountPoint }) => {
	ffmpeg.FS.unmount(mountPoint);
	return true;
};
self.onmessage = async ({
	data: { id, type, data: _data }
}) => {
	const trans = [];
	let data;
	try{
		if(type !== "LOAD" /* LOAD */ && !ffmpeg)throw ERROR_NOT_LOADED;
		switch(type){
			case "LOAD" /* LOAD */:
				data = await load(_data);
				break;
			case "EXEC" /* EXEC */:
				data = exec(_data);
				break;
			case "FFPROBE" /* FFPROBE */:
				data = ffprobe(_data);
				break;
			case "WRITE_FILE" /* WRITE_FILE */:
				data = writeFile(_data);
				break;
			case "READ_FILE" /* READ_FILE */:
				data = readFile(_data);
				break;
			case "DELETE_FILE" /* DELETE_FILE */:
				data = deleteFile(_data);
				break;
			case "RENAME" /* RENAME */:
				data = rename(_data);
				break;
			case "CREATE_DIR" /* CREATE_DIR */:
				data = createDir(_data);
				break;
			case "LIST_DIR" /* LIST_DIR */:
				data = listDir(_data);
				break;
			case "DELETE_DIR" /* DELETE_DIR */:
				data = deleteDir(_data);
				break;
			case "MOUNT" /* MOUNT */:
				data = mount(_data);
				break;
			case "UNMOUNT" /* UNMOUNT */:
				data = unmount(_data);
				break;
			default:
				throw ERROR_UNKNOWN_MESSAGE_TYPE;
		}
	}catch(e){
		self.postMessage({
			id,
			type: "ERROR" /* ERROR */,
			data: e.toString()
		});
		return;
	}
	if(data instanceof Uint8Array){
		trans.push(data.buffer);
	}
	self.postMessage({ id, type, data }, trans);
};
