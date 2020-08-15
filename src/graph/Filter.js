export const restAfter = function(string, prefix) {
  for (let i = 0; i < prefix.length; i++) {
    if (string.charAt(i) !== prefix.charAt(i)) return null;
  }
  const rest = string.substr(prefix.length);
  if (!isNaN(rest)) {
    return Number(rest)
  } else return rest;
};

export const comparisons = [
  {symbol: "=", matches: (testValue, value) => testValue === value},
  {symbol: "contains", matches: (testValue, value) => value.toLowerCase().includes(testValue.toLowerCase())},
  {symbol: "!=", matches: (testValue, value) => testValue !== value},
  {symbol: "!contains", matches: (testValue, value) => !(value.toLowerCase().includes(testValue.toLowerCase()))},
  {symbol: "<=", matches: (testValue, value) => value <= testValue},
  {symbol: ">=", matches: (testValue, value) =>  value >= testValue},
  {symbol: "<", matches: (testValue, value) => value < testValue},
  {symbol: ">", matches: (testValue, value) => value > testValue},
];

export const parseComparison = function parseComparison(condition) {
  for (let i = 0; i < comparisons.length; i++) {
    const testValue = restAfter(condition, comparisons[i].symbol);
    if (testValue) {
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
    const comparator = Object.keys(rest)[0];
    const comparand = rest[comparator];
    const comparison = comparisons.find(comp => comp.symbol === comparator);
    if (!comparison) {
      throw new Error(`Unknown comparator ${comparator}`);
    }

    return new Filter(attribute, comparison.matches, comparand);
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

}