import Template from './Template';

export const ARRANGEMENT_DEFAULT = 'default';

class TemplateRegistry {

  constructor() {
    this.templateById = {};
    this.templatesByContentType = {};
    this.toolsById = {};
    this.toolsByContentType = {};
  }

  registerTemplate(descriptor) {
    const {id, appliesTo} = descriptor;
    console.log(`registered template for '${descriptor.type}'`);
    if (!this.toolsByContentType[appliesTo]) {
      this.toolsByContentType[appliesTo] = [];
    }
    const template = new Template(descriptor);
    if (!this.templatesByContentType[appliesTo]) {
      this.templatesByContentType[appliesTo] = [];
    }
    this.templatesByContentType[appliesTo].push(template);
    this.templateById[id] = template;
  }

  registerTool(descriptor) {
    const {id, appliesTo} = descriptor;
    this.toolsById[id] = descriptor;
    if (!this.toolsByContentType[appliesTo]) {
      this.toolsByContentType[appliesTo] = [];
    }
    this.toolsByContentType[appliesTo].push(descriptor);
  }

  getTemplate(id) {
    if (!this.templateById[id]) {
      throw new Error(`No template for type ${id} registered`)
    }
    return this.templateById[id];
  }

  getToolsFor(nodeType) {
    return this.toolsByContentType[nodeType] || [];
  }

  getTool(toolId) {
    return this.toolsById[toolId];
  }

  // getAggregator(type) {
  //   return this.aggregatorsByType[type];
  // }

  getViewsFor(type, aggregate) {
    if (!this.templatesByContentType[type]) {
      throw new Error(`No template for content type ${type} registered`)
    }
    return this.templatesByContentType[type].filter(template => template.aggregate === aggregate);
  }

  // registerNavigationMaps(descriptor) {
  //   if (!descriptor) {
  //     throw new Error("Missing navigation map descriptor");
  //   }
  //   this.navigationMapByName = descriptor;
  // }
  //
  // setStartMap(name) {
  //   this.startMap = this.navigationMapByName[name];
  //   if (!this.startMap) {
  //     throw new Error(`Can't find start map ${name} `);
  //   }
  // }
  //
  // getMap(name) {
  //   const result = this.navigationMapByName[name];
  //   if (!result) {
  //     throw new Error(`Can't find map ${name} `);
  //   }
  //   return result;
  // }

}

const registry = new TemplateRegistry();

export default registry;