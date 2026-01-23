const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

function tmpFileName(ext) {
  return path.join(os.tmpdir(), `${Date.now()}-${uuidv4()}.${ext}`);
}

function writeFile(filePath, content) {
  return fs.promises.writeFile(filePath, content, { encoding: "utf8" });
}

function safeExec(cmd, args, input = "", options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, Object.assign({ stdio: "pipe" }, options));

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));

    proc.on("error", (err) => reject(err));

    proc.on("close", (code) => {
      resolve({ stdout, stderr, code });
    });

    // ✅ SEND INPUT TO PROGRAM
    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();

    if (options.timeoutMs) {
      setTimeout(() => {
        try { proc.kill("SIGKILL"); } catch (e) {}
        reject(new Error("Execution timed out"));
      }, options.timeoutMs);
    }
  });
}

async function runFile(language, code, input = "", opts = { timeout: 5000 }) {
  language = language.toLowerCase();

  if (language === "javascript" || language === "js") {
    const file = tmpFileName("mjs");
    await writeFile(file, code);

    const res = await safeExec("node", [file], input, { timeoutMs: opts.timeout });
    cleanup(file);
    return { stdout: res.stdout, stderr: res.stderr, exitCode: res.code };
  }

  else if (language === "python" || language === "py") {
    const file = tmpFileName("py");
    await writeFile(file, code);

    const res = await safeExec("python", [file], input, { timeoutMs: opts.timeout });
    cleanup(file);
    return { stdout: res.stdout, stderr: res.stderr, exitCode: res.code };
  }

  else if (language === "c" || language === "cpp") {
    const ext = language === "c" ? "c" : "cpp";
    const source = tmpFileName(ext);
    const exe = tmpFileName("out");

    await writeFile(source, code);

    const compiler = language === "c" ? "gcc" : "g++";
    const compile = await safeExec(compiler, [source, "-o", exe], "", { timeoutMs: 10000 });

    if (compile.stderr) {
      cleanup(source); cleanup(exe);
      return { stdout: "", stderr: compile.stderr, exitCode: compile.code };
    }

    const run = await safeExec(exe, [], input, { timeoutMs: opts.timeout });

    cleanup(source); cleanup(exe);
    return { stdout: run.stdout, stderr: run.stderr, exitCode: run.code };
  }

  else if (language === "java") {
    const source = tmpFileName("java");
    await writeFile(source, code);

    const dir = path.dirname(source);
    const className = "Main";
    const sourcePath = path.join(dir, `${className}.java`);
    await fs.promises.rename(source, sourcePath);

    const compile = await safeExec("javac", [sourcePath], "", { timeoutMs: 10000 });

    if (compile.stderr) {
      return { stdout: "", stderr: compile.stderr, exitCode: compile.code };
    }

    const run = await safeExec("java", ["-cp", dir, className], input, { timeoutMs: opts.timeout });

    cleanup(sourcePath);
    cleanup(path.join(dir, `${className}.class`));

    return { stdout: run.stdout, stderr: run.stderr, exitCode: run.code };
  }

  else {
    throw new Error("Unsupported language: " + language);
  }
}

function cleanup(file) {
  try { fs.unlink(file, () => {}); } catch (e) {}
}

module.exports = { runFile };
