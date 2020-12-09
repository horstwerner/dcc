import P from 'prop-types';
import {omit, isEqual} from 'lodash';
import Component from '@symb/Component';
import css from './App.css';
import ComponentFactory from "@symb/ComponentFactory";
import Cache, {TYPE_AGGREGATOR, TYPE_CONTEXT} from './graph/Cache';
import TemplateRegistry, {ARRANGEMENT_DEFAULT} from './templates/TemplateRegistry';
import {Div_} from '@symb/Div';
import {Card_} from "@/components/Card";
import {Sidebar_} from "@/components/Sidebar";
import GraphNode from "@/graph/GraphNode";
import {DURATION_REARRANGEMENT, MARGIN, SIDEBAR_MAX, SIDEBAR_PERCENT} from "@/Config";
import {fit} from "@symb/util";
import Tween from "@/arrangement/Tween";
import {hoverCardMenu} from "@/components/Generators";
import {BreadcrumbLane_} from "@/components/BreadcrumbLane";

const APP = 'app';
const BREADCRUMBS = 'breadcrumbs';
const SIDEBAR = 'sidebar';
const FOCUS = 'focus';
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
      nextChildPos: MARGIN,
      currentData: Cache.rootNode,
      currentTemplate: 'root',
      breadcrumbCards: [],
      focusCard: null,
      hoverCard: null,
      dataLoaded: false,
      error: null,
    };

    this.nextChildIndex = 1;
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
            this.createFocusCard(startData, TemplateRegistry.getTemplate('root'));
          }
        });
    this.handleNodeClick = this.handleNodeClick.bind(this);
    this.handleHoverCardStash = this.handleHoverCardStash.bind(this);
    this.handleHoverCardPin = this.handleHoverCardPin.bind(this);
    this.handleHoverCardClose = this.handleHoverCardClose.bind(this);
  }

  createChildKey() {
    return `card${this.nextChildIndex++}`;
  }

  handleHoverCardStash() {
    console.log(`stash`);
  }

  handleHoverCardClose() {
    this.setState({hoverCard: null});
  }

  handleHoverCardPin() {
    const {nextChildPos, mainWidth, hoverCard, focusTop, focusHeight, focusCard, breadcrumbCards } = this.state;
    const breadCrumbLane = this.childByKey[BREADCRUMBS];
    const focusInstance = this.childByKey[FOCUS].childByKey[focusCard.key];
    const spatial = focusInstance.getRelativeSpatial(breadCrumbLane);

    const breadcrumbNativeSize = focusCard.template.getSize();
    const newBreadcrumbScale =  (focusTop - 24) / breadcrumbNativeSize.height;
    const newBreadcrumbSpatial = {x: nextChildPos, y: 7, scale: newBreadcrumbScale};

    const focusNativeSize = hoverCard.template.getSize();
    const hoverInstance = this.childByKey[OVERLAY].childByKey[hoverCard.key];
    const newFocusSpatial =  fit(mainWidth - 2 * MARGIN, focusHeight - 2 * MARGIN, focusNativeSize.width, focusNativeSize.height, MARGIN,  MARGIN, 1.2);

    new Tween(DURATION_REARRANGEMENT)
        .addTransform(focusInstance, newBreadcrumbSpatial.x, newBreadcrumbSpatial.y + focusHeight, newBreadcrumbScale)
        .addTransform(hoverInstance, newFocusSpatial.x, newFocusSpatial.y, newFocusSpatial.scale)
        .onEndCall(() => {
          focusCard.spatial = newBreadcrumbSpatial;
          breadCrumbLane.adoptChild(focusInstance, newBreadcrumbSpatial);
          this.childByKey[FOCUS].adoptChild(hoverInstance, newFocusSpatial);
          this.setState({hoverCard: null,
            focusCard: {...hoverCard, hover: false, onClick: this.handleNodeClick},
            breadcrumbCards: [...breadcrumbCards, focusCard],
            nextChildPos: nextChildPos + newBreadcrumbScale * breadcrumbNativeSize.width + MARGIN});
        })
        .start();

    // .scrollToPos(nextChildPos);

  }

  handleNodeClick({component}) {
    // const {id} = clickData;
    // const node = Cache.getNodeByUniqueKey(id);
    // const template = TemplateRegistry.getTemplate(node.type.uri);
    // this.setState({inspectionCard: {template, data: node}});

    const {data, template} = component.innerProps;
    const spatial = component.getRelativeSpatial(this);

    const {width, height} = template.getSize();
    const {mainWidth, focusHeight, nextChildPos} = this.state;
    // const newScale = Math.min(mainWidth / width, mainHeight / height);
    // const yOffset = 0.5 * (mainHeight - newScale * height);
    // const xOffset = mainWidth - newScale * width ;
    const newSpatial = fit(mainWidth - 2 * MARGIN, focusHeight - 2 * MARGIN, width, height, MARGIN,MARGIN,1.2);

    const clone = Card_({key: 'hover', data, hover: true, template, spatial, style: {zIndex: 2}})._Card
    // const veil = Div_({key: 'veil', style:{position: 'absolute', width: mainWidth, height: mainHeight, backgroundColor: SIDEBAR_BACK_COLOR, zIndex: 1}, alpha: 0})._Div
    this.setState({hoverCard: clone});

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

  createFocusCard(data, template) {
    const {mainWidth, focusHeight} = this.state;
    const {width, height} = template.getSize();
    // const spatial = fit(mainWidth - 2 * MARGIN, focusHeight - 2 * MARGIN, width, height, MARGIN,  MARGIN, 1.2);
    const key = this.createChildKey();

    const focusCard = Card_({
      key,
      data,
      template,
      // spatial,
      onClick: this.handleNodeClick
    })._Card

    this.setState({focusCard})
  }

  appendToBreadcrumb(cardInstance, descriptor) {
    const breadInstance = this.childByKey[BREADCRUMBS];
    const spatial = cardInstance.getRelativeSpatial(breadInstance);
    breadInstance.adoptChild(cardInstance, spatial);

    const { breadcrumbCards, nextChildPos } = this.state;

    const key = `card${nextChildIndex}`;
    const {width, height} = template.getSize();
    const newNextChildPos = nextChildPos + height * spatial.scale + MARGIN;
    let appendCard = active ?
        ActiveCard_({card: newCard, width: scale * width + MENU_WIDTH, height: 600, spatial })._ActiveCard
        : {...newCard, spatial};

    this.setState({canvasCards: [...canvasCards, appendCard], nextChildIndex: nextChildIndex + 1, canvasHeight: newNextChildPos, nextChildPos: newNextChildPos});
    return newCard;
  }

  updateContents(props) {

    const {focusCard, error, mainWidth, focusHeight, sideBarWidth, breadcrumbCards, canvasHeight, hoverCard, focusTop,
      windowHeight} = this.state;

    // const backgroundColor = (map && map.backColor) || '#ffffff';
    if (error) {
      this.createChildren(Div_({}, `An error occurred: ${error.message}`)._Div);
      return;
    }

    const hoverChildren = [];
    if (hoverCard) {
      const menuRight = hoverCard.template.getSize().width * hoverCard.spatial.scale + hoverCard.spatial.x;
      hoverChildren.push(hoverCard);
      hoverChildren.push(hoverCardMenu(hoverCard.spatial.y, menuRight, this.handleHoverCardClose, this.handleHoverCardPin, this.handleHoverCardStash))
    }

    if (focusCard) {
     const {width, height} = focusCard.template.getSize();
     const newSpatial = fit(mainWidth - 2 * MARGIN, focusHeight - 2 * MARGIN, width, height, MARGIN,  MARGIN, 1.2);
     if (!isEqual(newSpatial, focusCard.spatial)) {
       focusCard.spatial = newSpatial;
     }
    }

    this.createChildren([
      BreadcrumbLane_({
        key: BREADCRUMBS,
        spatial: {x: 0, y: windowHeight - focusTop, scale: 1},
        width: mainWidth,
        height: focusTop,
        children: breadcrumbCards,
        canvasHeight
      })._BreadcrumbLane,
        Div_({
          key: FOCUS,
          className: css.focus,
          spatial: {x: 0, y: 0, scale: 1},
          children: focusCard
        })._Div,
      Sidebar_({w: sideBarWidth, h: windowHeight,
        menuTop: 0.5 *  windowHeight - focusTop,
        key: SIDEBAR,
        spatial: {x: mainWidth, y: 0, scale: 1}
      })._Sidebar,
      Div_({
          key: OVERLAY,
          className: css.overlay,
          children: hoverChildren
        })._Div
    ]);
  }

  onResize(width, height) {
    console.log(`onResize:${width}-${height}`);
    this.dom.style.width = `${width}px`;
    this.dom.style.height = `${height}px`;
    const sideBarWidth = Math.min(Math.min(SIDEBAR_PERCENT * width, SIDEBAR_MAX), 4 * height);
    const focusTop = 0.15 * height;
    const focusHeight = height - focusTop;
    const mainHeight = height;
    const mainWidth = width - sideBarWidth;

    this.setState({windowWidth: width, windowHeight: height, focusTop, focusHeight, mainWidth, mainHeight, sideBarWidth});
  }

};

ComponentFactory.registerType(App);

export const App_ = (props, children) => ({_App: {type: APP, children, ...props}});
