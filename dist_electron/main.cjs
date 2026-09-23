var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/bytenode/lib/index.js
var require_lib = __commonJS({
  "node_modules/bytenode/lib/index.js"(exports2, module2) {
    "use strict";
    var { ok } = require("node:assert/strict");
    var { spawn } = require("node:child_process");
    var fs2 = require("node:fs");
    var Module2 = require("node:module");
    var path2 = require("node:path");
    var vm2 = require("node:vm");
    var v8 = require("node:v8");
    var { brotliCompressSync, brotliDecompressSync } = require("node:zlib");
    v8.setFlagsFromString("--no-lazy");
    if (Number.parseInt(process.versions.node, 10) >= 12) {
      v8.setFlagsFromString("--no-flush-bytecode");
    }
    function isBuffer(obj) {
      return obj != null && obj.constructor != null && typeof obj.constructor.isBuffer === "function" && obj.constructor.isBuffer(obj);
    }
    var COMPILED_EXTNAME = ".jsc";
    var MAGIC_NUMBER = Buffer.from([222, 192]);
    var ZERO_LENGTH_EXTERNAL_REFERENCE_TABLE = Buffer.alloc(2);
    var sheBangRegex = /^#!.*/;
    var DEBUG = !!process.env.BYTENODE_DEBUG;
    function dumpBytecodeHeader(label, buffer) {
      const names = [
        "magic        @0 ",
        "versionHash  @4 ",
        "sourceHash   @8 ",
        "flagHash     @12",
        "roChecksum   @16",
        "payloadLen   @20",
        "checksum     @24"
      ];
      const lines = [`[bytenode] ${label} (buffer length = ${buffer.length})`];
      for (let i = 0; i < names.length; i++) {
        const off = i * 4;
        if (off + 4 > buffer.length) break;
        const v = buffer.readUInt32LE(off);
        lines.push(`  ${names[i]} = 0x${v.toString(16).padStart(8, "0")} (${v})`);
      }
      console.error(lines.join("\n"));
    }
    function generateScript(cachedData, filename) {
      if (!isBufferV8Bytecode(cachedData)) {
        cachedData = brotliDecompressSync(cachedData);
        ok(isBufferV8Bytecode(cachedData), "Invalid bytecode buffer");
      }
      if (DEBUG) {
        console.error(`[bytenode] loading ${filename || "<buffer>"}`);
        console.error(`[bytenode] runtime: node ${process.version}` + (process.versions.electron ? `, electron ${process.versions.electron}` : "") + `, v8 ${process.versions.v8}`);
        dumpBytecodeHeader("on-disk .jsc header (before fixBytecode)", cachedData);
        try {
          dumpBytecodeHeader("runtime dummy header (what V8 expects)", compileCode('"\u0CA0_\u0CA0"'));
        } catch (err) {
          console.error("[bytenode] failed to compile runtime dummy:", err && err.message);
        }
      }
      fixBytecode(cachedData);
      if (DEBUG) {
        dumpBytecodeHeader("on-disk .jsc header (after fixBytecode)", cachedData);
      }
      const length = readSourceHash(cachedData);
      let dummyCode = "";
      if (length > 1) {
        dummyCode = '"' + "\u200B".repeat(length - 2) + '"';
      }
      if (DEBUG) {
        console.error(`[bytenode] sourceHash/dummy length = ${length}; about to call new vm.Script(...)`);
      }
      const script = new vm2.Script(dummyCode, { cachedData, filename });
      if (script.cachedDataRejected) {
        throw new Error("Invalid or incompatible cached data (cachedDataRejected)");
      }
      if (DEBUG) {
        console.error("[bytenode] vm.Script created, cachedData accepted.");
      }
      return script;
    }
    function isBufferV8Bytecode(buffer) {
      return isBuffer(buffer) && !buffer.subarray(0, 2).equals(ZERO_LENGTH_EXTERNAL_REFERENCE_TABLE) && buffer.subarray(2, 4).equals(MAGIC_NUMBER);
    }
    var compileCode = function(javascriptCode, compress) {
      if (typeof javascriptCode !== "string") {
        throw new Error(`javascriptCode must be string. ${typeof javascriptCode} was given.`);
      }
      const script = new vm2.Script(javascriptCode, {
        produceCachedData: true
      });
      let bytecodeBuffer = script.createCachedData && script.createCachedData.call ? script.createCachedData() : script.cachedData;
      if (compress) bytecodeBuffer = brotliCompressSync(bytecodeBuffer);
      return bytecodeBuffer;
    };
    var compileElectronCode = function(javascriptCode, options) {
      return new Promise((resolve, reject) => {
        function onEnd() {
          if (options.compress) data = brotliCompressSync(data);
          resolve(data);
        }
        options = options || {};
        let data = Buffer.from([]);
        const electronPath = options.electronPath ? path2.normalize(options.electronPath) : (
          /** @type {string} */
          require("electron")
        );
        if (!fs2.existsSync(electronPath)) {
          throw new Error("Electron not found");
        }
        const bytenodePath = path2.join(__dirname, "cli.js");
        const child = spawn(electronPath, [bytenodePath, "--compile", "--no-module", "-"], {
          env: { ELECTRON_RUN_AS_NODE: "1" },
          stdio: ["pipe", "pipe", "pipe", "ipc"]
        });
        if (child.stdin) {
          child.stdin.write(javascriptCode);
          child.stdin.end();
        }
        if (child.stdout) {
          child.stdout.on("data", (chunk) => {
            data = Buffer.concat([data, chunk]);
          });
          child.stdout.on("error", (err) => {
            console.error(err);
          });
          child.stdout.on("end", onEnd);
        }
        if (child.stderr) {
          child.stderr.on("data", (chunk) => {
            console.error("Error: ", chunk.toString());
          });
          child.stderr.on("error", (err) => {
            console.error("Error: ", err);
          });
        }
        child.addListener("message", (message) => console.log(message));
        child.addListener("error", (err) => console.error(err));
        child.on("error", (err) => reject(err));
        child.on("exit", onEnd);
      });
    };
    var compileElectronMainCode = function(javascriptCode, options) {
      return new Promise((resolve, reject) => {
        options = options || {};
        const os = require("node:os");
        const electronPath = options.electronPath ? path2.normalize(options.electronPath) : (
          /** @type {string} */
          require("electron")
        );
        if (!fs2.existsSync(electronPath)) {
          throw new Error("Electron not found");
        }
        const tmpDir = fs2.mkdtempSync(path2.join(os.tmpdir(), "bytenode-electron-main-"));
        const inFile = path2.join(tmpDir, "input.js");
        const outFile = path2.join(tmpDir, "output.jsc");
        const compilerScript = path2.join(tmpDir, "compiler.js");
        fs2.writeFileSync(inFile, javascriptCode);
        const compilerSource = [
          "const { app } = require('electron');",
          "const fs = require('fs');",
          "const vm = require('vm');",
          "const v8 = require('v8');",
          "v8.setFlagsFromString('--no-lazy');",
          "v8.setFlagsFromString('--no-flush-bytecode');",
          // No renderer/window is created, so the Chromium sandbox is irrelevant here.
          // Disabling it avoids failures when Electron is launched as root in CI containers.
          'if (typeof app.disableHardwareAcceleration === "function") app.disableHardwareAcceleration();',
          "function run () {",
          "  try {",
          "    const code = fs.readFileSync(" + JSON.stringify(inFile) + ", 'utf-8');",
          "    const script = new vm.Script(code, { produceCachedData: true });",
          "    const buf = (script.createCachedData && script.createCachedData.call) ? script.createCachedData() : script.cachedData;",
          "    fs.writeFileSync(" + JSON.stringify(outFile) + ", buf);",
          // Use app.exit(code) rather than `process.exitCode = code; app.quit()`:
          // app.quit() runs the graceful-shutdown path and does NOT propagate
          // process.exitCode, so a failed compile would otherwise exit 0 and the
          // parent would misreport the real error as a missing-output-file ENOENT.
          "    app.exit(0);",
          "  } catch (err) {",
          '    process.stderr.write(String((err && err.stack) || err) + "\\n");',
          "    app.exit(1);",
          "  }",
          "}",
          "app.whenReady().then(run);"
        ].join("\n");
        fs2.writeFileSync(compilerScript, compilerSource);
        const cleanup = () => {
          try {
            fs2.rmSync(tmpDir, { recursive: true, force: true });
          } catch (_) {
          }
        };
        const child = spawn(electronPath, ["--no-sandbox", compilerScript], {
          // Deliberately NOT setting ELECTRON_RUN_AS_NODE: we want the browser/main process.
          env: process.env,
          // Capture (don't inherit) the child's streams. A real Electron browser
          // process prints benign startup noise (GPU/Vulkan/deprecation warnings) to
          // stderr; inheriting it pollutes the caller's output and makes a genuine
          // compile error indistinguishable from chatter. We buffer both streams and
          // surface them only when they matter: folded into the rejection on failure,
          // or printed when BYTENODE_DEBUG is set.
          stdio: ["ignore", "pipe", "pipe"]
        });
        let stdout = "";
        let stderr = "";
        if (child.stdout) {
          child.stdout.setEncoding("utf8");
          child.stdout.on("data", (chunk) => {
            stdout += chunk;
          });
        }
        if (child.stderr) {
          child.stderr.setEncoding("utf8");
          child.stderr.on("data", (chunk) => {
            stderr += chunk;
          });
        }
        child.on("error", (err) => {
          cleanup();
          reject(err);
        });
        child.on("close", (code, signal) => {
          if (DEBUG && (stdout || stderr)) {
            console.error("[bytenode] electronMain stdout:\n" + stdout);
            console.error("[bytenode] electronMain stderr:\n" + stderr);
          }
          if (code !== 0) {
            cleanup();
            const detail = stderr.trim() || stdout.trim();
            const how = signal ? "signal " + signal : "exit code " + code;
            reject(new Error(
              "Electron main-process bytecode compilation failed (" + how + ")" + (detail ? ":\n" + detail : "")
            ));
            return;
          }
          try {
            let data = fs2.readFileSync(outFile);
            if (options.compress) data = brotliCompressSync(data);
            cleanup();
            resolve(data);
          } catch (err) {
            cleanup();
            reject(err);
          }
        });
      });
    };
    var compileElectronRendererCode = function(javascriptCode, options) {
      return new Promise((resolve, reject) => {
        options = options || {};
        const os = require("node:os");
        const electronPath = options.electronPath ? path2.normalize(options.electronPath) : (
          /** @type {string} */
          require("electron")
        );
        if (!fs2.existsSync(electronPath)) {
          throw new Error("Electron not found");
        }
        const tmpDir = fs2.mkdtempSync(path2.join(os.tmpdir(), "bytenode-electron-renderer-"));
        const inFile = path2.join(tmpDir, "input.js");
        const outFile = path2.join(tmpDir, "output.jsc");
        const mainScript = path2.join(tmpDir, "main.js");
        const preloadScript = path2.join(tmpDir, "preload.js");
        const userDataDir = path2.join(tmpDir, "user-data");
        fs2.writeFileSync(inFile, javascriptCode);
        const mainSource = [
          "const { app, BrowserWindow, ipcMain } = require('electron');",
          "app.disableHardwareAcceleration();",
          "ipcMain.on('bytenode-done', (_event, err) => {",
          '  if (err) process.stderr.write(err + "\\n");',
          "  app.exit(err ? 1 : 0);",
          "});",
          "app.whenReady().then(() => {",
          "  const win = new BrowserWindow({",
          "    show: false,",
          "    webPreferences: {",
          "      preload: " + JSON.stringify(preloadScript) + ",",
          "      nodeIntegration: true,",
          "      contextIsolation: false,",
          "      sandbox: false",
          "    }",
          "  });",
          "  win.webContents.on('render-process-gone', (_event, details) => {",
          "    process.stderr.write('renderer process gone: ' + details.reason + '\\n');",
          "    app.exit(2);",
          "  });",
          "  win.loadURL('about:blank');",
          "});"
        ].join("\n");
        const preloadSource = [
          "const { ipcRenderer } = require('electron');",
          "try {",
          "  require(" + JSON.stringify(__filename) + ");",
          "  const fs = require('fs');",
          "  const vm = require('vm');",
          "  const code = fs.readFileSync(" + JSON.stringify(inFile) + ", 'utf-8');",
          "  const script = new vm.Script(code, { produceCachedData: true });",
          "  fs.writeFileSync(" + JSON.stringify(outFile) + ", script.createCachedData());",
          "  ipcRenderer.send('bytenode-done');",
          "} catch (err) {",
          "  ipcRenderer.send('bytenode-done', String((err && err.stack) || err));",
          "}"
        ].join("\n");
        fs2.writeFileSync(mainScript, mainSource);
        fs2.writeFileSync(preloadScript, preloadSource);
        const cleanup = () => {
          try {
            fs2.rmSync(tmpDir, { recursive: true, force: true });
          } catch (_) {
          }
        };
        const args = [mainScript, "--no-sandbox", "--user-data-dir=" + userDataDir];
        const env = Object.assign({}, process.env);
        delete env.ELECTRON_RUN_AS_NODE;
        const child = spawn(electronPath, args, { env, stdio: ["ignore", "pipe", "pipe"] });
        let output = "";
        child.stdout.on("data", (chunk) => {
          output += chunk;
        });
        child.stderr.on("data", (chunk) => {
          output += chunk;
        });
        child.on("error", (err) => {
          cleanup();
          reject(err);
        });
        child.on("close", (code) => {
          try {
            if (code !== 0) {
              throw new Error("Electron renderer bytecode compilation failed (exit code " + code + ")" + (output.trim() ? ":\n" + output.trim() : ""));
            }
            let data = fs2.readFileSync(outFile);
            if (options.compress) data = brotliCompressSync(data);
            resolve(data);
          } catch (err) {
            reject(err);
          } finally {
            cleanup();
          }
        });
      });
    };
    var fixBytecode = function(bytecodeBuffer) {
      if (!isBuffer(bytecodeBuffer)) {
        throw new Error("bytecodeBuffer must be a buffer object.");
      }
      const dummyBytecode = compileCode('"\u0CA0_\u0CA0"');
      const version = parseFloat(process.version.slice(1, 5));
      if (process.version.startsWith("v8.8") || process.version.startsWith("v8.9")) {
        if (DEBUG) console.error("[bytenode] fixBytecode branch: legacy v8.8/v8.9 (patch 16-20, 20-24)");
        dummyBytecode.subarray(16, 20).copy(bytecodeBuffer, 16);
        dummyBytecode.subarray(20, 24).copy(bytecodeBuffer, 20);
      } else if (version >= 12) {
        if (DEBUG) console.error("[bytenode] fixBytecode branch: modern node>=12 (patch flag hash 12-16 only)");
        dummyBytecode.subarray(12, 16).copy(bytecodeBuffer, 12);
      } else {
        if (DEBUG) console.error("[bytenode] fixBytecode branch: node 9/10/11 (patch 12-16, 16-20)");
        dummyBytecode.subarray(12, 16).copy(bytecodeBuffer, 12);
        dummyBytecode.subarray(16, 20).copy(bytecodeBuffer, 16);
      }
    };
    var readSourceHash = function(bytecodeBuffer) {
      if (!isBuffer(bytecodeBuffer)) {
        throw new Error("bytecodeBuffer must be a buffer object.");
      }
      if (process.version.startsWith("v8.8") || process.version.startsWith("v8.9")) {
        return bytecodeBuffer.subarray(12, 16).reduce((sum, number, power) => sum += number * Math.pow(256, power), 0);
      } else {
        return bytecodeBuffer.subarray(8, 12).reduce((sum, number, power) => sum += number * Math.pow(256, power), 0);
      }
    };
    var runBytecode = function(bytecodeBuffer) {
      if (!isBuffer(bytecodeBuffer)) {
        throw new Error("bytecodeBuffer must be a buffer object.");
      }
      const script = generateScript(bytecodeBuffer);
      return script.runInThisContext();
    };
    var compileFile = async function(args, output) {
      let filename, compileAsModule, compress, electron, electronMain, electronRenderer, createLoader, loaderFilename, electronPath;
      if (typeof args === "string") {
        filename = args;
        compileAsModule = true;
        compress = false;
        electron = false;
        electronMain = false;
        createLoader = false;
      } else if (typeof args === "object") {
        filename = args.filename;
        compileAsModule = args.compileAsModule !== false;
        compress = args.compress;
        electron = args.electron || !!args.electronPath;
        electronMain = args.electronMain;
        electronRenderer = args.electronRenderer;
        electronPath = args.electronPath;
        createLoader = args.createLoader;
        loaderFilename = args.loaderFilename;
        if (loaderFilename && !createLoader) createLoader = true;
      }
      if (typeof filename !== "string") {
        throw new Error(`filename must be a string. ${typeof filename} was given.`);
      }
      if (createLoader && typeof createLoader !== "string") {
        createLoader = "commonjs";
      }
      const compiledFilename = args.output || output || filename.slice(0, -path2.extname(filename).length) + COMPILED_EXTNAME;
      if (typeof compiledFilename !== "string") {
        throw new Error(`output must be a string. ${typeof compiledFilename} was given.`);
      }
      const javascriptCode = fs2.readFileSync(filename, "utf-8");
      const sheBang = javascriptCode.match(sheBangRegex);
      let code = javascriptCode.replace(sheBangRegex, "");
      if (compileAsModule) {
        code = Module2.wrap(code);
      }
      let bytecodeBuffer;
      if (electronMain && electronRenderer) {
        throw new Error("electronMain and electronRenderer are mutually exclusive: bytecode for one context is rejected in the other.");
      }
      if (electronRenderer) {
        bytecodeBuffer = await compileElectronRendererCode(code, { compress, electronPath });
      } else if (electronMain) {
        bytecodeBuffer = await compileElectronMainCode(code, { compress, electronPath });
      } else if (electron) {
        bytecodeBuffer = await compileElectronCode(code, { compress, electronPath });
      } else {
        bytecodeBuffer = compileCode(code, compress);
      }
      fs2.writeFileSync(compiledFilename, bytecodeBuffer);
      if (createLoader) {
        addLoaderFile(compiledFilename, loaderFilename, createLoader, sheBang);
      }
      return compiledFilename;
    };
    var runBytecodeFile = function(filename) {
      if (typeof filename !== "string") {
        throw new Error(`filename must be a string. ${typeof filename} was given.`);
      }
      const bytecodeBuffer = fs2.readFileSync(filename);
      return runBytecode(bytecodeBuffer);
    };
    Module2._extensions[COMPILED_EXTNAME] = function(fileModule, filename) {
      const bytecodeBuffer = fs2.readFileSync(filename);
      const script = generateScript(bytecodeBuffer, filename);
      function require2(id) {
        return fileModule.require(id);
      }
      require2.resolve = function(request, options) {
        return Module2._resolveFilename(request, fileModule, false, options);
      };
      if (process.main) {
        require2.main = process.main;
      }
      require2.extensions = Module2._extensions;
      require2.cache = Module2._cache;
      const compiledWrapper = script.runInThisContext({
        filename,
        lineOffset: 0,
        columnOffset: 0,
        displayErrors: true
      });
      const dirname = path2.dirname(filename);
      const args = [
        fileModule.exports,
        require2,
        fileModule,
        filename,
        dirname,
        process,
        global
      ];
      return compiledWrapper.apply(fileModule.exports, args);
    };
    var addLoaderFile = function(fileToLoad, loaderFilename, type, sheBang) {
      let loaderFilePath;
      if (typeof loaderFilename === "boolean" || loaderFilename === void 0 || loaderFilename === "") {
        loaderFilePath = fileToLoad.replace(COMPILED_EXTNAME, ".loader.js");
      } else {
        loaderFilename = loaderFilename.replace("%", path2.parse(fileToLoad).name);
        loaderFilePath = path2.join(path2.dirname(fileToLoad), loaderFilename);
      }
      const loaderCode = type === "module" ? loaderCodeModule : loaderCodeCommonJS;
      const relativePath = path2.relative(path2.dirname(loaderFilePath), fileToLoad);
      const code = loaderCode("./" + relativePath, sheBang, loaderFilePath);
      fs2.writeFileSync(loaderFilePath, code);
    };
    var loaderCodeCommonJS = function(targetPath, sheBang) {
      const lines = [
        `require('bytenode')`,
        ``,
        `module.exports = require('${targetPath}')`
      ];
      if (sheBang) {
        lines.unshift(sheBang, "");
      }
      return lines.join("\n");
    };
    var loaderCodeModule = function(targetPath, sheBang, loaderFilePath) {
      const lines = [
        `import { createRequire } from 'node:module'`,
        ``,
        `import 'bytenode'`,
        ``,
        ``,
        `const require = createRequire(import.meta.url)`,
        ``
      ];
      if (sheBang) {
        lines.unshift(sheBang, "");
        lines.push(`require('${targetPath}')`);
      } else {
        let { default: defaultExport, ...namedExports } = require(loaderFilePath);
        defaultExport = defaultExport ? "default: defaultExport" : "";
        namedExports = Object.keys(namedExports);
        let exports3 = [];
        if (defaultExport) {
          exports3.push(defaultExport);
        }
        exports3 = exports3.concat(namedExports).join(", ");
        if (!exports3) {
          lines.push(`require('${targetPath}')`);
        } else {
          lines.push(`const {${exports3}} = require('${targetPath}')`, ``, ``);
          if (defaultExport) {
            lines.push("export default defaultExport");
          }
          if (namedExports.length) {
            lines.push(`export { ${namedExports} }`);
          }
        }
      }
      return lines.join("\n");
    };
    global.bytenode = {
      compileCode,
      compileFile,
      compileElectronCode,
      compileElectronMainCode,
      compileElectronRendererCode,
      runBytecode,
      runBytecodeFile,
      addLoaderFile,
      loaderCode: loaderCodeCommonJS,
      loaderCodeCommonJS,
      loaderCodeModule
    };
    module2.exports = global.bytenode;
  }
});

