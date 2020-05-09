"use strict";

const { SVG_NS } = require("../namespaces");

// https://svgwg.org/svg2-draft/render.html#TermNeverRenderedElement
const neverRenderedElements = [
  "clipPath",
  "defs",
  "desc",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "pattern",
  "radialGradient",
  "script",
  "style",
  "title",
  "symbol"
];

// https://svgwg.org/svg2-draft/render.html#Rendered-vs-NonRendered
// TODO: Check elements excluded because of conditional processing attributes or ‘switch’ structures
exports.isRenderedElement = function isRenderedElement(elImpl) {
  if (neverRenderedElements.includes(elImpl._localName)) {
    return false;
  } else if (elImpl.getAttributeNS(null, "display") === "none") {
    return false;
  } else if (!elImpl._attached) {
    return false;
  } else if (!elImpl.parentNode || elImpl.parentNode._namespaceURI !== SVG_NS) {
    return true;
  }

  return isRenderedElement(elImpl.parentNode);
};
