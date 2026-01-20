const fs = require("fs");
const { execFile, spawn } = require("child_process");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

function tmpFileName(ext) {
  return path.join(os.tmpdir(), `${Date.now()}-${uuidv4()}.${ext}`);
}

function writeFile(filePath, content) {
  return fs.promises.writeFile(filePath, content, { encoding: "utf8" });
}

function safeExec(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, Object.assign({ stdio: "pipe" }, options));
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", (err) => reject(err));
    proc.on("close", (code, signal) => {
      resolve({ stdout, stderr, code, signal });
    });
    if (options.timeoutMs) {
      setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch (e) {}
        reject(new Error("Execution timed out"));
      }, options.timeoutMs);
    }
  });
}

async function runFile(language, code, opts = { timeout: 5000 }) {
  // returns { stdout, stderr, code }
  language = language.toLowerCase();
  if (language === "javascript" || language === "js") {
    const file = tmpFileName("mjs"); // use .mjs to allow modern syntax
    await writeFile(file, code);
    try {
      const res = await safeExec("node", [file], { timeoutMs: opts.timeout });
      cleanup(file);
      return { stdout: res.stdout, stderr: res.stderr, exitCode: res.code };
    } catch (err) {
      cleanup(file);
      throw err;
    }
  } else if (language === "python" || language === "py") {
    const file = tmpFileName("py");
    await writeFile(file, code);
    try {
      const res = await safeExec("python", [file], { timeoutMs: opts.timeout });
      cleanup(file);
      return { stdout: res.stdout, stderr: res.stderr, exitCode: res.code };
    } catch (err) {
      cleanup(file);
      throw err;
    }
  } else if (language === "c" || language === "cpp") {
    const ext = language === "c" ? "c" : "cpp";
    const source = tmpFileName(ext);
    const exe = tmpFileName("out");
    await writeFile(source, code);
    try {
      // compile
      const compiler = language === "c" ? "gcc" : "g++";
      const compile = await safeExec(compiler, [source, "-o", exe], { timeoutMs: 10000 });
      if (compile.stderr && !compile.stdout && compile.stderr.length > 0) {
        cleanup(source); cleanup(exe);
        return { stdout: "", stderr: compile.stderr, exitCode: compile.code };
      }
      // run
      const run = await safeExec(exe, [], { timeoutMs: opts.timeout });
      cleanup(source); cleanup(exe);
      return { stdout: run.stdout, stderr: run.stderr, exitCode: run.code };
    } catch (err) {
      cleanup(source); cleanup(exe);
      throw err;
    }
  } else if (language === "java") {
    const source = tmpFileName("java");
    await writeFile(source, code);
    const dir = path.dirname(source);
    const className = "Main" ; // we assume user uses class Main { public static void main... }
    const sourcePath = path.join(dir, `${className}.java`);
    await fs.promises.rename(source, sourcePath);
    try {
      const compile = await safeExec("javac", [sourcePath], { timeoutMs: 10000 });
      if (compile.stderr && compile.stderr.length>0) {
        return { stdout: "", stderr: compile.stderr, exitCode: compile.code };
      }
      const run = await safeExec("java", ["-cp", dir, className], { timeoutMs: opts.timeout });
      return { stdout: run.stdout, stderr: run.stderr, exitCode: run.code };
    } catch (err) {
      throw err;
    } finally {
      // try cleanup - not strict
      try { fs.promises.unlink(sourcePath).catch(()=>{}); } catch(e){}
      try { fs.promises.unlink(path.join(dir, `${className}.class`)).catch(()=>{}); } catch(e){}
    }
  } else {
    throw new Error("Unsupported language: " + language);
  }
}

function cleanup(file) {
  try {
    fs.unlink(file, () => {});
  } catch (e) {}
}

module.exports = { runFile };
