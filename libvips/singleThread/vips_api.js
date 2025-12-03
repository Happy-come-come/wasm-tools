/**
 * VipsApi を作成する
 * @param {string} vipsWorkerUrl - Worker スクリプトの URL（または Blob URL）
 * @returns {Object} Vips API オブジェクト
 */
export default function createVipsApi(vipsWorkerUrl) {
    let messageId = 0;
    const pendingMessages = new Map();
    let ready = false;
    let worker = null;

    /**
     * vips を初期化する
     * @param {string} wasmUrl - WASM ファイルの URL
     */
    async function init(wasmUrl) {
        if (ready) return;
        
        // Worker を作成
        worker = new Worker(vipsWorkerUrl);
        
        // メッセージハンドラを設定
        worker.onmessage = (e) => {
            const { cmd, id, success, data, message } = e.data;
            const pending = pendingMessages.get(id);
            if (pending) {
                pendingMessages.delete(id);
                if (success) {
                    pending.resolve(data);
                } else {
                    pending.reject(new Error(message));
                }
            }
        };

        worker.onerror = (e) => {
            console.error('Vips Worker error:', e);
        };

        await sendMessage('init', { wasmUrl });
        ready = true;
    }

    function sendMessage(cmd, data = null, transfer = []) {
        return new Promise((resolve, reject) => {
            if (!worker) {
                reject(new Error('Worker not initialized. Call init() first.'));
                return;
            }
            const id = messageId++;
            pendingMessages.set(id, { resolve, reject });
            worker.postMessage({ cmd, id, data }, transfer);
        });
    }

    function toUint8Array(buffer) {
        return buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : buffer;
    }

    /**
     * 画像をリサイズする
     * @param {ArrayBuffer|Uint8Array} inputBuffer - 入力画像
     * @param {number} scale - スケール（0.5 = 50%）
     * @param {string} outputFormat - 出力フォーマット ('jpg', 'png', 'webp')
     * @param {Object} options - 出力オプション
     * @returns {Promise<ArrayBuffer>}
     */
    function resize(inputBuffer, scale, outputFormat = 'jpg', options = {}) {
        return sendMessage('resize', {
            inputBuffer: toUint8Array(inputBuffer),
            scale,
            outputFormat,
            options
        });
    }

    /**
     * 画像を回転する
     * @param {ArrayBuffer|Uint8Array} inputBuffer - 入力画像
     * @param {number} angle - 回転角度
     * @param {string} outputFormat - 出力フォーマット
     * @param {Object} options - 出力オプション
     * @returns {Promise<ArrayBuffer>}
     */
    function rotate(inputBuffer, angle, outputFormat = 'jpg', options = {}) {
        return sendMessage('rotate', {
            inputBuffer: toUint8Array(inputBuffer),
            angle,
            outputFormat,
            options
        });
    }

    /**
     * 画像フォーマットを変換する
     * @param {ArrayBuffer|Uint8Array} inputBuffer - 入力画像
     * @param {string} outputFormat - 出力フォーマット
     * @param {Object} options - 出力オプション（例: { Q: 80 }）
     * @returns {Promise<ArrayBuffer>}
     */
    function convert(inputBuffer, outputFormat, options = {}) {
        return sendMessage('convert', {
            inputBuffer: toUint8Array(inputBuffer),
            outputFormat,
            options
        });
    }

    /**
     * 複数の操作をまとめて実行
     * @param {ArrayBuffer|Uint8Array} inputBuffer - 入力画像
     * @param {Array} operations - 操作リスト
     * @param {string} outputFormat - 出力フォーマット
     * @param {Object} options - 出力オプション
     * @returns {Promise<ArrayBuffer>}
     */
    function process(inputBuffer, operations, outputFormat = 'jpg', options = {}) {
        return sendMessage('process', {
            inputBuffer: toUint8Array(inputBuffer),
            operations,
            outputFormat,
            options
        });
    }

    /**
     * Worker を終了する
     */
    function terminate() {
        if (worker) {
            worker.terminate();
            worker = null;
        }
        ready = false;
        pendingMessages.clear();
    }

    /**
     * 初期化済みかどうか
     * @returns {boolean}
     */
    function isReady() {
        return ready;
    }

    return {
        init,
        resize,
        rotate,
        convert,
        process,
        terminate,
        isReady
    };
}