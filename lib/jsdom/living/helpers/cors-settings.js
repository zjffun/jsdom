"use strict";
const conversions = require("webidl-conversions");
const idlUtils = require("../generated/utils");
const { asciiLowercase } = require("./strings");

// https://html.spec.whatwg.org/multipage/urls-and-fetching.html#cors-settings-attributes
const invalidValueDefault = "anonymous";
const missingValueDefault = null;
const keywordsMap = {
  __proto__: null,
  anonymous: "anonymous",
  "": "anonymous",
  "use-credentials": "use-credentials"
};

function getState(value) {
  if (value === null || value === undefined) {
    return missingValueDefault;
  }
  const state = keywordsMap[asciiLowercase(value)];
  if (state !== undefined) {
    return state;
  }
  return invalidValueDefault;
}

class CORSSettingsUtils {
  get crossOrigin() {
    const value = this.getAttributeNS(null, "crossorigin");
    return getState(value);
  }

  set crossOrigin(V) {
    const constructorName = idlUtils.wrapperForImpl(this).constructor.name;
    if (V === null || V === undefined) {
      V = null;
    } else {
      V = conversions.DOMString(V, {
        context:
          `Failed to set the 'crossOrigin' property on '${constructorName}': The provided value`
      });
    }
    this.setAttributeNS(null, "crossorigin", V);
  }
}

module.exports = {
  getState,
  invalidValueDefault,
  missingValueDefault,
  CORSSettingsUtils
};
