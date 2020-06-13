import Template from './Template';

export const ARRANGEMENT_DEFAULT = 'default';

class TemplateRegistry {

  constructor() {
    this.templateByType = {};
    this.viewsByType = {};
    this.aggregatorsByType = {};
    this.navigationMapByName = {};
    this.startMap = null;
  }

  registerTemplate(descriptor) {
    console.log(`registered template for '${descriptor.type}'`);
    if (!descriptor.arrangements) {
      descriptor.arrangements = {};
    }
    this.templateByType[descriptor.type] = new Template(descriptor);
  }

  registerViews(type, descriptor) {
    console.log(`registered group template '${type}'`);
    this.aggregatorByType[type] = descriptor.aggregator;
    this.viewsByType[type] = descriptor.views;
  }

  getTemplate(type) {
    if (!this.templateByType[type]) {
      throw new Error(`No template for type ${type} registered`)
    }
    return this.templateByType[type];
  }

  getAggregator(type) {
    return this.aggregatorsByType[type];
  }

  getViews(type) {
    if (!this.viewsByType[type]) {
      throw new Error(`No template for type ${type} registered`)
    }
    return this.viewsByType[type];
  }

  registerNavigationMaps(descriptor) {
    if (!descriptor) {
      throw new Error("Missing navigation map descriptor");
    }
    this.navigationMapByName = descriptor;
  }

  setStartMap(name) {
    this.startMap = this.navigationMapByName[name];
    if (!this.startMap) {
      throw new Error(`Can't find start map ${name} `);
    }
  }

  getMap(name) {
    const result = this.navigationMapByName[name];
    if (!result) {
      throw new Error(`Can't find map ${name} `);
    }
    return result;
  }

  getStartMap() {
    return this.startMap;
  }

}

const registry = new TemplateRegistry();

export default registry;