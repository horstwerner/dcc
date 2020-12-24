import P from 'prop-types';
import {omit} from 'lodash';
import Component from '@symb/Component';
import css from './App.css';
import ComponentFactory from "@symb/ComponentFactory";
import Cache, {TYPE_AGGREGATOR, TYPE_CONTEXT, TYPE_NODES} from './graph/Cache';
import TemplateRegistry from './templates/TemplateRegistry';
import {Div_} from '@symb/Div';
import {Card_} from "@/components/Card";
import {Sidebar_} from "@/components/Sidebar";
import GraphNode from "@/graph/GraphNode";
import {DURATION_REARRANGEMENT, MARGIN, SIDEBAR_MAX, SIDEBAR_PERCENT} from "@/Config";
import {fit} from "@symb/util";
import Tween from "@/arrangement/Tween";
import {createPreprocessedCardNode, hoverCardMenu} from "@/components/Generators";
import {BreadcrumbLane_} from "@/components/BreadcrumbLane";
import {ToolPanel_} from "@/components/ToolPanel";
import Filter, {applyFilters, COMPARISON_EQUAL, COMPARISON_HAS_ASSOCIATED} from "@/graph/Filter";
import {RadioButtons_} from "@/components/RadioButtons";
import Trellis from "@/generators/Trellis";
import {CLICK_DISABLED, CLICK_NORMAL, CLICK_OPAQUE, CLICK_TRANSPARENT} from "@/components/Constants";

const APP = 'app';
const BREADCRUMBS = 'breadcrumbs';
const SIDEBAR = 'sidebar';
const FOCUS = 'focus';
const OVERLAY = 'overlay';

const TOOL_HEIGHT = 10;

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

