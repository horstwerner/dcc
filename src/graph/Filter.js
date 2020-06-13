export default class Filter {

  attribute;
  comparator;
  comparand;

  constructor(attribute, comparator, comparand) {
    this.attribute = attribute;
    this.comparator = comparator;
    this.comparand = comparand;
  }

  matches(graphNode) {
    switch (this.comparator) {
      case '=':
        return graphNode[this.attribute] === comparand;
      case '<':
        return graphNode[this.attribute] < comparand;
      case '>':
        return graphNode[this.attribute] > comparand;
      case '!=':
        return graphNode[this.attribute] !== comparand;
      default:
        throw new Error(`Unknown comparator ${this.comparator}`);
    }
  }

}