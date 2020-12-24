import GraphNode from "@/graph/GraphNode";

export const restAfter = function(string, prefix) {
  for (let i = 0; i < prefix.length; i++) {
    if (string.charAt(i) !== prefix.charAt(i)) return null;
  }
  const rest = string.substr(prefix.length);
  if (!isNaN(rest)) {
    return Number(rest)
  } else return rest;
};

export const COMPARISON_EQUAL =  (testValue, value) => testValue === value;
export const COMPARISON_CONTAINS = (testValue, value) => value.toLowerCase().includes(testValue.toLowerCase());
export const COMPARISON_NOT_EQUAL = (testValue, value) => testValue !== value;
export const COMPARISON_NOT_CONTAINS = (testValue, value) => !(value.toLowerCase().includes(testValue.toLowerCase()));
export const COMPARISON_LESS_OR_EQUAL = (testValue, value) => value <= testValue;
export const COMPARISON_GREATER_OR_EQUAL = (testValue, value) =>  value >= testValue;
export const COMPARISON_LESS = (testValue, value) => value < testValue;
export const COMPARISON_GREATER = (testValue, value) => value > testValue;
export const COMPARISON_EXISTS = (testValue, value) => value != null;
export const COMPARISON_EMPTY = (testValue, value) => value == null;
export const COMPARISON_HAS_ASSOCIATED =  (testValue, value) => {
    if (typeof testValue === 'string') {
      if (!value) return false;
      return Array.isArray(value) ? value.find(node => node.uri === testValue) : (value.constructor === GraphNode && value.uri === testValue);
    } else if (typeof testValue === 'object' && testValue.constructor === GraphNode) {
      return Array.isArray(value) ? value.includes(testValue) : (value === testValue);
    }
}

const comparisons = [
  {symbol: "=", matches: COMPARISON_EQUAL},
  {symbol: "contains", matches: COMPARISON_CONTAINS},
  {symbol: "!=", matches: COMPARISON_NOT_EQUAL},
  {symbol: "!contains", matches: COMPARISON_NOT_CONTAINS},
  {symbol: "<=", matches: COMPARISON_LESS_OR_EQUAL},
  {symbol: ">=", matches: COMPARISON_GREATER_OR_EQUAL},
  {symbol: "<", matches: COMPARISON_LESS},
  {symbol: ">", matches: COMPARISON_GREATER},
  {symbol: "exists", matches: COMPARISON_EXISTS},
  {symbol: "empty", matches: COMPARISON_EMPTY},
  {symbol: "->", matches: COMPARISON_HAS_ASSOCIATED}
];

export const parseComparison = function parseComparison(condition) {
  for (let i = 0; i < comparisons.length; i++) {
    const testValue = restAfter(condition, comparisons[i].symbol);
    if (testValue != null) {
      return {testValue, matches: comparisons[i].matches};
    }
  }
  throw new Error(`Couldn't interpret condition ${condition}`);
}

export default class Filter {

  attribute;
  matchFunction;
  comparand;

  static fromDescriptor(descriptor) {
    const attribute = Object.keys(descriptor)[0];
    const rest = descriptor[attribute];
    const comparison = parseComparison(rest);

    return new Filter(attribute, comparison.matches, comparison.testValue);
  }

  constructor(attribute, matchFunction, comparand) {
    this.attribute = attribute;
    this.matchFunction = matchFunction;
    this.isNumeric = !isNaN(comparand);
    this.comparand = this.isNumeric ? Number(comparand): comparand;
    this.matches = this.matches.bind(this);
  }

  matches(graphNode) {
    const rawValue = graphNode.get(this.attribute);
    const value = this.isNumeric ? Number(rawValue) : rawValue;
    return this.matchFunction(this.comparand, value);
  }

  process(source) {
    if (source.constructor === GraphNode) {
      return this.matches(source) ? [source] : [];
    } else if (Array.isArray(source)) {
      return source.filter(this.matches);
    }
    throw new Error(`Can't apply filter to "${JSON.stringify(source)}"`);
  }

}

export const applyFilters = function applyFilters(filters, nodes) {
  let current = nodes;
  filters.forEach(filter => {
    current = filter.process(current);
  });
  return current;
}