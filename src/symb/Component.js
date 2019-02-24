import P from 'prop-types';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import omit from 'lodash/omit';
import {DEBUG_MODE} from '../Config';
import ComponentFactory from './ComponentFactory'
import {getTransformString} from "@symb/util";

export default class Component {

  static propTypes = {
    key: P.string.isRequired,
    className: P.string,
    style: P.object,
    alpha: P.number,
    spatial: P.shape ({
      x: P.number,
      y: P.number,
      scale: P.number,
    }),
    children: P.oneOfType([P.string, P.array])
  };

  static baseTag = 'div';

  constructor(props, domNode) {
    if (domNode) {
      this.dom = domNode;
    } else {
      this.dom = document.createElement(this.constructor.elementType || this.constructor.baseTag);
    }
    this.className = props.className || this.constructor.className;
    this.key = props.key;
    this.alpha = 1;
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
      P.checkPropTypes(Component.propTypes, props, 'prop', 'Component');
      P.checkPropTypes(this.constructor.propTypes, props, 'prop', this.constructor.name);
    }
  }

  fillTemplate() {
      throw new Error(`Neither function update nor fillTemplate defined for component ${this.constructor.name}`);
  }

  createChild(fallbackKey, childDescriptor) {
    if (typeof(childDescriptor) === 'string') {
      this.dom.innerHTML = childDescriptor;
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
        existing.update(netProps);
    }
    return existing;
  }

  /**
   * includes an already instantiated Component into the list of child components
   * However, if no child descriptor with the same key is passed in the next
   * @param child
   * @param spatial - position and scale in this component's local coordinate system
   */
  adoptChild(child, spatial) {
    if (!this.childByKey) {
      this.childByKey = {};
    }
    child.update({spatial});
    this.addChild(child);
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
    const {key, className, style, alpha, spatial, children, ...innerProps} = props;
    if (key !== this.key) {
      throw new Error(`Attempt to update object ${this.key} with props for ${key}`);
    }

    // each of the top-level properties can be updated independently without requiring
    // a full update

    if (alpha !== null) {
      this.updateAlpha(alpha);
    }

    if (style) {
      this.updateStyle(style);
    }

    if (spatial) {
      this.updateSpatial(spatial);
    }

    if (className) {
      this.updateClassName(className);
    }

    if (!isEmpty(innerProps)) {
      this.updateInnerProps(innerProps);
    }

    if (children) {
      this.createChildren(children);
    }
  }

  updateInnerProps(props) {
    if (!isEqual(this.innerProps, props)) {
      this.dom.innerHTML = this.fillTemplate(props);
      this.innerProps = props;
    }
  }

  updateStyle(style) {
    if (!isEqual(style, this.style)) {
       this.dom.style = omit(style,['transform','left','top']);
       this.style = style;
    }
  }

  updateSpatial(spatial) {
    if (!isEqual(this.spatial, spatial)) {
      const {x, y, scale} = spatial;
      this.dom.style.transform = getTransformString(x, y, scale);
      this.spatial = spatial;
    }
  }

  updateAlpha(alpha) {
    this.alpha = alpha;
    this.dom.style.opacity = this.alpha;
  }

  updateClassName(className) {
    if (className !== this.className) {
      this.dom.className = className;
      this.className = className;
    }
  }

  addChild(child) {
    this.childByKey[child.key] = child;
    this.dom.appendChild(child.dom);
    return child;
  }

  onResize(width, height) {
    this.dom.style.width = `${width}px`;
    this.dom.style.height = `${height}px`;
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
    this.dom.remove();
  }

};
