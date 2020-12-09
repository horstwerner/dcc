import P from 'prop-types';
import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import {DEBUG_MODE} from '@/Config';
import ComponentFactory from './ComponentFactory'
import {getTransformString} from "@symb/util";

export function setStyle(dom, style) {
  Object.keys(style).forEach(key => {
    let value = style[key];
    if (['width','height','left','top'].includes(key) && typeof(value) === 'number') {
      value = `${value}px`;
    }
    dom.style[key] = value});
}

const DEFAULT_SPATIAL = {x: 0, y: 0, scale: 1};

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
    children: P.oneOfType([P.object, P.string, P.array])
  };

  static baseTag = 'div';

  updateScheduled = false;

  constructor(props, parent, domNode) {
    if (domNode) {
      this.dom = domNode;
    } else {
      this.dom = props.nameSpace ?
          document.createElementNS(props.nameSpace, this.constructor.elementType || this.constructor.baseTag) :
          document.createElement(this.constructor.elementType || this.constructor.baseTag);
    }
    this.className = props.className || this.constructor.className;

    if (this.className) {
      if (props.nameSpace) { // svg
        this.dom.setAttribute('class', this.className);
      } else {
        this.dom.className = this.className;
      }
    }
    this.parent = parent;
    this.key = props.key;
    this.alpha = 1;
  }

  checkProps(props) {
    if (props.key && (props.key  !== this.key)) {
      throw new Error(`Attempt to update component with key ${this.key} with descriptor ${props.key}`);
    }
    if (DEBUG_MODE) {
      if (!this.constructor.propTypes) {
        throw new Error(`Missing static member propTypes in Component ${this.constructor.name}`);
      }
      P.checkPropTypes(Component.propTypes, props, 'prop', this.constructor.name);
      P.checkPropTypes(this.constructor.propTypes, props, 'prop', this.constructor.name);
    }
  }

  getRelativeSpatial(refComponent) {
    let current = this;
    const spatial = {...(this.spatial || DEFAULT_SPATIAL)};
    console.log(`${this.key} at ${JSON.stringify(this.spatial)}`);
    while (current.parent && current !== refComponent) {
      const parentSpatial = current.parent.spatial || DEFAULT_SPATIAL;
      console.log(`${current.parent.key} at ${JSON.stringify(parentSpatial)}`);
      spatial.x = spatial.x * parentSpatial.scale + parentSpatial.x;
      spatial.y = spatial.y * parentSpatial.scale + parentSpatial.y;
      spatial.scale *= parentSpatial.scale;
      current = current.parent;
    }
    if (current !== refComponent) {
      const downPath = refComponent.getAncestry([]);
      for (let idx = 1; idx < downPath.length; idx++) {
        const currentSpatial = downPath[idx].spatial || DEFAULT_SPATIAL;
        spatial.x = (spatial.x - currentSpatial.x) / currentSpatial.scale;
        spatial.y = (spatial.y - currentSpatial.y) / currentSpatial.scale;
        spatial.scale /= currentSpatial.scale;
      }
    }
    console.log(`result = ${JSON.stringify(spatial)}`)
    return spatial;
  }

  getAncestry(targetArray) {
    if (this.parent) {
      this.parent.getAncestry(targetArray);
    }
    targetArray.push(this);
    return targetArray;
  }

  createChild(fallbackKey, childDescriptor) {
    if (typeof(childDescriptor) === 'string') {
      this.dom.innerText = childDescriptor;
      return childDescriptor;
    }
    if (childDescriptor === undefined) {
      throw new Error('Undefined child descriptor - closed descriptor with wrong key?')
    }
    //  fix unclosed syntactic bracket, but warn
    const propKeys = Object.keys(childDescriptor);
    if ( propKeys.length === 1 && propKeys[0].charAt(0) === '_' && ComponentFactory.knows(childDescriptor[propKeys[0]].type)) {
      console.log(`Warning: automatically closed unclosed child descriptor of type ${childDescriptor[propKeys[0]].type}`);
      childDescriptor = childDescriptor[propKeys[0]];
    }
    if (childDescriptor.key == null) {
      childDescriptor.key = fallbackKey;
    }
    const existing = this.childByKey[childDescriptor.key];
    const {type, ...netProps} = childDescriptor;
    if (!existing || existing.constructor.type !== type) {
      if (existing) {
        existing.destroy();
      }
      return this.addChild(ComponentFactory.create(childDescriptor, this));
    } else {
      existing.update(netProps);
    }
    return existing;
  }

  /**
   * includes an already instantiated Component into the list of child components
   * However, if no child descriptor with the same key is passed in the next update,
   * it will be removed again
   * @param child
   * @param spatial - position and scale in this component's local coordinate system
   */
  adoptChild(child, spatial) {
    if (!this.childByKey) {
      this.childByKey = {};
    }
    delete child.parent.childByKey[child.key];
    child.update({spatial});
    child.parent = this;
    this.addChild(child);
  }

  createChildren(descriptor) {
    const updatedChildren = {};
    let count = 0;
    let result;
    if (!this.childByKey) {
      this.childByKey = {};
    }
    if (Array.isArray(descriptor)) {
      result = descriptor
          .filter(Boolean)
          .map(childDescriptor => {
        const childComponent = this.createChild(`surrogate_key${count++}`, childDescriptor);
        updatedChildren[childComponent.key] = childComponent;
      })
    } else {
      result = this.createChild(`surrogate_key${count}`, descriptor);
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

    if (props) {
      // this.checkProps(props);
    }

    const {key, className, style, alpha, spatial, ...innerProps} = props;
    if (key && (key !== this.key)) {
      throw new Error(`Attempt to update object ${this.key} with props for ${key}`);
    }

    // each of the top-level properties can be updated independently without requiring
    // a full update

    if (alpha != null) {
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

    if (innerProps && !isEmpty(innerProps)) {
      this.updateContents(innerProps);
    }
  }

  updateContents(props) {
    if (!isEqual(this.innerProps, props)) {
      const { children } = props;
      if (children) {
        this.innerProps = {...props};
        this.createChildren(children);
      } else {
        // this.dom.innerHTML = this.fillTemplate(props);
        this.innerProps = {...props};
      }
    }
  }

  updateStyle(style) {
    if (!isEqual(style, this.style)) {
      setStyle(this.dom, style);
      this.style = {...style};
    }
  }

  // getNativeSize() {
  //   const { width, height } = this.style;
  //   return { width, height };
  // }

  updateSpatial(spatial) {
    if (!isEqual(this.spatial, spatial)) {
      const {x, y, scale} = spatial;
      if (isNaN(x) || isNaN(y) || isNaN(scale)){
        throw new Error('NaN passed as argument for updateSpatial');
      }
      // console.log(`update: ${this.key} scaled to ${scale}`);
      this.dom.style.transform = getTransformString(x, y, scale);
      this.spatial = {x, y, scale};
    }
  }

  // getSpatial() {
  //   return this.spatial || {x: 0, y: 0, scale: 1};
  // }

  getAlpha() {
    return (this.alpha == null ? 1 : this.alpha);
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

  setState(partialState) {
    this.state = {...this.state, ...partialState};
    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(() => {
        this.updateScheduled = false;
        this.updateContents({...this.innerProps})
      });
    }
  }

  destroy() {
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
