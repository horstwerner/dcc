import P from 'prop-types';
import {isEqual, omit, pick} from 'lodash';
import Component from '@symb/Component';
import css from './App.css';
import ComponentFactory from "@symb/ComponentFactory";
import Cache, {resolveAttribute, TYPE_AGGREGATOR, TYPE_CONTEXT, TYPE_NODES} from './graph/Cache';
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
import {sum} from "@/Aggregator";
import {EMPTY, sliceBy} from "@/graph/GroupedSet";
import Trellis from "@/generators/Trellis";

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
      breadCrumbHeight: 0,
      toolbarHeight: 0,
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

  handleHoverCardStash() {
    console.log(`stash`);
  }

  handleHoverCardClose() {
    this.setState({hoverCard: null});
  }

  handleHoverCardPin() {
    const {nextChildPos, mainWidth, hoverCard, breadCrumbHeight, focusHeight, focusCard, breadcrumbCards } = this.state;
    const breadCrumbLane = this.childByKey[BREADCRUMBS];
    const focusInstance = this.childByKey[FOCUS].childByKey[focusCard.key];

    const breadcrumbNativeSize = focusCard.template.getSize();
    const newBreadcrumbScale =  (breadCrumbHeight - 24) / breadcrumbNativeSize.height;
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
            focusData: hoverCard.data,
            breadcrumbCards: [...breadcrumbCards, focusCard],
            nextChildPos: nextChildPos + newBreadcrumbScale * breadcrumbNativeSize.width + MARGIN});
          this.setFocusCard( {...hoverCard, hover: false, onClick: this.handleNodeClick});
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
    const {mainWidth, focusHeight} = this.state;
    // const newScale = Math.min(mainWidth / width, mainHeight / height);
    // const yOffset = 0.5 * (mainHeight - newScale * height);
    // const xOffset = mainWidth - newScale * width ;
    const newSpatial = fit(mainWidth - 2 * MARGIN, focusHeight - 2 * MARGIN, width, height, MARGIN,MARGIN,1.2);

    const clone = Card_({key: 'hover', data, hover: true, template, spatial, style: {zIndex: 2}})._Card
    // const veil = Div_({key: 'veil', style:{position: 'absolute', width: mainWidth, height: mainHeight, backgroundColor: SIDEBAR_BACK_COLOR, zIndex: 1}, alpha: 0})._Div
    this.setState({hoverCard: clone});

    const tween = new Tween(350)
        .addInterpolation([0, spatial.x, spatial.y, spatial.scale], [1, newSpatial.x, newSpatial.y, newSpatial.scale],
            (sp_array) => {
            const spatial = {x: sp_array[1], y: sp_array[2], scale: sp_array[3]};
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

  createFocusCard(data, template, filters) {
    const key = this.createChildKey();

    return Card_({
      key,
      data,
      template,
      // spatial,
      onClick: this.handleNodeClick
    })._Card
  }

  createToolControl(tool) {
    const {focusData} = this.state;
    let toolControl;
    switch (tool.display) {
      case 'radio-buttons': {
        const {id, values, width, height, label} = tool;
        const reset = {id: FILTER_RESET, name: 'All', onSelect: () => this.removeToolFilter(tool.id)};
        const options = values.map(value => ({id: value, name: value, onSelect: () => this.setToolFilter(tool, value)}));
        options.push(reset);
        toolControl = RadioButtons_({key: id, width, height, label, options, selectedId: FILTER_RESET })._RadioButtons;
        break;
      }
      case 'trellis':
        const {id, width, filter, align, arrangement, height, template} = tool;
        // const reset = {id: FILTER_RESET, name: 'All', onSelect: () => this.removeToolFilter(tool.id)};

        toolControl = Div_({
          key: id,
          style: {width, height},
          children: Trellis(focusData, {key: id, source: TYPE_NODES, template, inputSelector: null, groupAttribute: filter, align, arrangement, x: 0, y: 0, w: width, h: height},
            (data) => {
              debugger;
            })
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

  setFocusCard(focusCard) {
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
    this.setState({focusCard, views, tools, activeTools, toolControls, filters: {}});
    const {windowWidth, windowHeight} = this.state;
    this.onResize(windowWidth, windowHeight);
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

    const newFocusCard =  this.createFocusCard(data, focusCard.template, Object.values(newFilters));
    this.setState({currentFilters: newFilters, toolControls: this.createUpdatedToolControls(toolId, value), focusCard: newFocusCard});
  }

  handleToolToggle(toolId) {
    const {tools} = this.state;
    const activeTools = {...this.state.activeTools};
    const toolControls = {...this.state.toolControls};
    if (activeTools[toolId]) {
      delete toolControls[toolId];
      activeTools[toolId] = null;
    } else {
      const tool = tools.find(tool => tool.id === toolId);
      activeTools[toolId] = tool;
      toolControls[toolId] = this.createToolControl(tool);
    }
    this.setState({ activeTools, toolControls });
    this.onResize(this.state.windowWidth, this.state.windowHeight);
  }

  handleViewSelect(viewId) {
    const {focusCard, focusData, currentFilters} = this.state;
    const template = TemplateRegistry.getTemplate(viewId);

    const data = template.aggregate ?  createPreprocessedCardNode(applyFilters(Object.values(currentFilters),focusData[TYPE_NODES].map(node => (node.originalNode || node))), {}, template): focusCard.data;
    this.setState({focusCard: this.createFocusCard(data, template, currentFilters)});
  }

  updateContents(props) {

    const {focusCard, tools, activeTools, views, error, mainWidth, focusHeight, sideBarWidth, breadcrumbCards, canvasHeight, hoverCard, breadCrumbHeight, toolbarHeight,
      windowHeight, toolControls} = this.state;

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
     const newSpatial = fit(mainWidth - 2 * MARGIN, focusHeight - 2 * MARGIN - TOOL_HEIGHT, width, height, MARGIN,  MARGIN, 1.2);
     if (!isEqual(newSpatial, focusCard.spatial)) {
       focusCard.spatial = newSpatial;
     }
    }

    this.createChildren([
      BreadcrumbLane_({
        key: BREADCRUMBS,
        spatial: {x: 0, y: windowHeight - breadCrumbHeight, scale: 1},
        width: mainWidth,
        height: breadCrumbHeight,
        children: breadcrumbCards,
        canvasHeight
      })._BreadcrumbLane,
      ToolPanel_({
          key: 'tools',
          width: mainWidth + 1,
          height: toolbarHeight,
          spatial: {x: 0, y: focusHeight, scale: 1},
          children: Object.values(toolControls)
        })._ToolPanel,
      Div_({
          key: FOCUS,
          className: css.focus,
          spatial: {x: 0, y: 0, scale: 1},
          children: focusCard
        })._Div,
      Sidebar_({w: sideBarWidth, h: windowHeight,
        menuTop: 0.5 *  windowHeight - breadCrumbHeight,
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
    ]);
  }

  onResize(width, height) {
    console.log(`onResize:${width}-${height}`);
    this.dom.style.width = `${width}px`;
    this.dom.style.height = `${height}px`;
    const sideBarWidth = Math.min(Math.min(SIDEBAR_PERCENT * width, SIDEBAR_MAX), 4 * height);

    const breadCrumbHeight = 0.15 * height;
    const toolControls = Object.values(this.state.toolControls);
    const toolbarHeight = toolControls.reduce((result, control) => result + (control.height || 50), 0) + 20 * (toolControls.length + 1);
    const focusHeight = height - breadCrumbHeight - toolbarHeight;
    const mainHeight = height;
    const mainWidth = width - sideBarWidth;

    this.setState({windowWidth: width, windowHeight: height, breadCrumbHeight, toolbarHeight, focusHeight, mainWidth, mainHeight, sideBarWidth});
  }

};

ComponentFactory.registerType(App);

export const App_ = (props, children) => ({_App: {type: APP, children, ...props}});
