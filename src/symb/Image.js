import P from 'prop-types';
import isEqual from 'lodash/isEqual';
import Component from '@symb/Component';
import ComponentFactory from '@symb/ComponentFactory'

const IMAGE = 'image';

export class Image extends Component {
  static type = IMAGE;
  static baseTag = 'img';
  static propTypes = {source: P.string.isRequired, width: P.number, height: P.number, cornerRadius: P.number, onClick: P.func};

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const {source, width, height, cornerRadius, onClick} = props;
    this.dom.setAttribute('src',props.source);
    if (cornerRadius) {
      this.dom.style.borderRadius = `${cornerRadius}px`;
    }
    this.dom.style.width = `${width}px`;
    this.dom.style.height = `${height}px`;
    if (onClick) {
      this.dom.onclick = onClick;
    }
  }
}

ComponentFactory.registerType(Image);

export const Image_ = (props) => ({_Image: {type: IMAGE, ...props}});
