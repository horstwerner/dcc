import Component from "@symb/Component";
import App from "@/App";

class ComponentFactory {
  constructor() {
    this.constructorByType = {
      app: App,
      div: Component
    };
  }

  registerType(constructor) {
    this.constructorByType[constructor.type] = constructor;
  }

  knows(type) {
    return !!this.constructorByType[type];
  }


  create( type, props ) {
    const constructor = this.constructorByType[type];
    if (!constructor) {
      throw new Error(`No component registered for type ${[type]}`);
    }
    return new constructor(props);
  }
}

const instance = new ComponentFactory();

export default instance;
