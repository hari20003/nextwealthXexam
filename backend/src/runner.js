import fs from "fs";
import { spawn } from "child_process";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";

/* ================= HELPERS ================= */

function tmpFile(ext) {
  return path.join(os.tmpdir(), `${Date.now()}-${uuidv4()}.${ext}`);
}

function writeFile(file, content) {
  return fs.promises.writeFile(file, content, "utf8");
}

/* 
  Safe process runner
  ✔ supports input
  ✔ timeout protection
  ✔ never crashes backend
*/
function runProcess(cmd, args, { input = "", timeout = 6000, cwd = undefined } = {}) {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args, { stdio: "pipe", cwd });

    let stdout = "";
    let stderr = "";
    let killed = false;

    proc.stdout.on("data", d => stdout += d.toString());
    proc.stderr.on("data", d => stderr += d.toString());

    // ✅ send input
    if (input) {
      proc.stdin.write(input);
    }
    proc.stdin.end();

    const timer = setTimeout(() => {
      killed = true;
      proc.kill("SIGKILL");
    }, timeout);

    proc.on("close", (code) => {
      clearTimeout(timer);

      if (killed) {
        return resolve({
          stdout: "",
          stderr: "⏱ Execution timed out (possible infinite loop or waiting for input)",
          exitCode: -1
        });
      }

      resolve({ stdout, stderr, exitCode: code });
    });

    proc.on("error", err => {
      clearTimeout(timer);
      resolve({
        stdout: "",
        stderr: err.message,
        exitCode: -1
      });
    });
  });
}

/* ================= MAIN ENGINE ================= */

export async function runFile(language, code, input = "") {
  language = language.toLowerCase();

  try {

    /* ---------- JavaScript ---------- */
    if (language === "javascript" || language === "js") {
      const file = tmpFile("mjs");
      await writeFile(file, code);

      const result = await runProcess("node", [file], { input });
      fs.unlink(file, () => {});
      return result;
    }

    /* ---------- Python ---------- */
    if (language === "python" || language === "py") {
      const file = tmpFile("py");
      await writeFile(file, code);

      const result = await runProcess("python", [file], { input });
      fs.unlink(file, () => {});
      return result;
    }

    /* ---------- C ---------- */
    if (language === "c") {
      const src = tmpFile("c");
      const exe = tmpFile(process.platform === "win32" ? "exe" : "out");

      await writeFile(src, code);

      const compile = await runProcess("gcc", [src, "-o", exe], { timeout: 10000 });
      if (compile.stderr) {
        fs.unlink(src, () => {});
        return compile;
      }

      const run = await runProcess(exe, [], { input });
      fs.unlink(src, () => {});
      fs.unlink(exe, () => {});
      return run;
    }

    /* ---------- C++ ---------- */
    if (language === "cpp") {
      const src = tmpFile("cpp");
      const exe = tmpFile(process.platform === "win32" ? "exe" : "out");

      await writeFile(src, code);

      const compile = await runProcess("g++", [src, "-o", exe], { timeout: 10000 });
      if (compile.stderr) {
        fs.unlink(src, () => {});
        return compile;
      }

      const run = await runProcess(exe, [], { input });
      fs.unlink(src, () => {});
      fs.unlink(exe, () => {});
      return run;
    }

    /* ---------- Java ---------- */
    if (language === "java") {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "java-"));
      const sourcePath = path.join(dir, "Main.java");

      await writeFile(sourcePath, code);

      const compile = await runProcess("javac", ["Main.java"], {
        cwd: dir,
        timeout: 12000
      });

      if (compile.stderr) {
        fs.rmSync(dir, { recursive: true, force: true });
        return compile;
      }

      const run = await runProcess("java", ["Main"], {
        cwd: dir,
        input
      });

      fs.rmSync(dir, { recursive: true, force: true });
      return run;
    }

    return {
      stdout: "",
      stderr: "Unsupported language",
      exitCode: 1
    };

  } catch (err) {
    return {
      stdout: "",
      stderr: "Execution error: " + err.message,
      exitCode: 1
    };
  }
}
