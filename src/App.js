import P from 'prop-types';
import {get, omit, pick, without} from 'lodash';
import Component from '@symb/Component';
import ComponentFactory from "@symb/ComponentFactory";
import Cache from './graph/Cache';
import TemplateRegistry, {DEFAULT_VIEW_NAME} from './templates/TemplateRegistry';
import {Div_} from '@symb/Div';
import {Card_} from "@/components/Card";
import {Sidebar_} from "@/components/Sidebar";
import GraphNode from "@/graph/GraphNode";
import {DEBUG_MODE, getAppCss, getConfig, MARGIN, SIDEBAR_MAX, SIDEBAR_PERCENT} from "@/Config";
import {createContext, fillIn, fit, getCommonType, isDataEqual} from "@symb/util";
import {createPreprocessedCardNode, focusCardMenu, hoverCardMenu} from "@/components/Generators";
import {BreadcrumbLane_} from "@/components/BreadcrumbLane";
import {calcMaxChildren, ToolPanel_} from "@/components/ToolPanel";
import Filter, {applyFilters, COMPARISON_EQUAL, COMPARISON_HAS_ASSOCIATED} from "@/graph/Filter";

import {CLICK_OPAQUE, CLICK_TRANSPARENT} from "@/components/Constants";
import {fetchSubGraph, getCardDescriptors, getClientConfig, getData, getDictionary, getToolDescriptors} from "@/Data";
import {createFilterControl, updatedToolControl} from "@/Tools";
import TypeDictionary, {TYPE_AGGREGATOR, TYPE_NAME, TYPE_NODE_COUNT, TYPE_NODES} from "@/graph/TypeDictionary";
import {SYNTH_NODE_MAP, SYNTH_NODE_RETRIEVE} from "@/templates/Template";
import {mapNode} from "@/graph/Analysis";
import {LoadingAnimation_} from "@/components/LoadingAnimation";

const APP = 'app';
const BREADCRUMBS = 'breadcrumbs';
const SIDEBAR = 'sidebar';
const FOCUS = 'focus';
const HOVER_MENU = 'hover-menu';
const TOOL_HEIGHT = 10;
const BREADCRUMB_LANE_HEIGHT = 104;
const PINNED_ROOT_CARD = 'rootcard';

class App extends Component {

  static type = APP;

  static propTypes = {
    title: P.string
  };

