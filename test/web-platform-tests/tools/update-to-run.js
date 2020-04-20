"use strict";
const path = require("path");
const fs = require("fs");
const childProcess = require("child_process");
const jsYAML = require("js-yaml");
const Mocha = require("mocha");

const mocha = new Mocha({});

const command = `git submodule status ${resolveWpt("tests")} | awk '{ printf $1 }'`;
const wptSHA1 = String(childProcess.execSync(command));

const toRunFilename = resolveWpt("to-run.yaml");
const toRunString = fs.readFileSync(toRunFilename, { encoding: "utf-8" });
const toRunDocs = jsYAML.safeLoad(toRunString, { filename: toRunFilename });
const toRunObj = {};

toRunDocs.forEach(doc => {
  toRunObj[doc.DIR] = doc;
});

mocha.addFile(resolveWpt("run-wpts.js"));

let reason = null;
mocha
  .run()
  .on("fail", (test, err) => {
    if (err.message.startsWith("Error: test harness should not timeout:")) {
      reason = ["timeout", `Unknown ${wptSHA1}`];
    } else {
      reason = ["fail", `Unknown ${wptSHA1}`];
    }
    toRunObj[test.parent.title][test.title] = reason;
  })
  .on("end", () => {
    fs.writeFileSync(
      resolveWpt("to-run.yaml"),
      jsYAML.safeDump(toRunDocs, {
        sortKeys(a, b) {
          return b === "DIR" || a > b ? 1 : -1;
        }
      })
    );
  });

function resolveWpt(...paths) {
  return path.resolve(__dirname, "../", ...paths);
}
