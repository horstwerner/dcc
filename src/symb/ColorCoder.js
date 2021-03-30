import P from 'prop-types';
import CheckedObject from "@/CheckedObject";
import {Gradient} from "@symb/ColorUtil";
import {parseComparison} from "@/graph/Filter";
import GraphNode from "@/graph/GraphNode";
import {resolveProperty} from "@/graph/Cache";


const createTest = function (condition, color) {
  const comparison = parseComparison(condition);
  return {...comparison, color};
};

export const colorCasesShape =  P.arrayOf(P.shape({condition: P.string.isRequired, color: P.string.isRequired}));

export default class ColorCoder extends CheckedObject{

  static propertyTypes = {
    type: P.oneOf(["selection", "gradient"]).isRequired,
    attribute: P.string.isRequired,
    cases: colorCasesShape,
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
    const attributeValue = object.constructor === GraphNode ? resolveProperty(object, this.attribute) : object [this.attribute];
    if (attributeValue == null) return this.default;
    return this.selectColor(attributeValue);
  }

}