  // noinspection DuplicatedCode
  constructor(props, parent, domNode) {
    super(props, parent, domNode);

    this.loadingAnimation = LoadingAnimation_({})._LoadingAnimation;

    this.state = {
      nextChildPos: MARGIN,
      currentData: Cache.rootNode,
      views: [],
      tools: [],
      activeTools: {},
      toolControls: [],
      currentFilters: [],
      currentViewOptions: {},
      optionControls: [],
      breadCrumbCards: [],
      pinnedCards: [],
      pinnedWidth: 0,
      focusData: null,
      focusCard: null,
      hoverCard: null,
      allowInteractions: true,
      waiting: true,
      dataLoaded: false,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      breadCrumbHeight: 0,
      toolbarHeight: 0,
      error: null,
    };

    window.addEventListener('contextmenu', function (e) {
      e.preventDefault();
    }, false);

    this.nextChildIndex = 1;

    Promise.all([getClientConfig(this.onError), getDictionary(this.onError)])
        .then(() => Promise.all([...getData(this.onError),
          getCardDescriptors(this.onError),
          getToolDescriptors(this.onError)]))
        .then(() => {
          if (DEBUG_MODE) {
            Cache.validateNodes();
          }
          const updateSocket = getConfig('updateWebSocket');
          if (updateSocket) {
              this.connectToUpdateSocket(updateSocket);
          }
          const { mainWidth, breadCrumbHeight } = this.state;
          if (!this.state.error) {
            const startData = new GraphNode(TYPE_AGGREGATOR, Cache.createUri());
            Cache.getEntityTypes().forEach(entityType => {
              startData.setBulkAssociation(entityType, Cache.rootNode.get(entityType));
            })
            const startTemplate = TemplateRegistry.getTemplate(getConfig('startTemplate'));
            const startNode = createPreprocessedCardNode(startData, null, startTemplate, null);
            const focusCard = this.createFocusCard(startNode, startTemplate, null);
            const { pinned, pinnedWidth } = this.calcPinnedCardPositions([this.toPinnedCard(focusCard, PINNED_ROOT_CARD)], mainWidth, breadCrumbHeight);

            this.setState({
              focusData: null,
              waiting: false,
              pinned,
              pinnedWidth,
              dataLoaded: true
            });
            this.setFocusCard(focusCard, null);
          }
        });
    this.handleNodeClick = this.handleNodeClick.bind(this);
    this.handleHoverCardPin = this.handleHoverCardPin.bind(this);
    this.handleBreadCrumbClick = this.handleBreadCrumbClick.bind(this);
    this.handleHoverCardToFocus = this.handleHoverCardToFocus.bind(this);
    this.handleHoverCardClose = this.handleHoverCardClose.bind(this);
    this.handleFocusCardPin = this.handleFocusCardPin.bind(this);
    this.handleToolToggle = this.handleToolToggle.bind(this);
    this.handleViewSelect = this.handleViewSelect.bind(this);
    this.removeToolFilter = this.removeToolFilter.bind(this);
    this.setToolFilter = this.setToolFilter.bind(this);
    this.handleOptionSelect = this.handleOptionSelect.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleSearchResultClick = this.handleSearchResultClick.bind(this);
    this.onError = this.onError.bind(this);
    this.moveCardToFocus = this.moveCardToFocus.bind(this);
    this.removeModals = this.removeModals.bind(this);
    this.onWSOpen = this.onWSOpen.bind(this);
    this.onWSMessage = this.onWSMessage.bind(this);
    this.onWSClose = this.onWSClose.bind(this);

    document.body.onkeyup = this.handleKeyUp;
    document.body.onkeydown = this.handleKeyDown;
    this.onResize(window.innerWidth, window.innerHeight);
  }

  connectToUpdateSocket(url) {
    this.ws = new WebSocket(url);
    this.ws.onopen = this.onWSOpen;
    this.ws.onclose = this.onWSClose;
    this.ws.onmessage = this.onWSMessage;
    this.ws.onerror = this.onError;
  }

  onWSOpen() {
    console.log('Websocket connection established ');
  };

  onWSClose() {
    console.log('Websocket connection closed');
    this.ws = null;
  };

  onWSMessage(event) {
    const data = JSON.parse(event.data);
    const { update } = data;
    if (update) {
      Cache.updateNodes(update);
    }
    // TODO: only activate when contextual node problem solved, see GraphNode.destroy()
    // if (remove) {
    //   Cache.removeNodes(remove);
    // }
  };

  updateDom(props, tween) {
    if (this.state.dataLoaded) {
      this.dom.className = getAppCss().app;
    }
    if (this.state.waiting) {
      this.dom.style.cursor = 'wait';
    } else {
      this.dom.style.cursor = '';
    }
  }

  onError(error) {
    this.setState({error});
  }


  createChildKey() {
    return `card${this.nextChildIndex++}`;
  }


  handleKeyDown(event) {
    if (event.key === 'f' && (event.ctrlKey || event.altKey)) {
      event.preventDefault();
    }
  }

  handleKeyUp(event) {
    if (event.key === 'Escape') {
      const { hoverCard } = this.state;
      if (hoverCard) {
        this.setState({hoverCard: null});
      } else {
        this.removeModals();
      }
    } else if (event.key === 'f' && (event.ctrlKey || event.altKey)) {
      this.getChild(SIDEBAR).focusSearchBox();
    }
  }

