import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import css from './DropdownList.css';
import {Div_} from "@symb/Div";
import {Image_} from "@symb/Image";

export const ROW_HEIGHT = 20;
const ARROW_WIDTH = 20;
const DEFAULT_LABEL_WIDTH = 70;
const GRACE_PERIOD = 250;

const DROPDOWN = 'dropdown';

class DropdownList extends Component {

  static type = DROPDOWN;
  static className = css.dropDownBar;

  static propTypes = {
    options: P.arrayOf(P.shape({id: P.string.isRequired, name: P.string.isRequired, onSelect: P.func.isRequired})),
    selectedId: P.string.isRequired,
    label: P.string,
    labelWidth: P.number,
    listWidth: P.number,
    height: P.number
  }

  constructor(props, parent, domNode) {
    super(props, parent, domNode);
    this.state = {
      isOpen: false
    }
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.openList = this.openList.bind(this);
    this.dom.onmouseleave = this.handleMouseLeave;
    this.collapseTimeout = null;
    this.expandTimeout = null;
    this.mouseInControl = false;
  }

  handleMouseEnter() {
    if (this.mouseInControl) return;
    this.mouseInControl = true;
    if (!this.state.isOpen) {
      if (this.collapseTimeout) {
        clearTimeout(this.collapseTimeout);
        this.collapseTimeout = null;
      }
      this.expandTimeout = setTimeout( () => {
        this.expandTimeout = null;
        if (!this.mouseInControl) return;
        this.openList();
      }, GRACE_PERIOD
      );
    }
  }

  openList() {
    this.mouseInControl = true;
    if (this.transitionTween && this.transitionTween.isRunning()) {
      this.transitionTween.finish();
    }
    this.transitionToState({isOpen: true});
  }

  handleMouseLeave() {
    if (!this.mouseInControl) return;
    this.mouseInControl = false;
    if (this.state.isOpen) {
      if (this.expandTimeout) {
        clearTimeout(this.expandTimeout);
        this.expandTimeout = null;
      }
      this.collapseTimeout = setTimeout(() => {
        this.collapseTimeout = null;
        if (!this.mouseInControl) {
          if (this.transitionTween && this.transitionTween.isRunning()) {
            this.transitionTween.finish();
          }
          this.transitionToState({isOpen: false})
        }
      }, GRACE_PERIOD);
    }
  }

  createChildDescriptors(props) {

    const { label, options, width, labelWidth, selectedId } = props;
    const { isOpen } = this.state;
    const labelW = labelWidth || DEFAULT_LABEL_WIDTH;
    const listW = width - labelW - ARROW_WIDTH;

    let yCursor = 0;
    let selectedY = 0;
    const listEntries = [];

    options.forEach(option => {
      if (option.id === selectedId) {
        selectedY = yCursor;
      }
      listEntries.push(Div_({
        key: option.id,
        className: option.id === selectedId ? css.entryActive : css.entryInactive,
        size: {width: listW, height: ROW_HEIGHT},
        spatial: {x: 0, y:yCursor, scale: 1},
        title: option.name,
        children: option.name,
        onClick: option.id === selectedId ? null : option.onSelect
      })._Div);
      yCursor += ROW_HEIGHT;
    });

    const listHeight = isOpen ? yCursor : ROW_HEIGHT;
    const listSize = {width: listW, height: listHeight}
    const containerY = isOpen ? ROW_HEIGHT-listHeight : 0;
    const bodyY = isOpen ? 0 : - selectedY;

    const listContainer = Div_({key: 'listContainer', className: css.listContainer, size: listSize, spatial: {x: labelW, y: containerY, scale: 1}, onMouseEnter: this.handleMouseEnter, onMouseLeave: this.handleMouseLeave},
        Div_({key: 'listBody', className: css.listBody, size:{width: listW, height: listHeight}, spatial: {x: 0, y: bodyY, scale: 1}}, listEntries)._Div
    )._Div

    return [Div_({key: 'label', className: css.label, size: {width: labelW, height: 20}}, label)._Div,
      listContainer,
      Image_({key: 'arrow', className: css.triangle, spatial:{x: width - ARROW_WIDTH, y: 0, scale: 1}, size: {width: ARROW_WIDTH, height: ROW_HEIGHT}, source: 'images/DropTriangle.svg', onClick: this.openList })._Image
    ];

  }

}

ComponentFactory.registerType(DropdownList);

export const DropdownList_ = (props) => ({_DropdownList: {...props, type: DROPDOWN}});
