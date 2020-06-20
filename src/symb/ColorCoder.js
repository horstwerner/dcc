import P from 'prop-types';
import CheckedObject from "@/CheckedObject";
import {Gradient} from "@symb/ColorUtil";

const restAfter = function(string, prefix) {
  for (let i = 0; i < prefix.length; i++) {
    if (string.charAt(i) !== prefix.charAt(i)) return null;
  }
  const rest = string.substr(prefix.length);
  if (!isNaN(rest)) {
    return Number(rest)
  } else return rest;
};

const comparisons = [
  {symbol: "==", matches: (testValue, value) => testValue === value},
  {symbol: "=", matches: (testValue, value) => value.toLowerCase().includes(testValue.toLowerCase())},
  {symbol: "!==", matches: (testValue, value) => testValue !== value},
  {symbol: "!=", matches: (testValue, value) => !(value.toLowerCase().includes(testValue.toLowerCase()))},
  {symbol: "<=", matches: (testValue, value) => value <= testValue},
  {symbol: ">=", matches: (testValue, value) => { debugger; return value >= testValue}},
  {symbol: "<", matches: (testValue, value) => value < testValue},
  {symbol: ">", matches: (testValue, value) => value > testValue},
];


const createTest = function (condition, color) {
  for (let i = 0; i < comparisons.length; i++) {
    const testValue = restAfter(condition, comparisons[i].symbol);
    if (testValue) {
      return {testValue, matches: comparisons[i].matches, color};
    }
  }
  throw new Error(`Couldn't interpret condition ${condition}`);
};

export default class ColorCoder extends CheckedObject{

  static propertyTypes = {
    type: P.oneOf(["selection", "gradient"]).isRequired,
    attribute: P.string.isRequired,
    cases: P.arrayOf(P.shape({condition: P.string.isRequired, color: P.string.isRequired})),
    default: P.string.isRequired,
    markers: P.arrayOf(P.shape({value: P.number.isRequired, color: P.string.isRequired}))
  };

  selectColor;

  constructor(descriptor) {
    super(descriptor);
    switch (this.type) {
      case "selection": {
        const tests = this.cases.map((descr) => createTest(descr.condition, descr.color));
        this.selectColor = (attributeValue) => {
          for (let i = 0; i < tests.length; i++) {
            if (tests[i].matches(tests[i].testValue, attributeValue)) {
              return tests[i].color;
            }
          }
          return this.default;
        };
      }
        break;
      case "gradient": {
        const gradient = new Gradient();
        this.markers.forEach(marker => gradient.addInterpolationPoint(marker.value, marker.color));
        this.selectColor = (attributeValue) => {
          return gradient.getColorFor(attributeValue);
        }
      }
    }
  }

  getColor(object) {
    const attributeValue = object[this.attribute];
    if (attributeValue == null) return this.default;
    return this.selectColor(attributeValue);
  }

}