// dist_electron/loader_temp.cjs
var path = require("path");
var fs = require("fs");
var crypto = require("crypto");
var vm = require("vm");
var Module = require("module");
var bytenode = require_lib();
var bytecodePath = path.join(__dirname, "main.jsc");
var sealedPath = path.join(__dirname, "main.sealed");
var running = false;
if (fs.existsSync(bytecodePath)) {
  try {
    module.exports = require(bytecodePath);
    running = true;
  } catch (v8Err) {
  }
}
if (!running && fs.existsSync(sealedPath)) {
  try {
    const raw = JSON.parse(fs.readFileSync(sealedPath, "utf8"));
    const salt = Buffer.from(raw.salt, "hex");
    const iv = Buffer.from(raw.iv, "hex");
    const tag = Buffer.from(raw.tag, "hex");
    const ciphertext = Buffer.from(raw.ciphertext, "hex");
    const key = crypto.pbkdf2Sync("MAHR_RUNTIME_SEALED_CONTAINER_V24", salt, 1e4, 32, "sha256");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    const code = decrypted.toString("utf8");
    const wrapper = Module.wrap(code);
    const compiled = vm.runInThisContext(wrapper, { filename: "mahr-desktop-core.cjs" });
    compiled(exports, require, module, __filename, __dirname);
    running = true;
  } catch (sealErr) {
    console.warn("[MAHR Engine] Sealed payload adapter log:", sealErr.message);
  }
}
if (!running) {
  const runner = path.join(__dirname, "desktop-runner.cjs");
  if (fs.existsSync(runner)) {
    module.exports = require(runner);
    running = true;
  } else {
    console.error("Fatal: Could not initialize MAHR autonomous engine.");
    process.exit(1);
  }
}
