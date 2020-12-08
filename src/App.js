import P from 'prop-types';
import {omit} from 'lodash';
import Component from '@symb/Component';
import css from './App.css';
import ComponentFactory from "@symb/ComponentFactory";
import Cache, {TYPE_AGGREGATOR, TYPE_CONTEXT} from './graph/Cache';
import TemplateRegistry from './templates/TemplateRegistry';
import {Div_} from '@symb/Div';
import {Card_} from "@/components/Card";
import {Sidebar_} from "@/components/Sidebar";
import GraphNode from "@/graph/GraphNode";
import {
  CANVAS_WIDTH,
  MARGIN,
  MAX_CARD_HEIGHT,
  MENU_WIDTH,
  SIDEBAR_BACK_COLOR,
  SIDEBAR_MAX,
  SIDEBAR_PERCENT
} from "@/Config";
import {Workbook_} from "@/components/Workbook";
import {fit} from "@symb/util";
import Tween from "@/arrangement/Tween";
import {hoverCardMenu} from "@/components/Generators";
import {ActiveCard_} from "@/components/ActiveCard";

const APP = 'app';
const WORKBOOK = 'workbook';
const OVERLAY = 'overlay';

const handleResponse = function (response) {
  if (response.ok) {
    return response.json();
  } else {
    throw new Error(`${response.status}: ${response.statusText}`);
  }
};

const getGlobal = function getGlobal(constants, value) {
  const constant = constants[value['$']];
  if (constant === undefined) {
    throw new Error(`Can't find global constant ${value['$']}`)
  }
  if (Object.keys(value).length === 1) {
    return constant;
  } else {
    if (Array.isArray(constant) || typeof constant !== 'object'){
      throw new Error(`Can't override parts of constant ${value['$']} - not an object`)
    }
   return {...constant, ...omit(value, ['$'])};
  }
};

const processObject = function (constants, object) {
  if (object == null) {
    debugger
  }
  Object.keys(object).forEach(key => {
    const value = object[key];
    if (value == null) {
      debugger
    }
    if (Array.isArray(value)) {
      processArray(constants, value);
    } else if (typeof value === 'object') {
      if ( value['$']) {
        object[key] = getGlobal(constants, value);
      } else {
        processObject(constants, value);
      }
    }
  });
};

const processArray = function(constants, array) {
  array.forEach(element => {
    if (Array.isArray(element)) {
      processArray(constants, element);
    } else if (typeof element === 'object') {
      processObject(constants, element);
    }
  })
};

const preprocess = function preprocess(constantList, templates) {
  const constants = {};
  // constants can use constants that precede them in list
  constantList.forEach(constObj => {
    processObject(constants, constObj);
    const key = Object.keys(constObj)[0];
    constants[key] = constObj[key];
  });

  //now that all constants are processed, process templates
  processArray(constants, templates);
}

export default class App extends Component {

  static type = APP;
  static className = css.app;

  static propTypes = {
    title: P.string
  };


  constructor(props, parent, domNode) {
    super(props, parent, domNode);

    this.state = {
      nextChildIndex: 1,
      nextChildPos: MARGIN,
      currentData: Cache.rootNode,
      currentTemplate: 'root',
      canvasCards: [],
      hoverCard: null,
      dataLoaded: false,
      error: null,
    };
    this.onResize(window.innerWidth, window.innerHeight);

    this.getDictionaryFromDb()
        .then(() => Promise.all([...Cache.getEntityTypes().map(type => this.getDataFromDb(type)), this.getCardDescriptorsFromDb()]))
        .then(() => {
          if (!this.state.error) {
            const startData = new GraphNode(TYPE_AGGREGATOR, Cache.createUri());
            Object.keys(Cache.rootNode).forEach(entityType => {
              startData.setBulkAssociation(entityType, Cache.rootNode[entityType]);
            })
            startData[TYPE_CONTEXT] = {}
            this.setState({
              dataLoaded: true
            });
            this.appendCard(startData, TemplateRegistry.getTemplate('root'));
          }
        });
    this.handleNodeClick = this.handleNodeClick.bind(this);
    this.handleHoverCardStash = this.handleHoverCardStash.bind(this);
    this.handleHoverCardPin = this.handleHoverCardPin.bind(this);
    this.handleHoverCardClose = this.handleHoverCardClose.bind(this);
  }

  handleHoverCardStash() {
    console.log(`stash`);
  }

  handleHoverCardClose() {
    this.setState({hoverCard: null});
  }

  handleHoverCardPin() {
    const {nextChildPos, mainHeight, hoverCard} = this.state;
    const {data, template} = hoverCard;
    this.childByKey[WORKBOOK].scrollToPos(nextChildPos);
    const newCard = this.appendCard(data, template, true);
    this.setState({hoverCard: null});
  }