const FILTER_RESET = 'reset';
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
      views: [],
      tools: [],
      activeTools: {},
      toolControls: {},
      currentFilters: [],
      breadcrumbCards: [],
      focusData: null,
      focusCard: null,
      hoverCard: null,
      dataLoaded: false,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      breadCrumbHeight: 0,
      toolbarHeight: 0,
      focusZIndex: 0,
      error: null,
    };

    this.nextChildIndex = 1;
    this.onResize(window.innerWidth, window.innerHeight);

    this.getDictionaryFromDb()
        .then(() => Promise.all([...Cache.getEntityTypes().map(type => this.getDataFromDb(type)), this.getCardDescriptorsFromDb(), this.getToolDescriptorsFromDb()]))
        .then(() => {
          if (!this.state.error) {
            const startData = new GraphNode(TYPE_AGGREGATOR, Cache.createUri());
            Object.keys(Cache.rootNode).forEach(entityType => {
              startData.setBulkAssociation(entityType, Cache.rootNode[entityType]);
            })
            startData[TYPE_CONTEXT] = {}
            this.setState({
              focusData: startData,
              dataLoaded: true
            });
            this.setFocusCard(this.createFocusCard(startData, TemplateRegistry.getTemplate('root'), []));
          }
        });
    this.handleNodeClick = this.handleNodeClick.bind(this);
    this.handleHoverCardStash = this.handleHoverCardStash.bind(this);
    this.handleHoverCardPin = this.handleHoverCardPin.bind(this);
    this.handleHoverCardClose = this.handleHoverCardClose.bind(this);
    this.handleToolToggle = this.handleToolToggle.bind(this);
    this.handleViewSelect = this.handleViewSelect.bind(this);
  }

  createChildKey() {
    return `card${this.nextChildIndex++}`;
  }

  getFocusPlane() {
    return this.childByKey[FOCUS];
  }

  getOverlay() {
    return this.childByKey[OVERLAY];
  }

  getBreadcrumbLane() {
    return this.childByKey[BREADCRUMBS];
  }

  handleHoverCardStash() {
    console.log(`stash`);
  }

  handleHoverCardClose() {
    this.setState({hoverCard: null});
  }

  handleHoverCardPin() {
    const {nextChildPos, hoverCard, breadCrumbHeight, focusCard, breadcrumbCards } = this.state;
    const focusPlane = this.getFocusPlane();
    const hoverPlane = this.getOverlay();
    const breadCrumbLane = this.getBreadcrumbLane();

    const focusInstance = focusPlane.childByKey[focusCard.key];
    const hoverInstance = hoverPlane.childByKey[hoverCard.key];

    const breadcrumbNativeSize = focusCard.template.getSize();
    const newBreadcrumbScale =  (breadCrumbHeight - 24) / breadcrumbNativeSize.height;
    const newBreadcrumbSpatial = {x: nextChildPos, y: 7, scale: newBreadcrumbScale};

    // swap parents
    focusPlane.adoptChild(hoverInstance);
    hoverPlane.adoptChild(focusInstance);

    const newFocusCard = {...hoverCard,  hover: false, onClick: this.handleNodeClick, clickMode: CLICK_TRANSPARENT};
    const newBreadCrumbCard = {...focusCard, clickMode: CLICK_NORMAL, spatial: newBreadcrumbSpatial};

    const toolState = this.createStateForFocusCard(newFocusCard);
    const targetState = {
      ...toolState,
      ...this.recalcLayout(toolState.toolControls),
      focusData: hoverCard.data,
      hoverCard: newBreadCrumbCard,
      nextChildPos: nextChildPos + newBreadcrumbScale * breadcrumbNativeSize.width + MARGIN,
      focusZIndex: 2
    };

    const tween = new Tween(DURATION_REARRANGEMENT);
    this.transitionToState(targetState, tween);

    tween.onEndCall(() => {
      breadCrumbLane.adoptChild(focusInstance);
      this.setState({hoverCard: null, breadcrumbCards: [...breadcrumbCards, newBreadCrumbCard], focusZIndex: 0});
    });
    tween.start();
  }

  handleNodeClick({component}) {
    // const {id} = clickData;
    // const node = Cache.getNodeByUniqueKey(id);
    // const template = TemplateRegistry.getTemplate(node.type.uri);
    // this.setState({inspectionCard: {template, data: node}});

    const { data, template } = component.innerProps;
    const spatial = component.getRelativeSpatial(this);

    const { width, height } = template.getSize();
    const { mainWidth, focusHeight, breadCrumbHeight } = this.state;
    const newSpatial = fit(mainWidth - 2 * MARGIN, focusHeight - 2 * MARGIN, width, height, MARGIN,MARGIN + breadCrumbHeight,1.2);

    const clone = Card_({key: this.createChildKey(), data, hover: true, template, spatial, clickMode: CLICK_DISABLED})._Card
    this.setState({hoverCard: clone});
    this.transitionToState({hoverCard:{...clone, spatial: newSpatial}});
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

  getToolDescriptorsFromDb() {
    return fetch('/api/tools')
        .then(handleResponse)
        .then(result => {
          const {tools} = result.data;
          tools.forEach(descriptor => {
            TemplateRegistry.registerTool(descriptor);
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
    const key = this.createChildKey();

    return Card_({
      key,
      data,
      template,
      // spatial,
      onClick: this.handleNodeClick,
      clickMode: CLICK_TRANSPARENT
    })._Card
  }

  createToolControl(tool) {

    //FIXME: update tools when filter is set

    const {focusData} = this.state;
    let toolControl;
    switch (tool.display) {
      case 'radio-buttons': {
        const {id, values, width, height, label} = tool;
        const reset = {id: FILTER_RESET, name: 'All', onSelect: () => this.removeToolFilter(tool.id)};
        const options = values.map(value => ({id: value, name: value, onSelect: () => this.setToolFilter(tool, value)}));
        options.push(reset);
        toolControl = RadioButtons_({key: id, size: {width, height}, label, options, selectedId: FILTER_RESET })._RadioButtons;
        break;
      }
      case 'trellis':
        const {id, width, filter, align, arrangement, height, template} = tool;
        // const reset = {id: FILTER_RESET, name: 'All', onSelect: () => this.removeToolFilter(tool.id)};

        toolControl = Div_({
          key: id,
          style: {width, height},
          children: Trellis(focusData, {key: id, source: TYPE_NODES, template, inputSelector: null,
                groupAttribute: filter, align, arrangement, x: 0, y: 0, w: width, h: height
              },

              ({component}) => {
                const dataValue = component.innerProps.data[filter];
              this.setToolFilter(tool, dataValue);},
              CLICK_OPAQUE)
        })._Div;
        break;
      default:
        throw new Error(`Unknown tool display ${tool.display}`);
    }
    return toolControl;
  }

  createUpdatedToolControls(toolId, selectedValue) {
    const { activeTools, toolControls } = this.state;
    const tool = activeTools[toolId];
    const control = {...toolControls[toolId]};
    switch (tool.display) {
      case 'radio-buttons':
        control.selectedId = selectedValue || FILTER_RESET;
        break;
    }
    return {...toolControls, [toolId]: control};
  }

  createStateForFocusCard(focusCard) {
    const { template } = focusCard;
    const { appliesTo, aggregate } = template;
    const views = TemplateRegistry.getViewsFor(appliesTo, aggregate);
    const tools = aggregate ? TemplateRegistry.getToolsFor(appliesTo) : [];
    const activeTools = {};
    const toolControls = {};
    tools.forEach(tool => {
      activeTools[tool.id] = tool.default ? tool : null;
      if (tool.default) {
        toolControls[tool.id] = this.createToolControl(tool);
      }
    });
    return {focusCard, views, tools, activeTools, toolControls, filters: {}};
  }

  setFocusCard(focusCard) {
    const toolState = this.createStateForFocusCard(focusCard);
    this.setState(toolState);
    this.transitionToState(this.recalcLayout(toolState.toolControls));
  }


  setToolFilter(tool, value) {

    const {currentFilters} = this.state;

    if (tool.type !== 'filter') {
      throw new Error(`Can't use filter for tool ${tool.id} of type ${tool.type}. Use tool of type filter instead.`);
    }
    const comparison = (typeof value === 'object' && value.constructor === GraphNode) ? COMPARISON_HAS_ASSOCIATED : COMPARISON_EQUAL;
    const newFilter = new Filter(tool.filter, comparison, value);

    const newFilters = {...currentFilters, [tool.id]: newFilter};
    this.updateFilteredState(newFilters, tool.id, value);
  }


  removeToolFilter(toolId) {
    const { currentFilters } = this.state;
    this.updateFilteredState(omit(currentFilters, toolId), toolId, null);
  }


  updateFilteredState(newFilters, toolId, value) {
    const { focusData, focusCard } = this.state;
    const data = createPreprocessedCardNode(applyFilters(Object.values(newFilters), focusData[TYPE_NODES]), {}, focusCard.template);

    const newFocusCard =  {...focusCard, data};
        // this.createFocusCard(data, focusCard.template);
    this.setState({currentFilters: newFilters, toolControls: this.createUpdatedToolControls(toolId, value), focusCard: newFocusCard});
  }


  handleToolToggle(toolId) {
    const {tools} = this.state;
    const activeTools = {...this.state.activeTools};
    const toolControls = {...this.state.toolControls};
    if (activeTools[toolId]) {
      this.removeToolFilter(toolId);
      delete toolControls[toolId];
      activeTools[toolId] = null;
    } else {
      const tool = tools.find(tool => tool.id === toolId);
      activeTools[toolId] = tool;
      toolControls[toolId] = this.createToolControl(tool);
    }
    this.setState({ activeTools, toolControls });
    this.transitionToState(this.recalcLayout(toolControls));
  }


  handleViewSelect(viewId) {
    const {focusCard, focusData, currentFilters} = this.state;
    const template = TemplateRegistry.getTemplate(viewId);

    const data = template.aggregate ?  createPreprocessedCardNode(applyFilters(Object.values(currentFilters),
        focusData[TYPE_NODES].map(node => (node.originalNode || node))), {}, template): focusCard.data;
    this.setState({focusCard: this.createFocusCard(data, template, currentFilters)});
  }


  createChildDescriptors(props) {

    const {focusCard, tools, activeTools, views, error, mainWidth, focusHeight, sideBarWidth, breadcrumbCards,
      canvasHeight, hoverCard, breadCrumbHeight, toolbarHeight, windowHeight, toolControls, focusZIndex} = this.state;

    // const backgroundColor = (map && map.backColor) || '#ffffff';
    if (error) {
      return Div_({}, `An error occurred: ${error.message}`)._Div;
    }

    const hoverChildren = [];
    if (hoverCard) {
      const menuRight = hoverCard.template.getSize().width * hoverCard.spatial.scale + hoverCard.spatial.x;
      hoverChildren.push(hoverCard);
      hoverChildren.push(hoverCardMenu(hoverCard.spatial.y, menuRight, this.handleHoverCardClose,
          this.handleHoverCardPin, this.handleHoverCardStash))
    }

    if (focusCard) {
     const { width, height } = focusCard.template.getSize();
     focusCard.spatial = fit(mainWidth - 2 * MARGIN, focusHeight - 2 * MARGIN - TOOL_HEIGHT, width,
         height, MARGIN,  MARGIN, 1.2);
    }

    return [
      BreadcrumbLane_({
        key: BREADCRUMBS,
        spatial: {x: 0, y: 0, scale: 1},
        size:  {width: mainWidth, height: breadCrumbHeight},
        children: breadcrumbCards,
        canvasHeight
      })._BreadcrumbLane,
      ToolPanel_({
          key: 'tools',
          size: { width: mainWidth, height: toolbarHeight},
          spatial: {x: 0, y: focusHeight + breadCrumbHeight, scale: 1},
          children: Object.values(toolControls)
        })._ToolPanel,
      Div_({
          key: FOCUS,
          className: css.focus,
          spatial: {x: 0, y: breadCrumbHeight, scale: 1},
          children: focusCard,
          style: {zIndex: focusZIndex}
        })._Div,
      Sidebar_({size: {width: sideBarWidth, height: windowHeight},
        menuTop: breadCrumbHeight,
        key: SIDEBAR,
        spatial: {x: mainWidth, y: 0, scale: 1},
        views: views.map(view => ({id: view.id, name: view.name || view.id, selected: view.id === focusCard.template.id})),
        tools: tools && tools.map(tool => ({id: tool.id, name: tool.name, selected: activeTools[tool.id]})),
        onToolToggle: this.handleToolToggle,
        onViewClick: this.handleViewSelect,
      })._Sidebar,
      Div_({
          key: OVERLAY,
          className: css.overlay,
          children: hoverChildren
        })._Div
    ];
  }

  recalcLayout(toolControls) {
    const {windowWidth, windowHeight} = this.state;
    const sideBarWidth = Math.min(Math.min(SIDEBAR_PERCENT * windowWidth, SIDEBAR_MAX), 4 * windowHeight);

    const breadCrumbHeight = 0.15 * windowHeight;
    const toolControlList = Object.values(toolControls);
    const toolbarHeight = toolControlList.reduce((result, control) => result + (control.height || 50), 0)
        + 20 * (toolControlList.length + 1);
    const focusHeight = windowHeight - breadCrumbHeight - toolbarHeight;
    const mainHeight = windowHeight;
    const mainWidth = windowWidth - sideBarWidth;

    return { breadCrumbHeight, toolbarHeight, focusHeight, mainWidth, mainHeight, sideBarWidth};
  }

  onResize(width, height) {
    this.dom.style.width = `${width}px`;
    this.dom.style.height = `${height}px`;
    this.setState({windowWidth: width, windowHeight: height, ...this.recalcLayout(this.state.toolControls || {})});
  }

};

ComponentFactory.registerType(App);

export const App_ = (props, children) => ({_App: {type: APP, children, ...props}});
