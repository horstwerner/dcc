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

const lineChartPropTypes = {
  display: P.oneOf(['line', 'area', 'stackedArea']),
  w: P.number.isRequired,
  h: P.number.isRequired,
  series: P.string.isRequired,
  colors: P.arrayOf(P.string),
  maxValue: P.number,
  attributes: P.arrayOf(P.string).isRequired,
}

const graphPropTypes = {
  source: P.string.isRequired,
  path: P.string.isRequired,
  swimLanes: P.string,
  viewName: P.string,
  canvasW: P.number,
  canvasH: P.number,
  minScale: P.number,
  maxScale: P.number,
  nodeAspectRatio: P.number,
  bounded: P.oneOfType([P.bool, P.string]),
  edgeColor: P.string,
  edgeAnnotations: P.arrayOf(P.shape({pointsRight: P.bool, helpTemplate: P.string, toolTip: P.string})),
  removeDisconnected: P.bool
}

const commonPropTypes = {
  ...TemplateElement.propTypes,
  chartType: P.oneOf(['rect','stackedBar','polar','graph','lineChart']).isRequired,
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
      case 'lineChart':
        Object.assign(propTypes, lineChartPropTypes);
        break;
    }

    P.checkPropTypes(propTypes, descriptor, templateId, descriptor.key, () => {error = true; return '';})

    return error;
  }

  static create({descriptor, data, onClick, highlightCondition}) {
    return Chart({ data, descriptor, onClick, highlightCondition });
  }

};