  handleNodeClick({event, component}) {
    // const {id} = clickData;
    // const node = Cache.getNodeByUniqueKey(id);
    // const template = TemplateRegistry.getTemplate(node.type.uri);
    // this.setState({inspectionCard: {template, data: node}});

    const {data, template} = component.innerProps;
    const spatial = component.getRelativeSpatial(this);
    spatial.y -= this.childByKey[WORKBOOK].getScrollPos();

    const {width, height} = template.getSize();
    const {mainWidth, mainHeight, nextChildPos} = this.state;
    // const newScale = Math.min(mainWidth / width, mainHeight / height);
    // const yOffset = 0.5 * (mainHeight - newScale * height);
    // const xOffset = mainWidth - newScale * width ;
    const newSpatial = fit(mainWidth, mainHeight, width, height, 0,0,1.2);


    const clone = Card_({key: 'hover', data, hover: true, template, spatial, style: {zIndex: 2}})._Card
    // const veil = Div_({key: 'veil', style:{position: 'absolute', width: mainWidth, height: mainHeight, backgroundColor: SIDEBAR_BACK_COLOR, zIndex: 1}, alpha: 0})._Div
    this.setState({hoverCard: clone, canvasHeight: nextChildPos + mainHeight});

    const tween = new Tween(350)
        .addInterpolation([0, spatial.x, spatial.y, spatial.scale], [1, newSpatial.x, newSpatial.y, newSpatial.scale],
            (sparry) => {
            const spatial = {x: sparry[1], y: sparry[2], scale: sparry[3]};
            this.setState({hoverCard:{...clone, spatial}});
        });

    tween.start();

    // const y = this.appendCard(data, template);
    // this.childByKey[WORKBOOK].scrollToPos(y);

  }

  getDictionaryFromDb() {
    return fetch('/api/dictionary')
        .then(handleResponse)
        .then(result => {
          Cache.importTypes(result.data)})
        .catch(error => {
          console.log(error.stack);
          this.setState({error})
        });
  };

  getCardDescriptorsFromDb() {
    return fetch('/api/cards')
        .then(handleResponse)
        .then(result => {
          const {constants, cards} = result.data;
          preprocess(constants, cards)
          cards.forEach(descriptor => {
            TemplateRegistry.registerTemplate(descriptor);
          })
        })
        .catch(error => {
          console.log(error.stack);
          this.setState({error})
        });
  };

  getDataFromDb(type) {
    return fetch(`/api/data?type=${encodeURI(type)}`, {})
        .then(handleResponse)
        .then(res => {
          if (res.data) {
            Cache.importNodeTable(res.data.type, res.data.headerRow, res.data.valueRows);
          }
        })
        .catch(error => {
          console.log(error.stack);
          this.setState({ error });
        });
  }

  appendCard(data, template, active) {
    const { canvasCards, nextChildIndex, nextChildPos, canvasHeight } = this.state;
    const key = `card${nextChildIndex}`;
    const {width, height} = template.getSize();
    const newCard = Card_({
      key,
      data,
      template,
      onClick: this.handleNodeClick
    })._Card

    const scale = Math.min((CANVAS_WIDTH - MARGIN - (active ? MENU_WIDTH : 0)) / width, MAX_CARD_HEIGHT / height, 1.25);
    const spatial = {x: (CANVAS_WIDTH - scale * width) / 2, y: nextChildPos, scale};
    const newNextChildPos = nextChildPos + height * spatial.scale + MARGIN;
    let appendCard = active ?
        ActiveCard_({card: newCard, width: scale * width + MENU_WIDTH, height: 600, spatial })._ActiveCard
        : {...newCard, spatial};

    this.setState({canvasCards: [...canvasCards, appendCard], nextChildIndex: nextChildIndex + 1, canvasHeight: newNextChildPos, nextChildPos: newNextChildPos});
    return newCard;
  }

  updateContents(props) {

    const {dataLoaded, error, mainWidth, mainHeight, sideBarWidth, canvasCards, canvasHeight, hoverCard, windowHeight, inspectionCard} = this.state;

    // const backgroundColor = (map && map.backColor) || '#ffffff';
    const sidebar = Sidebar_({w: sideBarWidth, h: windowHeight, selectedCard: inspectionCard, spatial: {x: mainWidth, y: 0, scale: 1}})._Sidebar;

    const children = [sidebar];
    if (error) {children.push(Div_({}, `An error occurred: ${error.message}`)._Div);}

    const hoverChildren = [];
    if (hoverCard) {
      const menuRight = hoverCard.template.getSize().width * hoverCard.spatial.scale + hoverCard.spatial.x;
      hoverChildren.push(hoverCard);
      hoverChildren.push(hoverCardMenu(hoverCard.spatial.y, menuRight, this.handleHoverCardClose, this.handleHoverCardPin, this.handleHoverCardStash))
    }

    if (dataLoaded) {
      children.push(...[
        Workbook_({
          key: WORKBOOK,
          width: mainWidth,
          height: mainHeight,
          children: canvasCards,
          canvasHeight
        })._Workbook,
        hoverCard && Div_({
          key: OVERLAY,
          className: css.overlay,
          children: hoverChildren
        })._Div
      ]);
    }
    this.createChildren(children);
  }

  onResize(width, height) {
    console.log(`onResize:${width}-${height}`);
    const sideBarWidth = Math.min(Math.min(SIDEBAR_PERCENT * width, SIDEBAR_MAX), 4 * height);
    const mainHeight = height;
    const mainWidth = width - sideBarWidth;

    this.setState({windowWidth: width, windowHeight: height, mainWidth, mainHeight, sideBarWidth});
  }

};

ComponentFactory.registerType(App);

export const App_ = (props, children) => ({_App: {type: APP, children, ...props}});
