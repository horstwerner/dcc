export default class Filter {

  attribute;
  comparator;
  comparand;

  static fromDescriptor(descriptor) {
    const attribute = Object.keys(descriptor)[0];
    const rest = descriptor[attribute];
    const comparator = Object.keys(rest)[0];
    const comparand = rest[comparator];
    return new Filter(attribute, comparator, comparand);
  }

  constructor(attribute, comparator, comparand) {
    this.attribute = attribute;
    this.comparator = comparator;
    this.comparand = comparand;
    this.isNumeric = !isNaN(comparand);
    this.matches = this.matches.bind(this);
  }

  matches(graphNode) {
    const rawValue = graphNode.get(this.attribute);
    const value = this.isNumeric ? Number(rawValue) : rawValue;
    switch (this.comparator) {
      case '=':
        return value === this.comparand;
      case '<':
        return value < this.comparand;
      case '>':
        return value > this.comparand;
      case '!=':
        return value !== this.comparand;
      default:
        throw new Error(`Unknown comparator ${this.comparator}`);
    }
  }

}