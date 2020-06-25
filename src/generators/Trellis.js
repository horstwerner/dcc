import {DEBUG_MODE} from "@/Config";
import P from "prop-types";
import TemplateRegistry from "@/templates/TemplateRegistry";
import Aggregator, {AGG_MAX, AGG_MIN, aggregateNodes, DEFAULT_AGGREGATOR} from "@/Aggregator";
import {EMPTY, sliceBy} from "@/graph/GroupedSet";
import {TYPE_ALL_NODES, TYPE_NODE_COUNT} from "@/graph/Cache";
import {GRID} from "@/arrangement/GridArrangement";
import {CardSet_, LOD_FULL} from "@/components/CardSet";
import {ChildSet, createArrangement} from "@/components/Generators";
import Filter from "@/graph/Filter";

const PADDING = 0.2;

const Trellis = function Trellis(data, descriptor, onClick) {

  if (DEBUG_MODE) {
    P.checkPropTypes(Trellis.propTypes, descriptor, 'prop', 'Trellis');
  }

  const {key, source, inputSelector, groupAttribute, aggregate, arrangement, x, y, w, h} = descriptor;
  const templateName = descriptor.template;
  const template = TemplateRegistry.getTemplate(templateName);

  const nativeChildSize = template.getSize();

  const aggregator = aggregate ? new Aggregator(aggregate) : DEFAULT_AGGREGATOR;
  const filter = inputSelector ? Filter.fromDescriptor(inputSelector): null;
  const nodes = filter ? data[source].filter(filter.matches) : data[source];
  if (!nodes) return null;

  const aggregated = aggregator.aggregate(nodes);
  const groupedSet = sliceBy(aggregated, groupAttribute, aggregator);

  const childSets = groupedSet
      .getKeys()
      .filter(key => key !== EMPTY)
      .sort()
      .map(key => groupedSet.getGroup(key));


  // calculate min and max values for each aggregated value over all groups
  const aggregatedAttributeNames = [...aggregator.getAggregatedAttributeNames()];
  aggregatedAttributeNames.push(TYPE_NODE_COUNT);
  console.log(`source is ${source}`);
  childSets.forEach(setNode => {
    console.log(`${setNode.name}:`);
    aggregatedAttributeNames.forEach(name => console.log(`${name}=${setNode[name]}`));
  })


  const minAggregations = aggregatedAttributeNames.map(name => ({sourceField: name, targetField: `min-${name}`, method: AGG_MIN}));
  const maxAggregations = aggregatedAttributeNames.map(name => ({sourceField: name, targetField: `max-${name}`, method: AGG_MAX}));
  const bracketAggregation = aggregateNodes(childSets, [...minAggregations, ...maxAggregations]);

  const minValues = {};
  const maxValues = {};
  // const totalValues = {};

  //TODO:
  // TYPE_ALL_NODES only used when full set is used as reference in all trellis groups,
  // and the scale must thus be reduced. Need to redesign that for a universal solution.

  aggregatedAttributeNames.forEach(name => {
    minValues[name] = source === TYPE_ALL_NODES ? aggregated[name] : bracketAggregation[`min-${name}`];
    maxValues[name] = source === TYPE_ALL_NODES ? aggregated[name] : bracketAggregation[`max-${name}`];
    // totalValues[name] = aggregated[name];
  })
  childSets.forEach(aggNode => aggNode.setAttributes({minValues, maxValues}));
  childSets.forEach(aggNode => aggNode.setBulkAssociation(TYPE_ALL_NODES, nodes));

  const arrangementDescriptor = {type: GRID, x: 0, y: 0, w, h, padding: PADDING, ...arrangement};

  return CardSet_({key,
    nodes: childSets,
    template,
    lod: LOD_FULL,
    spatial: {x, y, scale: 1},
    arrangement: createArrangement(arrangementDescriptor, nativeChildSize),
    onClick})._CardSet

}

Trellis.propTypes = {
  ...ChildSet.propTypes,
  groupAttribute: P.string
}

export default Trellis;