  removeModals() {
    this.getChild(SIDEBAR).clearSearch();
  }

  handleHoverCardPin() {
    const { hoverCard } = this.state;
    this.moveCardToPinned(this.toPinnedCard(hoverCard, hoverCard.key));
  }

  handleFocusCardPin() {
    const { focusCard } = this.state;
    const hoverCard = {...focusCard, key: this.createChildKey()};
    this.setState({ hoverCard });
    this.moveCardToPinned({...hoverCard, onClick: this.handleNodeClick, clickMode: CLICK_OPAQUE}, {});
  }

  moveCardToPinned(card) {
    const { mainWidth, breadCrumbHeight, breadCrumbCards } = this.state;
    const newPinned = [...this.state.pinned, card];
    const {pinned, pinnedWidth} = this.calcPinnedCardPositions(newPinned, mainWidth, breadCrumbHeight);
    const movedBreadCrumbs  = this.calcBreadCrumbChildren(breadCrumbCards, breadCrumbHeight, mainWidth, pinnedWidth);
    this.setState({hoverCard: null, pinned: newPinned});
    this.transitionToState({ pinned, pinnedWidth, breadCrumbCards: movedBreadCrumbs }, () => {
          pinned.find(pinCard=> pinCard.key === card.key).style.zIndex = 0;
          this.renderStateChange();
        });
  }

  removePin(card) {
    const { mainWidth, breadCrumbHeight, breadCrumbCards } = this.state;
    const newPinned = without(this.state.pinned, card);
    const {pinned, pinnedWidth} = this.calcPinnedCardPositions(newPinned, mainWidth, breadCrumbHeight);
    const movedBreadCrumbs  = this.calcBreadCrumbChildren(breadCrumbCards, breadCrumbHeight, mainWidth, pinnedWidth);
    this.transitionToState({pinned, pinnedWidth, breadCrumbCards: movedBreadCrumbs});
  }

  handleHoverCardClose() {
    this.setState({hoverCard: null});
  }

  handleHoverCardToFocus() {
    const { hoverCard, breadCrumbCards } = this.state;

    const newFocusCard = {...hoverCard,  hover: false, onClick: this.handleNodeClick, clickMode: CLICK_TRANSPARENT};

    this.moveCardToFocus(newFocusCard, breadCrumbCards);
  }

  handleBreadCrumbClick({component}) {
    const { key } = component;
    const { breadCrumbCards } = this.state;
    const clickedBreadCrumb = breadCrumbCards.find(card => card.key === key);
    const remainingBreadcrumbs = without(breadCrumbCards, clickedBreadCrumb);
    const focusCard = this.breadCrumbToFocusCard(clickedBreadCrumb);
    this.moveCardToFocus(focusCard, remainingBreadcrumbs);
  }

  handleNodeClick({event, component}) {
    if (event.button === 0) {
      this.cloneNodeToFocus(component);
    } else if (component.key !== this.state.focusCard.key) {
      this.cloneNodeToHover(component);
    }
  }

  //    const cloneNodeConfig = template.getDetailNode();

