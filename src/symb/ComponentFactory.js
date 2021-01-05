class ComponentFactory {
  constructor() {
    this.constructorByType = {};
  }

  registerType(constructor) {
    if (!constructor.type) {
      throw new Error(`Can't register class without static field 'type'`);
    }
    this.constructorByType[constructor.type] = constructor;
  }

  knows(type) {
    return !!this.constructorByType[type];
  }

  create( descriptor, parent, div ) {
    const {type, ...props} = descriptor;
    const constructor = this.constructorByType[type];
    if (!constructor) {
      throw new Error(`No component registered for type ${[type]}`);
    }
    const result = new constructor(props, parent, div);
    result.update(props);
    return result;
  }

}

const instance = new ComponentFactory();

export default instance;
