import P from 'prop-types';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import {DEBUG_MODE} from '../Config';
import ComponentFactory from './ComponentFactory'

export default class Component {

  static propTypes = {
    key: P.string.isRequired,
    children: P.oneOfType([P.string, P.array])
  };

  static baseTag = 'div';

  constructor(props, div) {
    if (div) {
      this.div = div;
    } else {
      this.div = document.createElement(this.constructor.elementType || this.constructor.baseTag);
    }
    this.key = props.key;
    this.update(props);
  }

  checkProps(props) {
    if (props.key !== this.key) {
      throw new Error(`Attempt to update component with key ${this.key} with descriptor ${props.key}`);
    }
    if (DEBUG_MODE) {
      if (!this.constructor.propTypes) {
        throw new Error(`Missing static member propTypes in Component ${this.constructor.name}`);
      }
      P.checkPropTypes(this.constructor.propTypes, props, 'parameter', 'Type constructor');
    }
  }

  fillTemplate() {
      throw new Error(`Neither function update nor fillTemplate defined for component ${this.constructor.name}`);
  }

  createChild(fallbackKey, childDescriptor) {
    if (typeof(childDescriptor) === 'string') {
      this.div.innerHTML = childDescriptor;
      return childDescriptor;
    }
    if (childDescriptor === undefined) {
      throw new Error('Undefined child descriptor - closed descriptor with wrong key?')
    }
    //  fix unclosed syntactic bracket, but warn
    const propKeys = Object.keys(childDescriptor);
    if ( propKeys.length === 1 && propKeys[0].charAt(0) === '_' && ComponentFactory.knows(childDescriptor[propKeys[0]].type)) {
      console.log(`Warning: automatically closed unclosed child descriptor ${JSON.stringify(childDescriptor)}`);
      childDescriptor = childDescriptor[propKeys[0]];
    }
    if (childDescriptor.key === null) {
      childDescriptor.key = fallbackKey;
    }
    const existing = this.childByKey[childDescriptor.key];
    const {type, ...netProps} = childDescriptor;
    if (!existing || existing.constructor.type !== type) {
      if (existing) {
        existing.destroy();
      }
      return this.addChild(ComponentFactory.create(type, netProps));
    } else if (!isEqual(netProps, existing.props)) {
      console.log(`updating ${key}`);
        existing.update(netProps);
    }
    return existing;
  }

  createChildren(children) {
    const updatedChildren = {};
    let count = 0;

    let result;

    if (!this.childByKey) {
      this.childByKey = {};
    }
    if (Array.isArray(children)) {
      result = children.map(child => {
        const childComponent = this.createChild(`surrogate_key${count++}`, child);
        updatedChildren[childComponent.key] = childComponent;
      })
    } else {
      result = this.createChild(`surrogate_key${count}`, children);
      updatedChildren[result.key] = result;
    }
    // remove old children that aren't part of children list
    Object.keys(this.childByKey).forEach(key => {
          if (!updatedChildren[key]) {
            this.childByKey[key].destroy();
          }
        }
    );
    this.childByKey = updatedChildren;
    return result;
  }

  /**
   * fallback generic update
   * if no class specific update is implemented,
   * method fillTemplate must be implemented
   * @param props
   */
  update(props) {
    this.checkProps(props);
    this.props = props;
    const {key, className, style, children, ...otherProps} = this.props;
    if (style && !isEqual(style, this.div.style)) {
      this.div.style = style;
    }
    const newClassName = className || this.constructor.className;
    if (newClassName && newClassName !== this.div.className) {
      this.div.className = className || this.constructor.className;
    }
    if (!isEmpty(otherProps)) {
      this.div.innerHTML = this.fillTemplate(otherProps);
    }
    if (children) {
      this.createChildren(children);
    }
  }

  addChild(child) {
    this.childByKey[child.key] = child;
    this.div.appendChild(child.div);
    return child;
  }

  onResize(width, height) {
    this.div.style.width = `${width}px`;
    this.div.style.height = `${height}px`;
  }

  destroy() {
    console.log(`discarding ${this.key}`);
    if (this.childByKey) {
      Object.keys(this.childByKey).forEach(key => {
        if (this.childByKey[key].destroy) {
          this.childByKey[key].destroy();
        }
      })
    }
    this.div.remove();
  }

};