  createCloneCard(component, clickMode, onClick, onAvailable) {
    const { data, template, options} = component.innerProps;
    let spatial = component.getRelativeSpatial(this);
    const cloneTemplate = TemplateRegistry.getTemplate(template.getDetailTemplateId());

    if (cloneTemplate !== template) {
      const {width, height} = template.getSize();
      const cloneSize = cloneTemplate.getSize();
      spatial = fit(width * spatial.scale, height * spatial.scale, cloneSize.width, cloneSize.height, spatial.x, spatial.y);
    }

    const result = Card_({ key: this.createChildKey(), data, hover: false, template: cloneTemplate, options, spatial,
      onClick, clickMode, style: { zIndex: 2 } })._Card

    const cloneNodeConfig = template.getDetailNode();
    if (cloneNodeConfig) {
      const {method, type, uri} = cloneNodeConfig;

      const finalUri = uri ? fillIn(uri, data) : null;
      switch (method) {
        case SYNTH_NODE_MAP:
          result.data = mapNode(data, type, finalUri, cloneNodeConfig.mapping);
          break;
        case SYNTH_NODE_RETRIEVE:
          result.data = finalUri ? Cache.getNodeByUri(finalUri) : null;
          if (result.data == null) {
            this.setState({waiting: true});
            const requestUrl = fillIn(cloneNodeConfig.request, data);
            fetchSubGraph(requestUrl, type, finalUri, this.onError).then(entryNode => {
              result.data = entryNode;
              this.setState({waiting: false, hoverCard: result, allowInteractions: false});
              onAvailable(result);
            });
            return;
          }
      }
    }
    onAvailable(result);
  }

  cloneNodeToFocus(component) {

    const { breadCrumbCards } = this.state;

    this.createCloneCard(component, CLICK_TRANSPARENT, this.handleNodeClick, (cloneCard) => {
      this.moveCardToFocus(cloneCard, breadCrumbCards)
    });
  }


  cloneNodeToHover(component) {
    const { mainWidth, focusHeight, breadCrumbHeight } = this.state;

    this.createCloneCard(component, CLICK_OPAQUE, this.handleHoverCardToFocus, clone => {

      const newSpatial = this.calcHoverCardSpatial({
        template: clone.template,
        mainWidth,
        focusHeight,
        breadCrumbHeight
      });
      clone.hover = true;
      this.setState({hoverCard: clone, allowInteractions: false});
      this.transitionToState({hoverCard: {...clone, spatial: newSpatial}},() => {
            this.setState({allowInteractions: true});
          }
      );
    });
  }

  moveCardToFocus(newFocusCard, remainingBreadcrumbCards) {
    const { focusCard, pinned, breadCrumbHeight, mainWidth, pinnedWidth } = this.state;
    const existingPinned = pinned.find(card => isDataEqual(focusCard.data, card.data));
    const breadCrumbCards = existingPinned ?
        remainingBreadcrumbCards :
        [...remainingBreadcrumbCards, this.toBreadCrumbCard(focusCard)];

    this.removeModals();
    this.setState({allowInteractions: false, focusCard: newFocusCard, hoverCard: null, breadCrumbCards});
    const targetState = {...this.createStateForFocus(newFocusCard, newFocusCard.data),
      breadCrumbCards: this.calcBreadCrumbChildren(breadCrumbCards, breadCrumbHeight, mainWidth, pinnedWidth)};
    this.transitionToState(targetState, () => this.setState({allowInteractions: true}));
  }

  calcPinnedCardPositions(pinned, mainWidth, breadCrumbHeight) {
    let cursor = mainWidth - MARGIN;
    let pinnedWidth = MARGIN;
    const newPinned = pinned.map(card => {
      const nativeSize = card.template.getSize();
      const cardScale =  (breadCrumbHeight - 2 * MARGIN) / nativeSize.height;
      const cardW = nativeSize.width * cardScale;
      const cardH = nativeSize.height * cardScale;
      const spatial = {x: cursor - cardW, y: 0.5 * (breadCrumbHeight - cardH), scale: cardScale};
      cursor -= (cardW + MARGIN);
      pinnedWidth += (cardW + MARGIN);
      return {...card, spatial};
    });

    return {pinned: newPinned, pinnedWidth};
  }

