import Template from './Template';

export const ARRANGEMENT_DEFAULT = 'default';

class TemplateRegistry {

  constructor() {
    this.templateById = {};
    this.templatesByContentType = {};
    this.toolsById = {};
    this.toolsByContentType = {};
  }

  registerTemplateForType(type, template) {
    if (!this.templatesByContentType[type]) {
      this.templatesByContentType[type] = [];
    }
    this.templatesByContentType[type].push(template);
  }

  registerTemplate(descriptor) {
    const {id, appliesTo} = descriptor;
    console.log(`registered template '${descriptor.id}'`);
    const template = new Template(descriptor);
    if (Array.isArray(appliesTo)) {
      appliesTo.forEach(type => this.registerTemplateForType(type, template));
    } else {
      this.registerTemplateForType(appliesTo, template);
    }
    this.templateById[id] = template;
  }

  registerToolForType(type, descriptor) {
    if (!this.toolsByContentType[type]) {
      this.toolsByContentType[type] = [];
    }
    this.toolsByContentType[type].push(descriptor);
  }

  registerTool(descriptor) {
    const {id, appliesTo} = descriptor;
    this.toolsById[id] = descriptor;
    if (Array.isArray(appliesTo)) {
      appliesTo.forEach(type => this.registerToolForType(type, descriptor));
    } else {
      this.registerToolForType(appliesTo, descriptor);
    }
  }

  getTemplate(id) {
    if (!this.templateById[id]) {
      throw new Error(`No template for type ${id} registered`)
    }
    return this.templateById[id];
  }

  getDefaultTemplateFor(typeUri) {
    return this.getTemplateFor(typeUri, 'default');
  }

  getTemplateFor(typeUri, viewName) {
    const searchName = viewName.toLowerCase();
    const candidates = this.getViewsFor(typeUri, false);
    if (candidates.length === 0)  {
      console.log(`Error: No template registered for type ${typeUri}`);
      return null;
    }
    let result = candidates.find(template => (template.name || '').toLowerCase() === searchName);
    if (result) return result;
    console.log(`Warning: Can't find view ${viewName} for ${typeUri}. Falling back to default or other`);
    if (searchName !== 'default') {
      result = candidates.find(template => (template.name || '').toLowerCase() === 'default');
    }
    if (result) return result;

    return candidates[0];
  }

  getToolsFor(nodeType) {
    return this.toolsByContentType[nodeType] || [];
  }

  getTool(toolId) {
    return this.toolsById[toolId];
  }

  getViewsFor(typeUri, aggregate) {
    if (!this.templatesByContentType[typeUri]) {
      throw new Error(`No template for content type ${typeUri} registered`)
    }
    // convert undefined to boolean
    return this.templatesByContentType[typeUri].filter(template => !template.aggregate === !aggregate);
  }

}

const registry = new TemplateRegistry();

export default registry;