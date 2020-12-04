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
import {CANVAS_WIDTH, MARGIN, MAX_CARD_HEIGHT, SIDEBAR_MAX, SIDEBAR_PERCENT} from "@/Config";
import {Workbook_} from "@/components/Workbook";

const APP = 'app';

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


  constructor(props, domNode) {
    super(props, domNode);

    this.state = {
      nextChildIndex: 1,
      nextChildPos: MARGIN,
      currentData: Cache.rootNode,
      currentTemplate: 'root',
      canvasCards: [],
      hoverCards: [],
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

  }

  handleNodeClick(clickData) {
    // const {id} = clickData;
    // const node = Cache.getNodeByUniqueKey(id);
    // const template = TemplateRegistry.getTemplate(node.type.uri);
    // this.setState({inspectionCard: {template, data: node}});

    const {data, template} = clickData;

    this.appendCard(data, template);
    // const clone = Card_({data, template, spatial: magnified})._Card
    // this.setState({hoverCards: [clone]});

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

  appendCard(data, template) {
    const { canvasCards, nextChildIndex, nextChildPos } = this.state;
    const key = `card${nextChildIndex}`;
    const {width, height} = template.getSize();
    const scale = Math.min((CANVAS_WIDTH - MARGIN) / width, MAX_CARD_HEIGHT / height, 1.25);
    const spatial = {x: MARGIN / 2, y: nextChildPos, scale};
    const newCard = Card_({
      key,
      spatial,
      data,
      template,
      onClick: this.handleNodeClick
    })._Card
    this.setState({canvasCards: [...canvasCards, newCard], nextChildIndex: nextChildIndex + 1, nextChildPos: nextChildPos + height * spatial.scale + MARGIN});
  }

  updateContents(props) {

    const {dataLoaded, error, mainWidth, mainHeight, sideBarWidth, canvasCards, hoverCards, windowHeight, inspectionCard} = this.state;

    // const backgroundColor = (map && map.backColor) || '#ffffff';
    const sidebar = Sidebar_({w: sideBarWidth, h: windowHeight, selectedCard: inspectionCard, spatial: {x: mainWidth, y: 0, scale: 1}})._Sidebar;

    const children = [sidebar];
    if (error) {children.push(Div_({}, `An error occurred: ${error.message}`)._Div);}
    if (dataLoaded) {
      children.push(...[
        Workbook_({
          width: mainWidth,
          height: mainHeight,
          children: canvasCards
        })._Workbook,
        Div_({
          key: 'overlay',
          className: css.overlay,
          children: hoverCards
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
