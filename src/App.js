import P from 'prop-types';
import {get, omit} from 'lodash';
import Component from '@symb/Component';
import css from './App.css';
import ComponentFactory from "@symb/ComponentFactory";
import Cache, {TYPE_AGGREGATOR, TYPE_CONTEXT, TYPE_NODES} from './graph/Cache';
import TemplateRegistry from './templates/TemplateRegistry';
import {Div_} from '@symb/Div';
import {Card_} from "@/components/Card";
import {Sidebar_} from "@/components/Sidebar";
import GraphNode from "@/graph/GraphNode";
import {MARGIN, SIDEBAR_MAX, SIDEBAR_PERCENT} from "@/Config";
import {fit, relSpatial} from "@symb/util";
import {createPreprocessedCardNode, hoverCardMenu} from "@/components/Generators";
import {BreadcrumbLane_} from "@/components/BreadcrumbLane";
import {ToolPanel_} from "@/components/ToolPanel";
import Filter, {applyFilters, COMPARISON_EQUAL, COMPARISON_HAS_ASSOCIATED} from "@/graph/Filter";

import {CLICK_NORMAL, CLICK_OPAQUE, CLICK_TRANSPARENT} from "@/components/Constants";
import {
  getCardDescriptorsFromDb,
  getClientConfig,
  getDataFromBackend,
  getDictionaryFromDb,
  getToolDescriptorsFromDb
} from "@/Data";
import {createFilterControl, updatedToolControl} from "@/Tools";

const APP = 'app';
const BREADCRUMBS = 'breadcrumbs';
const SIDEBAR = 'sidebar';
const FOCUS = 'focus';
const HOVER_MENU = 'hover-menu';
const TOOL_HEIGHT = 10;

export default class App extends Component {

  static type = APP;
  static className = css.app;

  static propTypes = {
    title: P.string
  };


