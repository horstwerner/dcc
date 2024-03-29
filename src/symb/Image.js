import P from 'prop-types';
import isEqual from 'lodash/isEqual';
import Component from '@symb/Component';
import ComponentFactory from '@symb/ComponentFactory'

const IMAGE = 'image';

export class Image extends Component {
  static type = IMAGE;
  static baseTag = 'img';
  static propTypes = {source: P.string.isRequired, width: P.number, height: P.number, cornerRadius: P.number, onClick: P.func};

  updateDom(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }

    const {source, width, height, cornerRadius, onClick, title, color, onMouseEnter, onMouseLeave} = props;
    if (!this.innerProps || this.innerProps.source !== source) {
      this.dom.setAttribute('src', source);
    }
    this.dom.setAttribute('draggable', false);
    if (cornerRadius) {
      this.dom.style.borderRadius = `${cornerRadius}px`;
    }
    if (title) {
      this.dom.setAttribute('alt', title);
      this.dom.setAttribute('title', title);
    }
    if (color != null) {
      this.dom.style.backgroundColor = color;
    }

    if (onMouseEnter) {
      this.dom.onmouseenter = onMouseEnter;
    } else if (this.dom.onmouseenter) {
      this.dom.onmouseenter = null;
    }
    if (onMouseLeave) {
      this.dom.onmouseleave = onMouseLeave;
    } else if (this.dom.onmouseleave) {
      this.dom.onmouseleave = null;
    }

    this.dom.style.width = `${width}px`;
    this.dom.style.height = `${height}px`;
    this.setClickable(!!onClick, onClick);

    this.innerProps = {...props};
  }

  createChildDescriptors(props) {
    return null;
  }

  getNativeSize() {
    const { width, height } = this.innerProps;
    return { width, height };
  }
}

ComponentFactory.registerType(Image);

export const Image_ = (props) => ({_Image: {type: IMAGE, ...props}});
