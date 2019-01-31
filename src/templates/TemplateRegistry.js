class TemplateRegistry {

  constructor() {
    this.templateByType = {};
  }

  registerTemplate(descriptor) {
    this.templateByType[descriptor.type] = descriptor;
  }

  getTemplate(type) {
    if (!this.templateByType[type]) {
      throw new Error(`No template for type ${type} registered`)
    }
    return this.templateByType[type];
  }

}

const registry = new TemplateRegistry();

export default registry;