  // noinspection DuplicatedCode
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
      currentViewOptions: {},
      optionControls: [],
      breadCrumbCards: [],
      focusData: null,
      focusCard: null,
      hoverCard: null,
      allowInteractions: true,
      dataLoaded: false,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      breadCrumbHeight: 0,
      toolbarHeight: 0,
      error: null,
    };

    this.nextChildIndex = 1;
    this.onResize(window.innerWidth, window.innerHeight);

    Promise.all([getClientConfig(this.onError), getDictionaryFromDb(this.onError)])
        .then(() => Promise.all([...getDataFromBackend(this.onError),
          getCardDescriptorsFromDb(this.onError),
          getToolDescriptorsFromDb(this.onError)]))
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
            this.setFocusCard(this.createFocusCard(startData, TemplateRegistry.getTemplate('root'), {}));
          }
        });
    this.handleNodeClick = this.handleNodeClick.bind(this);
    this.handleHoverCardStash = this.handleHoverCardStash.bind(this);
    this.handleHoverCardPin = this.handleHoverCardPin.bind(this);
    this.handleHoverCardClose = this.handleHoverCardClose.bind(this);
    this.handleFocusCardStash = this.handleFocusCardStash.bind(this);
    this.handleToolToggle = this.handleToolToggle.bind(this);
    this.handleViewSelect = this.handleViewSelect.bind(this);
    this.removeToolFilter = this.removeToolFilter.bind(this);
    this.setToolFilter = this.setToolFilter.bind(this);
    this.handleOptionSelect = this.handleOptionSelect.bind(this);
    this.onError = this.onError.bind(this);
  }

  onError(error) {
    this.setState({error});
  }


  createChildKey() {
    return `card${this.nextChildIndex++}`;
  }


  getFocusPlane() {
    return this.childByKey[FOCUS];
  }


  getBreadcrumbLane() {
    return this.childByKey[BREADCRUMBS];
  }


  handleHoverCardStash() {
    const { hoverCard } = this.state;
    this.moveCardToBreadcrumbs(  {...hoverCard,  hover: false, onClick: this.handleNodeClick, clickMode: CLICK_NORMAL}, {});
  }

  handleFocusCardStash() {
    const { focusCard } = this.state;
    const hoverCard = {...focusCard, key: this.createChildKey()};
    this.setState({ hoverCard });
    this.moveCardToBreadcrumbs(  {...hoverCard, onClick: this.handleNodeClick, clickMode: CLICK_NORMAL}, {});
  }

  handleHoverCardClose() {
    this.setState({hoverCard: null});
  }


  handleHoverCardPin() {
    const { hoverCard } = this.state;

    const newFocusCard = {...hoverCard,  hover: false, onClick: this.handleNodeClick, clickMode: CLICK_TRANSPARENT};

    this.moveCardToFocus(newFocusCard, hoverCard.data);
  }


  handleNodeClick({component}) {
    // const {id} = clickData;
    // const node = Cache.getNodeByUniqueKey(id);
    // const template = TemplateRegistry.getTemplate(node.type.uri);
    // this.setState({inspectionCard: {template, data: node}});

    if (component.parent.key === BREADCRUMBS) {
      this.cloneNodeToFocus(component);
    } else {
      this.cloneNodeToHover(component);
    }
  }


  cloneNodeToFocus(component) {
    const { data, template } = component.innerProps;
    const spatial = component.getRelativeSpatial(this.getFocusPlane());

    const newFocusCard = Card_({ key: this.createChildKey(), data, hover: false, template, spatial,
      onClick: this.handleNodeClick, clickMode: CLICK_TRANSPARENT, style: { zIndex: 2 } })._Card
    this.setState({hoverCard: newFocusCard, allowInteractions: false});
    this.moveCardToFocus(newFocusCard, data);
  }


  cloneNodeToHover(component) {
    const { data, template } = component.innerProps;
    const { mainWidth, focusHeight, breadCrumbHeight } = this.state;

    const spatial = component.getRelativeSpatial(this.getFocusPlane());

    const clone = Card_({key: this.createChildKey(), data, hover: true, template, spatial, clickMode: CLICK_OPAQUE,
      onClick: this.handleHoverCardPin,
      style: {zIndex: 2}})._Card
    this.setState({hoverCard: clone, allowInteractions: false});

    const newSpatial = this.calcHoverCardSpatial({hoverCard: clone, mainWidth, focusHeight, breadCrumbHeight});
    this.transitionToState({hoverCard:{...clone, spatial: newSpatial}}).onEndCall(() => {
          this.setState({allowInteractions: true});
        }
    );
  }


  moveCardToFocus(newFocusCard, data) {
    const { focusCard } = this.state;
    const targetState = this.createStateForFocus(newFocusCard, data);
    const endState = {focusCard: {...targetState.focusCard, style: {zIndex: 0}}};
    this.moveCardToBreadcrumbs(focusCard, targetState, endState);
  }


  moveCardToBreadcrumbs(card, targetState, endState) {
    const { breadCrumbCards, breadCrumbHeight } = this.state;
    const focusPlane = this.getFocusPlane();

    // old card will be transformed into breadcrumb card. For the time of transition, it is the hoverCard
    const { breadCrumbCard, nextChildPos, targetScrollPos, adoptCard } = this.turnIntoBreadCrumbCard(card);
    const newHoverCard = {
      ...breadCrumbCard,
      style: {zIndex: 1},
      spatial: relSpatial(breadCrumbCard.spatial, -(targetScrollPos || this.getBreadcrumbLane().dom.scrollLeft), -breadCrumbHeight)
    };

    targetState = {
      ...targetState,
      allowInteractions: false,
      hoverCard: newHoverCard,
      nextChildPos
    };

    const tween = this.transitionToState(targetState).onEndCall(() => {
      const newState = { ...(endState || {}), allowInteractions: true, hoverCard: null};
      if (adoptCard) {
        const instance = focusPlane.childByKey[card.key];
        this.getBreadcrumbLane().adoptChild( instance );
        // instance.setSpatial(breadCrumbCard.spatial);
        newState.breadCrumbCards = [...breadCrumbCards, breadCrumbCard];
      }
      this.setState(newState);
    });
    if (targetScrollPos) {
      this.getBreadcrumbLane().scrollToPos(targetScrollPos, tween);
    }
  }


  /**
   * calculate descriptor for a new breadcrumb card from a current focus card
   * @param sourceCard
   * @return {{targetScrollPos: position breadcrumb lane needs to scroll to, null if no scrolling required,
   * breadCrumbCard: new card descriptor to be appended to breadcrumb cards if it,
   * nextChildPos: position for the next breadcrumb,
   * adoptCard: boolean, is false if such a breadcrumb already exists}}
   */
  turnIntoBreadCrumbCard(sourceCard) {
    const { nextChildPos, breadCrumbHeight, mainWidth, breadCrumbCards} = this.state;
    const existing = breadCrumbCards.find(card =>
        card.template === sourceCard.template &&
        (card.data === sourceCard.data ||
            (card.data[TYPE_NODES] != null && card.data[TYPE_NODES] === sourceCard.data[TYPE_NODES])));
    if (existing) {
      const pos = existing.spatial.x;
      return {
        breadCrumbCard: {...sourceCard, clickMode: CLICK_NORMAL, spatial: existing.spatial, style: {zIndex: 0}},
        nextChildPos,
        targetScrollPos:  pos > mainWidth ? pos - mainWidth : null,
        adoptCard: false
      };
    }

    const breadcrumbNativeSize = sourceCard.template.getSize();
    const newBreadcrumbScale =  (breadCrumbHeight - 24) / breadcrumbNativeSize.height;
    const newBreadcrumbSpatial = {x: nextChildPos, y: 7, scale: newBreadcrumbScale};
    const newBreadCrumbCard = {...sourceCard, clickMode: CLICK_NORMAL, spatial: newBreadcrumbSpatial, style: {zIndex: 0}};
    const newNextChildPos = nextChildPos + newBreadcrumbScale * breadcrumbNativeSize.width + MARGIN;

    return {
      nextChildPos: newNextChildPos,
      breadCrumbCard: newBreadCrumbCard,
      targetScrollPos:  newNextChildPos > mainWidth ? newNextChildPos - mainWidth : null,
      adoptCard: true
    }
  }


  createFocusCard(data, template, options) {
    const key = this.createChildKey();

    return Card_({
      key,
      data,
      template,
      options,
      onClick: this.handleNodeClick,
      clickMode: CLICK_TRANSPARENT
    })._Card
  }


  createStateForFocus(focusCard, data) {
    if (data && data.constructor === GraphNode) {
      console.log(`----------------------------------------------------------`);
      console.log(`focus data is ${data.getSummary()}`);
    }
    //TODO: More elegant way to deal with root card
    const { template } = focusCard;
    const { aggregate } = template;
    let nodeTypeUri = 'core:start';
    if (data && data.getTypeUri() === TYPE_AGGREGATOR ) {
      const subNodes = data[TYPE_NODES];
      if (subNodes && subNodes.length > 0) {
        nodeTypeUri = subNodes[0].getTypeUri();
      }
    } else if (data){
      nodeTypeUri = data.getTypeUri();
    }
    const views = TemplateRegistry.getViewsFor(nodeTypeUri, aggregate);
    const tools = aggregate ? TemplateRegistry.getToolsFor(nodeTypeUri) : [];
    const activeTools = {};
    const toolControls = {};
    tools.forEach(tool => {
      activeTools[tool.id] = tool.default ? tool : null;
      if (tool.default) {
        toolControls[tool.id] = createFilterControl(tool, data, this.setToolFilter, this.removeToolFilter);
      }
    });
    let currentViewOptions;
    if (focusCard.options) {
      currentViewOptions = focusCard.options;
    } else {
      currentViewOptions = template.getDefaultOptions();
      focusCard.options = currentViewOptions;
    }
    const {windowWidth, windowHeight} = this.state;
    return { views, tools, activeTools, toolControls, filters: {}, focusData: data,
      currentViewOptions,
      ...this.recalcLayout({ toolControls, windowWidth, windowHeight, focusCard })};
  }


  setFocusCard(focusCard) {
    this.transitionToState(this.createStateForFocus(focusCard, null));
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


  updatedFocusCard(focusCard, focusData, filters) {
    const data = createPreprocessedCardNode(applyFilters(Object.values(filters), focusData[TYPE_NODES]),
        {}, focusCard.template);
    return  {...focusCard, data};
  }


  updateFilteredState(newFilters, toolId, value) {
    const { focusData, focusCard, activeTools, toolControls } = this.state;
    const { } = this.state;
    const tool = activeTools[toolId];
    const newFocusCard = this.updatedFocusCard(focusCard, focusData, newFilters);
    // this.createFocusCard(data, focusCard.template);
    this.transitionToState({currentFilters: newFilters,
      toolControls: {...toolControls, [toolId]: updatedToolControl(tool, toolControls[toolId], value, newFocusCard.data, this.setToolFilter, this.removeToolFilter)},
      focusCard: newFocusCard});
  }


  handleToolToggle(toolId) {
    const {tools, hoverCard, focusData} = this.state;
    let activeTools;
    let toolControls;
    let focusCard;
    let currentFilters;

    if (this.state.activeTools[toolId]) {
      activeTools = omit(this.state.activeTools, toolId);
      toolControls = omit(this.state.toolControls, toolId);
      currentFilters = omit(this.state.currentFilters, toolId);
      focusCard = this.updatedFocusCard(this.state.focusCard, focusData, currentFilters);
    } else {
      focusCard = this.state.focusCard;
      currentFilters = this.state.currentFilters;
      const tool = tools.find(tool => tool.id === toolId);
      activeTools = {...this.state.activeTools, [toolId]: tool};
      toolControls = {...this.state.toolControls, [toolId]:
            createFilterControl(tool, focusData, this.setToolFilter, this.removeToolFilter) };
    }
    const {windowWidth, windowHeight} = this.state;
    this.transitionToState({
      currentFilters,
      toolControls,
      activeTools,
      ...this.recalcLayout({toolControls, windowWidth, windowHeight, hoverCard, focusCard})
    });
  }


  handleViewSelect(viewId) {
    const {focusData, currentFilters, mainWidth, focusHeight} = this.state;
    const template = TemplateRegistry.getTemplate(viewId);

    const data = template.aggregate ?  createPreprocessedCardNode(applyFilters(Object.values(currentFilters),
        focusData[TYPE_NODES].map(node => (node.originalNode || node))), {}, template): this.state.focusCard.data;

    const currentViewOptions = template.getDefaultOptions();

    const focusCard = this.createFocusCard(data, template, currentFilters, currentViewOptions);
    focusCard.spatial = this.calcFocusCardSpatial({focusCard, mainWidth, focusHeight});
    this.setState({ focusCard, currentViewOptions: template.getDefaultOptions() });
  }


  handleOptionSelect(key, value) {
    const {currentViewOptions, focusCard} = this.state;
    const newViewOptions = {...currentViewOptions, [key]: value};

    this.setState({
      currentViewOptions: newViewOptions,
      focusCard: {...focusCard, options: newViewOptions}
    })
  }


  calcFocusCardSpatial({focusCard, mainWidth, focusHeight}) {
    const { width, height } = focusCard.template.getSize();
    return fit(mainWidth - 2 * MARGIN, focusHeight - 2 * MARGIN - TOOL_HEIGHT, width,
        height, MARGIN,  MARGIN, 1.2);
  }


  calcHoverCardSpatial({hoverCard, mainWidth, focusHeight}) {
    const { width, height } = hoverCard.template.getSize();
    return fit(mainWidth - 2 * MARGIN, focusHeight - 2 * MARGIN, width, height, MARGIN,MARGIN,1.2);
  }


  recalcLayout({toolControls, windowWidth, windowHeight, focusCard, hoverCard}) {
    const sideBarWidth = Math.min(Math.min(SIDEBAR_PERCENT * windowWidth, SIDEBAR_MAX), 4 * windowHeight);

    const breadCrumbHeight = 0.15 * windowHeight;
    const toolControlList = Object.values(toolControls);
    // noinspection JSCheckFunctionSignatures
    const toolbarHeight = toolControlList.reduce((result, control) => Math.max(result, (control.size.height || 0)), 0) + 2 * MARGIN;
    const focusHeight = windowHeight - breadCrumbHeight - toolbarHeight;
    const mainHeight = windowHeight;
    const mainWidth = windowWidth - sideBarWidth;

    const layoutState = { breadCrumbHeight, toolbarHeight, focusHeight, mainWidth, mainHeight, sideBarWidth };

    if (hoverCard) {
      layoutState.hoverCard = {...hoverCard,
        spatial: this.calcHoverCardSpatial({hoverCard, mainWidth, focusHeight, breadCrumbHeight})}
    }

    if (focusCard) {
      layoutState.focusCard = {...focusCard,
        spatial: this.calcFocusCardSpatial({focusCard, mainWidth, focusHeight})
      };
    }

    return layoutState;
  }


  onResize(width, height) {
    this.dom.style.width = `${width}px`;
    this.dom.style.height = `${height}px`;
    const {toolControls, hoverCard, focusCard} = this.state;
    const windowWidth = width;
    const windowHeight = height;
    this.setState({windowWidth, windowHeight, ...this.recalcLayout(
          {toolControls: toolControls || {}, windowWidth, windowHeight, hoverCard, focusCard})});
    this.renderStateChange();
  }


  createChildDescriptors(props) {

    const {focusCard, tools, activeTools, views, error, mainWidth, focusHeight, sideBarWidth, breadCrumbCards, nextChildPos,
      hoverCard, breadCrumbHeight, toolbarHeight, windowHeight, toolControls, allowInteractions, currentViewOptions} = this.state;

    // const backgroundColor = (map && map.backColor) || '#ffffff';
    if (error) {
      return Div_({}, `An error occurred: ${error.message}`)._Div;
    }

    const hoverChildren = [];
    if (hoverCard) {
      const menuRight = hoverCard.template.getSize().width * hoverCard.spatial.scale + hoverCard.spatial.x;
      hoverChildren.push(hoverCard);
      if (allowInteractions) {
        hoverChildren.push(hoverCardMenu(HOVER_MENU, hoverCard.spatial.y, menuRight, this.handleHoverCardClose,
            this.handleHoverCardStash));
      }
    } else if (focusCard && focusCard.template.clickable) {
      const menuRight = focusCard.template.getSize().width * focusCard.spatial.scale + focusCard.spatial.x;
      hoverChildren.push(hoverCardMenu(HOVER_MENU, focusCard.spatial.y, menuRight, null,
          this.handleFocusCardStash));
    }

    return [
      BreadcrumbLane_({
        key: BREADCRUMBS,
        spatial: {x: 0, y: 0, scale: 1},
        size:  {width: mainWidth, height: breadCrumbHeight},
        children: breadCrumbCards,
        canvasWidth: nextChildPos
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
        children: [focusCard, ...hoverChildren]
      })._Div,
      Sidebar_({size: {width: sideBarWidth, height: windowHeight},
        menuTop: breadCrumbHeight,
        key: SIDEBAR,
        spatial: {x: mainWidth, y: 0, scale: 1},
        views: views.map(view => ({id: view.id, name: view.name || view.id, selected: view.id === focusCard.template.id})),
        tools: tools && tools.map(tool => ({id: tool.id, name: tool.name, selected: activeTools[tool.id]})),
        options: get(focusCard, ['template','options']) || {},
        currentViewOptions,
        onOptionSelect: this.handleOptionSelect,
        onToolToggle: this.handleToolToggle,
        onViewClick: this.handleViewSelect,
      })._Sidebar
    ];
  }
};

ComponentFactory.registerType(App);

export const App_ = (props, children) => ({_App: {type: APP, children, ...props}});
