import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import {IFrame_} from "@symb/Iframe";
import {Image_} from "@symb/Image";
import css from './ModalLayer.css';
import {iconMargin, iconSize} from "@/components/Generators";
import {Div_} from "@symb/Div";

const MODAL = 'modalLayer';

class ModalLayer extends Component {
  static type = MODAL;
  static className = css.background;

  static propTypes = {
    x: P.number,
    y: P.number,
    url: P.string,
    onClose: P.func,
  };

  updateDom(props, tween) {
    this.dom.style.width = `${window.innerWidth}px`;
    this.dom.style.height = `${window.innerHeight}px`;
  }

  createChildDescriptors(props) {
    const {x, y, size, url, onClose} = props;

    return [
        Div_({key: 'fallback', className: css.fallBack, size, spatial: {x, y, scale: 1}}, `Opening ${url}...`),
        IFrame_({key: 'iframe', className: css.modal, url, size, spatial: {x, y, scale: 1}})._IFrame,
        Image_({key: 'closeButton', className: css.icon, title: 'Close', width: iconSize, height: iconSize,
          spatial: {x: x + size.width - iconSize , y: y - iconSize - iconMargin, scale: 1},
          source: 'public/CloseButton.svg', onClick: onClose})._Image
    ];
  }
}

ComponentFactory.registerType(ModalLayer);
export const ModalLayer_ = (props) => ({_ModalLayer: {type: MODAL, ...props}});
