const { exec } = require("child_process");

exec(
  "node --trace-deprecation node_modules/.bin/next dev",
  (err, stdout, stderr) => {
    if (err) {
      console.error(`exec error: ${err}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  }
);