  calcBreadCrumbChildren( breadCrumbs, breadCrumbHeight, mainWidth, pinnedWidth) {

    const newBreadCrumbs = [];

    let cursor = mainWidth - pinnedWidth;

    let scaleFactor = 1;
    let breadIdx = breadCrumbs.length - 1;
    while (cursor > 0 && breadIdx >= 0){
      const card = {...breadCrumbs[breadIdx]};
      const nativeSize = card.template.getSize();
      const cardScale =  (breadCrumbHeight - 2 * MARGIN) / nativeSize.height * scaleFactor;
      const cardW = nativeSize.width * cardScale;
      const cardH = nativeSize.height * cardScale;
      card.spatial = {x: cursor - cardW, y: 0.5 * (breadCrumbHeight - cardH), scale: cardScale};
      cursor -= (cardW + MARGIN * scaleFactor);
      newBreadCrumbs.unshift(card);
      if (cursor < 0.5 * mainWidth) {
        scaleFactor *= 0.86;
      }
      breadIdx--;
    }

    return newBreadCrumbs;
  }

  /**
   * calculate descriptor for a new breadcrumb card from a current focus card
   * @param sourceCard
   * @return breadCrumbCard
   */
  toBreadCrumbCard(sourceCard) {
    return {...sourceCard,
      clickMode: CLICK_OPAQUE,
      onClick: this.handleBreadCrumbClick,
      style: {zIndex: 0}
    };
  }

  breadCrumbToFocusCard(card) {
    return {
      ...card,
      onClick: this.handleNodeClick,
      clickMode: CLICK_TRANSPARENT,
      onMouseEnter: null,
      onMouseLeave: null,
      style: {zIndex: 1}
    }
  }

