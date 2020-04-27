// Need?
// using yaml AST?

"use strict";
const readline = require("readline");
const path = require("path");
const fs = require("fs");
const os = require("os");
const jsYAML = require("js-yaml");
const Mocha = require("mocha");

const mocha = new Mocha({});

const toRunFilename = resolveWpt("to-run.yaml");
const toRunString = fs.readFileSync(toRunFilename, { encoding: "utf-8" });
const toRunDocs = jsYAML.safeLoadAll(toRunString, { filename: toRunFilename });
const toRunObj = {};

toRunDocs.forEach(doc => {
  toRunObj[doc.DIR] = Object.entries(doc);
});

mocha.addFile(resolveWpt("run-wpts.js"));

let reason = null;
mocha
  .run()
  .on("fail", (test, err) => {
    if (err.message.startsWith("Error: test harness should not timeout:")) {
      reason = "[timeout, TempUnknown]";
    } else {
      reason = "[fail, TempUnknown]";
    }
    toRunObj[test.parent.title].push([test.title, reason]);
  })
  .on("end", () => {
    updateToRun();
  });

async function updateToRun() {
  const fileStream = fs.createReadStream(resolveWpt("to-run.yaml"));
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const toRunFlatArr = [];
  const newToRunStrings = [];

  for (const toRunArr of Object.values(toRunObj)) {
    toRunArr
      .sort((a, b) => {
        return b[0] === "DIR" || a[0] > b[0] ? 1 : -1;
      })
      .forEach(test => {
        toRunFlatArr.push(test);
      });
  }

  let test = toRunFlatArr.shift();
  for await (const line of rl) {
    if (line === "---") {
      while (test && test[0] !== "DIR") {
        newToRunStrings.splice(-1, 0, `${test[0]}: ${test[1]}`);
        test = toRunFlatArr.shift();
      }
    } else if (
      line === "" ||
      ["#", " "].some(c => line.startsWith(c)) ||
      line.indexOf(":") === -1
    ) {
      // do nothing
    } else if (test && !line.startsWith(test[0])) {
      while (test && !line.startsWith(test[0])) {
        newToRunStrings.push(`${test[0]}: ${test[1]}`);
        test = toRunFlatArr.shift();
      }
      test = toRunFlatArr.shift();
    } else {
      test = toRunFlatArr.shift();
    }
    newToRunStrings.push(line);
  }

  while (test) {
    newToRunStrings.push(`${test[0]}: ${test[1]}`);
    test = toRunFlatArr.shift();
  }

  newToRunStrings.push("");

  fs.writeFileSync(resolveWpt("to-run.yaml"), newToRunStrings.join(os.EOL));
}

function resolveWpt(...paths) {
  return path.resolve(__dirname, "../", ...paths);
}
