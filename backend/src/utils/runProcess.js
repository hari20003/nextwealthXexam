import { exec } from "child_process";
import fs from "fs";

export function runProcess(code, filename, command) {
  return new Promise((resolve) => {
    fs.writeFileSync(filename, code);

    exec(command, (error, stdout, stderr) => {
      resolve({
        output: stdout,
        error: stderr || (error ? error.message : "")
      });
    });
  });
}
