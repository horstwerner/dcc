class TemplateRegistry {

  constructor() {
    this.templateByType = {};
    this.navigationMapByName = {};
    this.startMap = null;
  }

  registerTemplate(descriptor) {
    console.log(`registered template for '${descriptor.type}'`);
    this.templateByType[descriptor.type] = descriptor;
  }

  getTemplate(type) {
    if (!this.templateByType[type]) {
      throw new Error(`No template for type ${type} registered`)
    }
    return this.templateByType[type];
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