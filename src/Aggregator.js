import {aggregateDatapoints} from './graph/Grouping';
import Cache, {TYPE_AGGREGATOR, TYPE_NODE_COUNT, TYPE_NODES} from './graph/Cache';
import GraphNode from "@/graph/GraphNode";

const fillIn = function(string, substitutions) {
  let result = string;
  for (let i = 0; i < substitutions.length; i++) {
    const {placeholder, value} = substitutions[i];
    result = result.split(placeholder).join(value);
  }
  return result;
}

export default class Aggregator {

  // sampleTemplate = {
  //   aggregations:
  //     {total: {attribute: 'revenue', method: 'sum'},
  //      average: {attribute: 'revenue', method: 'avg'}
  //     },
  //   derived: {
  //      caption: '{{count}} Items',
  //      totalText: '{{total}}$ total revenue',
  //      avgText: '{{average}}$ average revenue'
  //   }
  // }


  /**
   *
   * @param template
   */
  constructor(template) {
    const {aggregations, texts} = template;
    this.derivedTexts = [];
    const aggregatedProps = [...Object.keys(aggregations), TYPE_NODE_COUNT];
    Object.keys(texts).forEach(key => {
      const sourceText = texts[key];
      this.derivedTexts.push({key, sourceText,
        substitutions: aggregatedProps.filter(prop => sourceText.includes(`{{${prop}}}`))})
        }
    )

    this.fieldAggregations = [];
    Object.keys(aggregations).forEach(key => {
      const descriptor = aggregations[key];
      this.fieldAggregations.push({targetField:key, sourceField: descriptor.attribute, method: descriptor.calculate});
    });

  }


  aggregate(nodes) {
    const aggregated = aggregateDatapoints(nodes, this.fieldAggregations);
    this.derivedTexts.forEach(textDescriptor => {
      aggregated[textDescriptor.key] = fillIn(textDescriptor.sourceText, textDescriptor.substitutions.map(key => ({placeholder:`{{${key}}}`, value: aggregated[key]})));
    })

    return new GraphNode(TYPE_AGGREGATOR, Cache.createUri())
        .setAttributes(aggregated)
        .setBulkAssociation(TYPE_NODES, nodes);
  }

}