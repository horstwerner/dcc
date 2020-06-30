import P from 'prop-types';
import { omit } from 'lodash';
import Component from '@symb/Component';
import css from './App.css';
import ComponentFactory from "@symb/ComponentFactory";
import Cache from './graph/Cache';
import TemplateRegistry from './templates/TemplateRegistry';
import {Div_} from '@symb/Div';
import {fit} from "@symb/util";
import {Card_} from "@/components/Card";
import {Sidebar_} from "@/components/Sidebar";

const APP = 'app';
export const MARGIN = 24;

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
      mainCard: {data: Cache.rootNode, template: 'root'},
      currentData: Cache.rootNode,
      currentTemplate: 'root',
      dataLoaded: false,
      error: null,
    };
    this.onResize(window.innerWidth, window.innerHeight);

    this.getDictionaryFromDb()
        .then(() => Promise.all([...Cache.getEntityTypes().map(type => this.getDataFromDb(type)), this.getCardDescriptorsFromDb()]))
        .then(() => {
          if (!this.state.error) {
            this.setState({
              dataLoaded: true,
              backgroundColor: TemplateRegistry.getTemplate('root').getCardColor
              // currentMap: TemplateRegistry.getStartMap()
            })
          }
        });
    this.handleNodeClick = this.handleNodeClick.bind(this);

  }

  handleNodeClick({id}) {
    const node = Cache.getNodeByUniqueKey(id);
    const template = TemplateRegistry.getTemplate(node.type.uri);
    this.setState({inspectionCard: {template, data: node}});
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

  updateContents(props) {

    const {dataLoaded, error, mainWidth, mainHeight, sideBarWidth, windowHeight, mainCard, inspectionCard} = this.state;

    // const backgroundColor = (map && map.backColor) || '#ffffff';
    const mainTemplate = dataLoaded && TemplateRegistry.getTemplate(mainCard.template);
    const sidebar = Sidebar_({w: sideBarWidth, h: windowHeight, selectedCard: inspectionCard, spatial: {x: mainWidth, y: 0, scale: 1}})._Sidebar;

    const children = [sidebar];
    if (error) {children.push(Div_({}, `An error occurred: ${error.message}`)._Div);}
    if (dataLoaded) {
      const mainCardW = mainTemplate.background.w;
      const mainCardH = mainTemplate.background.h;
      children.push(...[
      Card_({
        key: 'mainCard',
        spatial: fit(mainWidth - MARGIN, mainHeight - MARGIN, mainCardW, mainCardH, 0.5 * MARGIN, 0.5 * MARGIN),
        data: mainCard.data,
        template: mainTemplate,
        onClick: this.handleNodeClick
      })._Card,
      inspectionCard && Card_()._Card
      ]);
    }

    this.createChildren(children);
  }

  onResize(width, height) {
    console.log(`onResize:${width}-${height}`);
    const sideBarWidth = Math.min(0.23 * width, 4 * height);
    const mainHeight = 9 / 10 * height;
    const mainWidth = width - sideBarWidth;

    this.setState({windowWidth: width, windowHeight: height, mainWidth, mainHeight, sideBarWidth});
  }

};

ComponentFactory.registerType(App);

export const App_ = (props, children) => ({_App: {type: APP, children, ...props}});
