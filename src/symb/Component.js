import P from 'prop-types';
import {isEmpty, isEqual, mapValues} from 'lodash';
import {DEBUG_MODE, TRANSITION_DURATION} from '@/Config';
import ComponentFactory from './ComponentFactory'
import {cloneObject, getTransformString} from "@symb/util";
import Tween from "@/arrangement/Tween";

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
    this.dom.setAttribute('data-key', props.key);
    this.alpha = 1;
    this.renderStateChange = this.renderStateChange.bind(this);
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
    while (current.parent && current.parent !== refComponent) {
      const parent = current.parent;
      const parentSpatial = parent.spatial || DEFAULT_SPATIAL;
      spatial.x = (spatial.x - parent.dom.scrollLeft) * parentSpatial.scale + parentSpatial.x;
      spatial.y = (spatial.y - parent.dom.scrollTop) * parentSpatial.scale + parentSpatial.y;
      spatial.scale *= parentSpatial.scale;
      current = current.parent;
    }
    if (current.parent !== refComponent) {
      const downPath = refComponent.getAncestry([]);
      for (let idx = 1; idx < downPath.length; idx++) {
        const current = downPath[idx];
        const currentSpatial = current.spatial || DEFAULT_SPATIAL;
        spatial.x = (spatial.x - currentSpatial.x) / currentSpatial.scale + current.dom.scrollLeft;
        spatial.y = (spatial.y - currentSpatial.y) / currentSpatial.scale + current.dom.scrollTop;
        spatial.scale /= currentSpatial.scale;
      }
    }
    return spatial;
  }

  getAncestry(targetArray) {
    if (this.parent) {
      this.parent.getAncestry(targetArray);
    }
    targetArray.push(this);
    return targetArray;
  }

  createChild(fallbackKey, childDescriptor, predecessor, tween) {
    if (typeof childDescriptor === 'string' || typeof childDescriptor === 'number' || typeof childDescriptor === 'boolean') {
      this.dom.innerText = String(childDescriptor);
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
    // noinspection JSUnresolvedVariable
    if (!existing || existing.constructor.type !== type) {
      if (existing) {
        existing.destroy();
      }
      const newChild = ComponentFactory.create(childDescriptor, this);
      if (tween) {
        let targetAlpha = newChild.getAlpha();
        newChild.setAlpha(0);
        tween.addFade(newChild, targetAlpha);
      }
      return this.addChild(newChild, predecessor);
    } else {
      existing.update(netProps, tween);
    }
    return existing;
  }

  /**
   * includes an already instantiated Component into the list of child components
   * However, if no child descriptor with the same key is passed in the next update,
   * it will be removed again
   * @param child
   */
  adoptChild(child) {
    if (!this.childByKey) {
      this.childByKey = {};
    }
    const spatial = child.getRelativeSpatial(this);
    delete child.parent.childByKey[child.key];
    child.update({spatial});
    child.parent = this;
    this.childByKey[child.key] = child;
    this.dom.appendChild(child.dom);
    return child;
  }

  getChild(key) {
    return this.childByKey[key];
  }

  createChildren(descriptor, tween) {
    const updatedChildren = {};
    let count = 0;
    let result;
    if (!this.childByKey) {
      this.childByKey = {};
    }
    if (Array.isArray(descriptor)) {
      let predecessor = null;
      result = descriptor
          .filter(Boolean)
          .map(childDescriptor => {
            const childComponent = this.createChild(`surrogate_key${count++}`, childDescriptor, predecessor, tween);
            if (childComponent.key) {
              updatedChildren[childComponent.key] = childComponent;
            }
            predecessor = childComponent;
          })
    } else {
      result = this.createChild(`surrogate_key${count}`, descriptor, null, tween);
      if (result.key) {
        updatedChildren[result.key] = result;
      }
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

  update(props, tween) {

    if (props) {
      //TODO check inner props and other props separately, take partial update into account
      // this.checkProps(props);
    }

    const {key, className, style, alpha, size, spatial, ...innerProps} = props;
    if (key && (key !== this.key)) {
      throw new Error(`Attempt to update object ${this.key} with props for ${key}`);
    }

    // each of the top-level properties can be updated independently without requiring
    // a full update

    if (alpha != null && alpha !== this.getAlpha()) {
      if (tween) {
        tween.addFade(this, alpha);
      } else {
        this.setAlpha(alpha);
      }
    }

    // style changes can't be animated.
    if (style) {
      this.updateStyle(style);
    }

    if (size) {
      this.updateSize(size, tween);
    }

    if (spatial) {
      this.updateSpatial(spatial, tween);
    }

    if (className) {
      this.updateClassName(className);
    }

    if (innerProps && !isEmpty(innerProps)) {
      if (!isEqual(this.innerProps, props)) {
        this.updateDom(props, tween);
        const childDescriptors = this.createChildDescriptors(props);
        if (childDescriptors != null) {
          this.createChildren(childDescriptors, tween);
        }
        this.innerProps = cloneObject(props);
      }
    }
  }

  updateSize(size, tween) {
    if (this.size && isEqual(this.size, size)) return;
    if (!this.size) {
      this.size = {};
    }
    const current = mapValues(size, (value, key) => (this.size[key] || 0));
    // this.size = {};
    if (tween) {
      tween.addInterpolation(current, size, ({width, height}) => {
        this.setSize({width, height})
      });
    } else {
      this.setSize(size);
    }
  }

  setSize({width, height}) {
    if (!this.dom) return;
    if (width != null) {
      this.dom.style.width = `${Math.round(width)}px`;
      this.size.width = width;
    }
    if (height != null) {
      this.dom.style.height = `${Math.round(height)}px`;
      this.size.height = height;
    }
    this.size = {width, height};
  }

  updateDom(props, tween) {
    //NOP
  }

  createChildDescriptors(props) {
    return props.children || [];
  }

  updateStyle(style) {
    if (isEqual(style, this.style)) return;
    const writeStyle =  (this.style) ? mapValues(this.style, () => '') : {};
    Object.assign(writeStyle, style);
    this.style = {...style};

    setStyle(this.dom, writeStyle);
  }

  // getNativeSize() {
  //   const { width, height } = this.style;
  //   return { width, height };
  // }

  updateSpatial(spatial, tween) {
    if (isEqual(this.getSpatial(), spatial)) return;

    const {x, y, scale} = spatial;
    if (isNaN(x) || isNaN(y) || isNaN(scale)){
      throw new Error('NaN passed as argument for updateSpatial');
    }
    if (tween) {
      tween.addTransform(this, x, y, scale);
    } else {
      this.setSpatial(spatial);
    }

  }

  getSpatial() {
    return this.spatial || DEFAULT_SPATIAL;
  }

  setSpatial({x, y, scale}) {
    if (!this.dom) return;
    this.dom.style.transform = getTransformString(x, y, scale);
    this.spatial = {x, y, scale};
  }

  // getSpatial() {
  //   return this.spatial || {x: 0, y: 0, scale: 1};
  // }

  getAlpha() {
    return (this.alpha == null ? 1 : this.alpha);
  }

  setAlpha(alpha) {
    if (!this.dom) return;
    this.alpha = alpha;
    this.dom.style.opacity = this.alpha;
  }

  updateClassName(className) {
    if (className !== this.className) {
      this.dom.className = className;
      this.className = className;
    }
  }

  addChild(child, predecessor) {
    this.childByKey[child.key] = child;
    if (predecessor) {
      predecessor.dom.after(child.dom);
    } else {
      this.dom.insertBefore(child.dom, this.dom.firstChild);
    }
    return child;
  }

  onResize(width, height) {
    this.dom.style.width = `${width}px`;
    this.dom.style.height = `${height}px`;
  }

  transitionToState(partialState, callback) {
    if (this.transitionTween) {
      this.transitionTween.onEndCall(() => {
         this.transitionToState(partialState, callback)});
      return;
    }
    const transitionTween = new Tween(TRANSITION_DURATION).onEndCall(() =>
      {this.transitionTween = null;
        if (callback) {
          callback();
        }});
    if (this.updateScheduled) {
      this.onStateRendered = () => {
        this.transitionTween = transitionTween;
        this.setState(partialState);
        this.onStateRendered = null;
        transitionTween.start();
      };
    } else {
      this.transitionTween = transitionTween;
      this.setState(partialState);
      transitionTween.start();
    }
  }

  setState(partialState) {
    if (this.transitionTween && this.transitionTween.isRunning()) {
      setTimeout(() => this.setState(partialState) , TRANSITION_DURATION);
    }
    this.state = {...this.state, ...partialState};
    if (!this.updateScheduled) {
      this.updateScheduled = true;
      requestAnimationFrame(this.renderStateChange);
    }
  }

  renderStateChange() {
    this.updateDom(this.innerProps, this.transitionTween);
    const childDescriptors = this.createChildDescriptors(this.innerProps);
    if (childDescriptors != null) {
      this.createChildren(childDescriptors, this.transitionTween);
    }
    this.updateScheduled = false;
    if (this.onStateRendered) {
      this.onStateRendered();
      this.onStateRendered = null;
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
    this.dom = null;
  }

};