  toPinnedCard(sourceCard, key) {
    return {
      ...sourceCard,
      key: key || this.createChildKey(),
      clickMode: CLICK_OPAQUE,
      onClick: this.handleNodeClick,
      hover: false
    };
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
    if (DEBUG_MODE && GraphNode.isGraphNode(data)) {
      console.log(`----------------------------------------------------------`);
      console.log(`focus data is ${data.getSummary()}`);
      console.log(`\nTemplate is ${focusCard.template.id}`);
    }

    const { template } = focusCard;
    const { aggregate } = template;
    let nodeTypeUri = null;
    if (data && data.getTypeUri() === TYPE_AGGREGATOR ) {
      const subNodes = data.get(TYPE_NODES);
      if (subNodes && subNodes.length > 0) {
        nodeTypeUri = getCommonType(data).uri;
      }
    } else if (data){
      nodeTypeUri = data.getTypeUri();
    }
    const views = TemplateRegistry.getViewsFor(nodeTypeUri, aggregate, template).filter(view => view.selectable);
    const tools = aggregate ? TemplateRegistry.getToolsFor(nodeTypeUri) : [];
    const activeTools = {};
    const toolControls = [];
    tools.forEach(tool => {
      activeTools[tool.id] = tool.default ? tool : null;
      if (tool.default) {
        toolControls.push(createFilterControl(tool, data, this.setToolFilter, this.removeToolFilter));
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
    return { views, tools, activeTools, toolControls, currentFilters: [], focusData: data, nodeTypeUri,
      currentViewOptions,
      ...this.recalcLayout({ toolControls, windowWidth, windowHeight, focusCard })};
  }


  setFocusCard(focusCard, data) {
    this.transitionToState(this.createStateForFocus(focusCard, data));
  }


  setToolFilter(tool, selectedId, value) {

    const {currentFilters} = this.state;

    if (tool.type !== 'filter') {
      throw new Error(`Can't use filter for tool ${tool.id} of type ${tool.type}. Use tool of type filter instead.`);
    }
    const comparison = (GraphNode.isGraphNode(value)) ? COMPARISON_HAS_ASSOCIATED : COMPARISON_EQUAL;
    const newFilter = new Filter(tool.filter, comparison, value);

    const newFilters = {...currentFilters, [tool.id]: newFilter};
    this.updateFilteredState(newFilters, tool.id, selectedId, value);
  }


  removeToolFilter(toolId, selectedId) {
    const { currentFilters } = this.state;
    this.updateFilteredState(omit(currentFilters, toolId), toolId, selectedId);
  }


  updatedFocusCard(focusCard, focusData, filters) {
    if (focusData.getTypeUri() !== TYPE_AGGREGATOR) {
      throw new Error('UpdateFocusCard called for non-aggregate card');
    }
    const data = createPreprocessedCardNode(applyFilters(Object.values(filters), focusData.get(TYPE_NODES)),
        createContext(), focusCard.template, focusData.get(TYPE_NAME));
    return  {...focusCard, data};
  }


  updateFilteredState(newFilters, toolId, selectedId) {
    const { focusData, focusCard, activeTools, toolControls } = this.state;
    const { } = this.state;
    const tool = activeTools[toolId];
    const newFocusCard = this.updatedFocusCard(focusCard, focusData, newFilters);
    this.transitionToState({currentFilters: newFilters,
      toolControls: toolControls.map(control => (control.key !== toolId ? control : updatedToolControl(tool, control, selectedId, newFocusCard.data, this.setToolFilter, this.removeToolFilter))),
      focusCard: newFocusCard});
  }


  handleToolToggle(toolId) {
    const {tools, hoverCard, focusData, mainWidth} = this.state;
    let activeTools;
    let toolControls;
    let focusCard;
    let currentFilters;

    if (this.state.activeTools[toolId]) {
      activeTools = omit(this.state.activeTools, toolId);
      toolControls = this.state.toolControls.filter(control => control.key !== toolId);
      currentFilters = omit(this.state.currentFilters, toolId);
      focusCard = this.updatedFocusCard(this.state.focusCard, focusData, currentFilters);
    } else {
      focusCard = this.state.focusCard;
      currentFilters = this.state.currentFilters;
      const tool = tools.find(tool => tool.id === toolId);
      const allToolControls = [...this.state.toolControls, createFilterControl(tool, focusData, this.setToolFilter, this.removeToolFilter) ];
      toolControls = calcMaxChildren(mainWidth, allToolControls);
      activeTools = pick({...this.state.activeTools, [toolId]: tool}, toolControls.map(control => control.key));
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
    const {focusData, currentFilters, mainWidth, focusHeight, breadCrumbHeight} = this.state;
    const template = TemplateRegistry.getTemplate(viewId);

    if (template.aggregate && !focusData.get(TYPE_NODES)) {
      throw new Error(`Template ${template.id} is marked as aggregate, but applied to non-aggregate data ${focusData.getUniqueKey()}`);
    }

    const rawData = template.aggregate ?  applyFilters(Object.values(currentFilters),
        focusData.get(TYPE_NODES).map(node => (node.originalNode || node))): this.state.focusCard.data;
    const data = createPreprocessedCardNode(rawData, null, template, focusData.get(TYPE_NAME));

    const currentViewOptions = template.getDefaultOptions();

    const focusCard = this.createFocusCard(data, template, currentViewOptions);
    focusCard.spatial = this.calcFocusCardSpatial({focusCard, breadCrumbHeight, mainWidth, focusHeight});
    this.transitionToState({ focusCard, currentViewOptions: template.getDefaultOptions() });
  }

  handleOptionSelect(key, value) {
    const {currentViewOptions, focusCard} = this.state;
    const newViewOptions = {...currentViewOptions, [key]: value};

    this.setState({
      currentViewOptions: newViewOptions,
      focusCard: {...focusCard, options: newViewOptions}
    })
  }

  calcFocusCardSpatial({focusCard, mainWidth, breadCrumbHeight, focusHeight}) {
    const { width, height } = focusCard.template.getSize();
    return fit(mainWidth - 2 * MARGIN, focusHeight - MARGIN - TOOL_HEIGHT, width,
        height, MARGIN,  MARGIN + breadCrumbHeight, 2);
  }

  calcHoverCardSpatial({template, mainWidth, focusHeight, breadCrumbHeight}) {
    const { width, height } = template.getSize();
    return fit(mainWidth - 2 * MARGIN, focusHeight - 2 * MARGIN, width, height, MARGIN,MARGIN + breadCrumbHeight + 6,2);
  }

  handleSearchResultClick(node) {

    const {hoverCard} = this.state;
    if (hoverCard && hoverCard.data === node) {
      this.handleHoverCardToFocus();
      return;
    }

    const template = TemplateRegistry.getTemplateForSingleCard(node.getTypeUri(), DEFAULT_VIEW_NAME);
    const { mainWidth, focusHeight, breadCrumbHeight } = this.state;

    const spatial = this.calcHoverCardSpatial({template, mainWidth, focusHeight, breadCrumbHeight});
    const newHoverCard = Card_({key: this.createChildKey(), data:node, hover: true, template, spatial, clickMode: CLICK_OPAQUE,
      onClick: this.handleHoverCardToFocus,
      style: {zIndex: 2}})._Card

    this.setState({hoverCard: newHoverCard, allowInteractions: true});
  }

  recalcLayout({toolControls, windowWidth, windowHeight, focusCard, hoverCard}) {

    const breadCrumbHeight = BREADCRUMB_LANE_HEIGHT;

    // noinspection JSCheckFunctionSignatures
    const toolbarHeight = toolControls.reduce((result, control) => Math.max(result, (control.size.height || 0)), 0) + (toolControls.length === 0 ? 10 : 2 * MARGIN);
    const focusHeight = windowHeight - breadCrumbHeight - toolbarHeight;
    const mainHeight = windowHeight;
    const {mainWidth, sideBarWidth} = this.calcMainLayout(windowWidth, windowHeight);

    const layoutState = { breadCrumbWidth: mainWidth, breadCrumbHeight, toolbarHeight, focusHeight, mainWidth, mainHeight, sideBarWidth };

    if (hoverCard) {
      layoutState.hoverCard = {...hoverCard,
        spatial: this.calcHoverCardSpatial({template: hoverCard.template, mainWidth, focusHeight, breadCrumbHeight})}
    }

    if (focusCard) {
      layoutState.focusCard = {...focusCard,
        spatial: this.calcFocusCardSpatial({focusCard, mainWidth, breadCrumbHeight, focusHeight})
      };
    }

    return layoutState;
  }

  calcMainLayout(windowWidth, windowHeight) {
    const sideBarWidth = Math.min(Math.min(SIDEBAR_PERCENT * windowWidth, SIDEBAR_MAX), 4 * windowHeight);
    return {mainWidth: windowWidth - sideBarWidth, sideBarWidth};
  }

  onResize(width, height) {
      this.dom.style.width = `${width}px`;
      this.dom.style.height = `${height}px`;
      const { hoverCard, focusCard} = this.state;
      const windowWidth = width;
      const windowHeight = height;
      const {mainWidth} = this.calcMainLayout(width, height);
      const toolControls = calcMaxChildren(mainWidth, this.state.toolControls);
      const activeTools = pick(this.state.activeTools, toolControls.map(control => control.key));

      const newLayoutState = this.recalcLayout(
          {toolControls, windowWidth, windowHeight, hoverCard, focusCard});
      const { breadCrumbHeight } = newLayoutState;
      if (this.state.pinned) {
        const {pinned, pinnedWidth} = this.calcPinnedCardPositions(this.state.pinned, mainWidth, breadCrumbHeight);
        newLayoutState.pinned = pinned;
        newLayoutState.pinnedWidth = pinnedWidth;
        newLayoutState.breadCrumbCards = this.calcBreadCrumbChildren(this.state.breadCrumbCards, newLayoutState.breadCrumbHeight, newLayoutState.mainWidth, pinnedWidth);
      }

      this.setState({windowWidth, windowHeight, toolControls, activeTools, ...newLayoutState});
      this.renderStateChange();
  }

  createChildDescriptors(props) {

    const { dataLoaded, focusCard, nodeTypeUri, tools, activeTools, views, error, mainWidth, focusHeight,
      sideBarWidth, breadCrumbCards, pinned,
      hoverCard, breadCrumbHeight, toolbarHeight, windowHeight, toolControls, allowInteractions, currentViewOptions}
        = this.state;

    // const backgroundColor = (map && map.backColor) || '#ffffff';
    if (error) {
      return Div_({}, `An error occurred: ${error}`)._Div;
    }

    if (!dataLoaded) return this.loadingAnimation;

    const hoverChildren = [];
    if (hoverCard) {
      const menuRight = hoverCard.template.getSize().width * hoverCard.spatial.scale + hoverCard.spatial.x;
      hoverChildren.push(hoverCard);
      if (allowInteractions) {
        hoverChildren.push(hoverCardMenu(HOVER_MENU, hoverCard.spatial.y, menuRight, this.handleHoverCardClose,
            this.handleHoverCardPin));
      }
    } else if (focusCard && allowInteractions && !pinned.find(card => isDataEqual(card.data, focusCard.data))) {
      const menuRight = focusCard.template.getSize().width * focusCard.spatial.scale + focusCard.spatial.x;
      hoverChildren.push(focusCardMenu(`pin${focusCard.key}`, focusCard.spatial.y, menuRight, this.handleFocusCardPin));
    }

    const pinButtons = pinned.slice(1).map(card =>
        Div_({key: `${card.key}-pin`, className: getAppCss().pin,
          onClick: () => {this.removePin(card)},
          spatial: {x: card.spatial.x + card.spatial.scale * card.template.getSize().width - 20, y: card.spatial.y - 11, scale: 1}})._Div);


    const focusInfo = nodeTypeUri && `${TypeDictionary.getType(nodeTypeUri).name} ${focusCard.data.type.uri === TYPE_AGGREGATOR ? `(${focusCard.data.get(TYPE_NODE_COUNT)})` : ''}`;

    return [
      BreadcrumbLane_({
        key: BREADCRUMBS,
        spatial: {x: 0, y: 0, scale: 1},
        size:  {width: mainWidth, height: breadCrumbHeight},
        onClick: this.removeModals,
      })._BreadcrumbLane,
      ...breadCrumbCards,
      ...pinned,
      ...pinButtons,
      ToolPanel_({
        key: 'tools',
        size: { width: mainWidth, height: toolbarHeight},
        spatial: {x: 0, y: focusHeight + breadCrumbHeight, scale: 1},
        children: toolControls
      })._ToolPanel,
      Div_({
        key: FOCUS,
        className: getAppCss().focus,
        spatial: {x: 0, y: breadCrumbHeight, scale: 1},
        size: {width: mainWidth, height: focusHeight},
        onClick: this.removeModals
      })._Div,
      focusCard,
      ...hoverChildren,
      Sidebar_({key: SIDEBAR,
        size: {width: sideBarWidth, height: windowHeight},
        menuTop: breadCrumbHeight,
        logoUrl: getConfig('logoUrl'),
        logoLink: getConfig('logoLink'),
        focusInfo,
        spatial: {x: mainWidth, y: 0, scale: 1},
        views: views.map(view => ({id: view.id, name: view.name || view.id, selected: view.id === focusCard.template.id})),
        tools: tools && tools.map(tool => ({id: tool.id, name: tool.name, selected: !!activeTools[tool.id]})),
        options: get(focusCard, ['template', 'descriptor', 'options']) || {},
        currentViewOptions,
        onOptionSelect: this.handleOptionSelect,
        onToolToggle: this.handleToolToggle,
        onViewClick: this.handleViewSelect,
        onSearchResultClick: this.handleSearchResultClick
      })._Sidebar
    ];
  }
}

ComponentFactory.registerType(App);

export const App_ = (props, children) => ({_App: {type: APP, children, ...props}});
