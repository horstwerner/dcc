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
import {MARGIN, SIDEBAR_MAX, SIDEBAR_PERCENT} from "@/Config";
import {fit, relSpatial} from "@symb/util";
import {createPreprocessedCardNode, hoverCardMenu} from "@/components/Generators";
import {BreadcrumbLane_} from "@/components/BreadcrumbLane";
import {ToolPanel_} from "@/components/ToolPanel";
import Filter, {applyFilters, COMPARISON_EQUAL, COMPARISON_HAS_ASSOCIATED} from "@/graph/Filter";
import {RadioButtons_} from "@/components/RadioButtons";
import Trellis from "@/generators/Trellis";
import {CLICK_DISABLED, CLICK_NORMAL, CLICK_OPAQUE, CLICK_TRANSPARENT} from "@/components/Constants";
import {getCardDescriptorsFromDb, getDataFromDb, getDictionaryFromDb, getToolDescriptorsFromDb} from "@/Data";

const APP = 'app';
const BREADCRUMBS = 'breadcrumbs';
const SIDEBAR = 'sidebar';
const FOCUS = 'focus';
const HOVER_MENU = 'hover-menu';
const TOOL_HEIGHT = 10;
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

    getDictionaryFromDb(this.onError)
        .then(() => Promise.all([...Cache.getEntityTypes().map(type => getDataFromDb(type, this.onError)),
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
            this.setFocusCard(this.createFocusCard(startData, TemplateRegistry.getTemplate('root'), []));
          }
        });
    this.handleNodeClick = this.handleNodeClick.bind(this);
    this.handleHoverCardStash = this.handleHoverCardStash.bind(this);
    this.handleHoverCardPin = this.handleHoverCardPin.bind(this);
    this.handleHoverCardClose = this.handleHoverCardClose.bind(this);
    this.handleToolToggle = this.handleToolToggle.bind(this);
    this.handleViewSelect = this.handleViewSelect.bind(this);
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

    const clone = Card_({key: this.createChildKey(), data, hover: true, template, spatial, clickMode: CLICK_DISABLED, style: {zIndex: 2}})._Card
    this.setState({hoverCard: clone, allowInteractions: false});

    const newSpatial = this.calcHoverCardSpatial({hoverCard: clone, mainWidth, focusHeight, breadCrumbHeight});
    this.transitionToState({hoverCard:{...clone, spatial: newSpatial}}).onEndCall(() => {
          this.setState({allowInteractions: true});
        }
    );
  }


  moveCardToFocus(newFocusCard, data) {
    const { focusCard } = this.state;
    this.moveCardToBreadcrumbs(focusCard, this.createStateForFocusCard(newFocusCard, data));
  }


  moveCardToBreadcrumbs(card, targetState) {
    const { breadCrumbCards, breadCrumbHeight } = this.state;
    const focusPlane = this.getFocusPlane();

    // old card will be transformed into breadcrumb card. For the time of transition, it is the hoverCard
    const newBreadcrumbInstance = focusPlane.childByKey[card.key];
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
      const newState = { allowInteractions: true, hoverCard: null,
        focusCard: {...(targetState.focusCard || this.state.focusCard), style: {zIndex: 0}}};
      if (adoptCard) {
        this.getBreadcrumbLane().adoptChild(newBreadcrumbInstance);
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


  createFocusCard(data, template) {
    const key = this.createChildKey();

    return Card_({
      key,
      data,
      template,
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

  createStateForFocusCard(focusCard, data) {
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
    const {windowWidth, windowHeight} = this.state;
    return { views, tools, activeTools, toolControls, filters: {}, focusData: data,
      ...this.recalcLayout({toolControls, windowWidth, windowHeight, focusCard})};
  }


  setFocusCard(focusCard) {
    this.transitionToState(this.createStateForFocusCard(focusCard, null));
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
    const {tools, hoverCard, focusCard} = this.state;
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
    const {windowWidth, windowHeight} = this.state;
    this.transitionToState({ activeTools,
      toolControls,
      ...this.recalcLayout({toolControls, windowWidth, windowHeight, hoverCard, focusCard})});
  }


  handleViewSelect(viewId) {
    const {focusData, currentFilters, mainWidth, focusHeight} = this.state;
    const template = TemplateRegistry.getTemplate(viewId);

    const data = template.aggregate ?  createPreprocessedCardNode(applyFilters(Object.values(currentFilters),
        focusData[TYPE_NODES].map(node => (node.originalNode || node))), {}, template): this.state.focusCard.data;

    const focusCard = this.createFocusCard(data, template, currentFilters);
    focusCard.spatial = this.calcFocusCardSpatial({focusCard, mainWidth, focusHeight});
    this.setState({ focusCard });
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
    const toolbarHeight = toolControlList.reduce((result, control) => result + (control.height || 50), 0)
        + 20 * (toolControlList.length + 1);
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


  createChildDescriptors(props) {

    const {focusCard, tools, activeTools, views, error, mainWidth, focusHeight, sideBarWidth, breadCrumbCards, nextChildPos,
       hoverCard, breadCrumbHeight, toolbarHeight, windowHeight, toolControls, allowInteractions} = this.state;

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
            this.handleHoverCardPin, this.handleHoverCardStash))
      }
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
        onToolToggle: this.handleToolToggle,
        onViewClick: this.handleViewSelect,
      })._Sidebar
    ];
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
};

ComponentFactory.registerType(App);

export const App_ = (props, children) => ({_App: {type: APP, children, ...props}});
