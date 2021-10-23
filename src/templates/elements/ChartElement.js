import P from 'prop-types';
import TemplateElement from "@/templates/elements/TemplateElement";
import {colorCasesShape} from "@symb/ColorCoder";
import {SORT_ASC, SORT_DESC, SORT_URI} from "@/generators/StackedBarChart";
import {Stop} from "@/components/Svg";
import Chart from "@/generators/Chart";


const rectPropTypes = {
  maxValue: P.number.isRequired,
  maxW: P.number.isRequired,
  h: P.number.isRequired,
  color: P.string.isRequired,
  attribute: P.string.isRequired
}

const stackedBarPropTypes = {
  source: P.string.isRequired,
  totalWidthValue: P.oneOfType([P.string, P.number]).isRequired,
  colorAttribute: P.string.isRequired,
  widthAttribute: P.string.isRequired,
  colors: colorCasesShape.isRequired,
  defaultColor: P.string.isRequired,
  fragmentStroke: P.string,
  sortSequence: P.oneOfType([P.arrayOf(P.string),P.oneOf([SORT_ASC, SORT_DESC, SORT_URI])])
}

const polarPropTypes = {
  maxValues: P.shape({}).isRequired,
  dimensions: P.arrayOf(P.string).isRequired,
  diameter: P.number.isRequired,
  labels: P.arrayOf(P.string),
  labelStyle: P.shape({}),
  colorStops: P.arrayOf(P.shape(Stop.propTypes)).isRequired,
}

const graphPropTypes = {
  source: P.string.isRequired,
  path: P.string.isRequired,
  viewName: P.string,
  nodeAspectRatio: P.number,
  bounded: P.bool,
  muteColor: P.string
}

const commonPropTypes = {
  ...TemplateElement.propTypes,
  chartType: P.oneOf(['rect','stackedBar','polar','graph']).isRequired,
  inputSelector: P.objectOf(P.string),
  overlay: P.string
}

export default class ChartElement extends TemplateElement {

  static key = 'chart';

  static validate(templateId, descriptor) {

    let error = false;
    let propTypes = {...commonPropTypes};

    switch(descriptor.chartType) {
      case 'rect':
        Object.assign(propTypes, rectPropTypes);
        break;
      case 'stackedBar':
        Object.assign(propTypes, stackedBarPropTypes);
        break;
      case 'polar':
        Object.assign(propTypes, polarPropTypes);
        break;
      case 'graph':
        Object.assign(propTypes, graphPropTypes);
        break;
    }

    P.checkPropTypes(propTypes, descriptor, templateId, descriptor.key, () => {error = true; return '';})

    return error;
  }

  static create({descriptor, data, onClick, highlightCondition}) {
    return Chart({ data, descriptor, onClick, highlightCondition });
  }

};
