import P from 'prop-types';
import isEqual from 'lodash/isEqual';
import Component from '@symb/Component';
import ComponentFactory from '@symb/ComponentFactory'

const IMAGE = 'image';

export class Image extends Component {
  static type = IMAGE;
  static baseTag = 'img';
  static propTypes = {source: P.string.isRequired, width: P.number, height: P.number};

  updateContents(props) {
    if (isEqual(this.innerProps, props)) {
      return;
    }
    this.innerProps = props;
    const {source, width, height} = props;
    this.dom.setAttribute('src',props.source);
    this.updateStyle({width, height});
  }
}

ComponentFactory.registerType(Image);

export const Image_ = (props) => ({_Image: {type: IMAGE, ...props}});
