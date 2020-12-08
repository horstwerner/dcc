import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import {MenuPanel_} from "@/components/MenuPanel";
import {MENU_WIDTH} from "@/Config";
import css from './ActiveCard.css';

const ACTIVE_CARD = 'active-card';

class ActiveCard extends Component {
  static type = ACTIVE_CARD;
  static className = css.activeCard;

  static propTypes = {
    card: P.object.isRequired,
    width: P.number.isRequired,
    height: P.number.isRequired
  }

  updateContents(props) {

    const {card, width, height} = props;

    const cardMaxW = width - MENU_WIDTH;
    const tSize = card.template.getSize();
    const cardScale = Math.min(cardMaxW / tSize.width, height / tSize.height);
    this.dom.style.width = `${tSize.width * cardScale + MENU_WIDTH}px`;
    this.dom.style.height = `${height}px`;

    const menuX = cardScale * tSize.width;
    const yOffset = 0.5 * (height - cardScale * tSize.height);
    const children = [
        {...card, spatial: {x:0, y: yOffset, scale: cardScale}},
      MenuPanel_({
        w: MENU_WIDTH,
        h: height,
        spatial: {x: menuX, y: 0, scale: 1}
      })._MenuPanel
    ];
    this.createChildren(children);
  }

}

ComponentFactory.registerType(ActiveCard);

export const ActiveCard_ = (props) => ({_ActiveCard: {...props, type: ACTIVE_CARD}});
