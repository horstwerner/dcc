import P from 'prop-types';
import css from './Sidebar.css';
import hoverMenuCss from './HoverCardMenu.css';
import Cache from '@/graph/Cache';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import {getConfig, HIGHLIGHT_LIST_WIDTH, MARGIN, MENU_WIDTH} from "@/Config";
import {calcPanelHeight, MenuPanel_} from "@/components/MenuPanel";
import {Div_} from "@symb/Div";
import {Image_} from "@symb/Image";
import {createOptionControls} from "@/Tools";
import {SuggestList_} from "@/components/SuggestList";
import {Menu_} from "@/components/Menu";
import {Link_} from "@/components/Link";
import {ValueRangeList_} from "@/components/ValueRangeList";

const SIDEBAR = 'sidebar';
const MENU_PANEL = 'menu-panel';
const TOOL_PANEL = 'tool-panel';
const LOGO_BOX = 'logo-box';
const LOGO = 'logo';
const SEARCH_FIELD = 'searchField';
const SEARCH_INPUT = 'searchInput';
const LOGO_SIZE = 40;

const logo = function (logoUrl, logoLink) {
  const image = Image_({key: LOGO, source: logoUrl, size:{height: LOGO_SIZE}})._Image;
  return logoLink ? Link_({url: logoLink, className: css.logoLink}, image)._Link: image;
}

class Sidebar extends Component {

  static type = SIDEBAR;
  static className = css.sideBar;

  static propTypes = {
    size: P.shape({width: P.number.isRequired, height: P.number.isRequired}),
    menuTop: P.number.isRequired,
    views: P.array,
    tools: P.array,
    shareRef: P.string,
    onSearch: P.func,
    onViewClick: P.func,
    onToolToggle: P.func,
  };

  constructor(props, parent, domNode) {
    super(props, parent, domNode);
    this.handleSearchKeyUp = this.handleSearchKeyUp.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.state = {currentSearchResults: null};
    this.dom.onclick = (e) => {
      const key = e.target.getAttribute('data-key');
      if (e.target === this.dom || key === MENU_PANEL || key === LOGO_BOX || key === LOGO) {
      this.clearSearch();
    }};
  }

  handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
      return false;
    }
  }

  handleSearchKeyUp(event) {
    const key = event.key;
    const text = event.target.innerText;
    if (key === 'Escape') {
      this.clearSearch();
    } else if (key === 'Enter' || text.length > 2) {
      this.updateSuggestList(text);
    }
    event.stopPropagation();
    return false;
  }

  handleSearch() {
    this.updateSuggestList(this.getChild(SEARCH_FIELD).getChild(SEARCH_INPUT).dom.innerText);
  }

  updateSuggestList(searchString) {
    this.setState({currentSearchResults: Cache.search(searchString)})
  }

  focusSearchBox() {
    this.getChild(SEARCH_FIELD).getChild(SEARCH_INPUT).dom.focus();
  }

  clearSearch() {
    const dom = this.getChild(SEARCH_FIELD).getChild(SEARCH_INPUT).dom;
    dom.innerText = '';
    dom.blur();
    this.setState({currentSearchResults: null})
  }

  createChildDescriptors(props) {

    const { menuTop, size, views, tools, onViewClick, onToolToggle, options, currentViewOptions, onOptionSelect,
      onSearchResultClick, focusInfo, logoUrl, logoLink, shareRef, highlightMenu, onHighlightSelect, onHighlightClose} = props;
    const { currentSearchResults } = this.state;
    const optionsWidth = MENU_WIDTH - 16;

    const optionMenus = createOptionControls(options, onOptionSelect, currentViewOptions, optionsWidth);
    const searchY = 104 - MARGIN - 28;

    const viewMenu = Menu_({key: "views", title: 'Views',  entries: views, onEntryClick: onViewClick})._Menu;
    const toolMenu = (tools.length > 0 && Menu_({key: "tools", color: 'gray', title: 'Filters',  entries: tools, onEntryClick: onToolToggle})._Menu);
    const focusHeader = focusInfo && (Div_({className: css.focusHeader},
        [Div_({}, focusInfo)._Div,
        Link_({className: css.shareLink, url: shareRef}, Image_({key: 'shareButton', source: 'public/ShareButton.svg', title: 'Share', className: hoverMenuCss.icon, width: 22, height: 22})._Image)._Link]
    )._Div);


    let highlightMenuControl;
    if (highlightMenu) {
      const {by, selectedId, nodes} = highlightMenu;
      const highlightSize = {width: HIGHLIGHT_LIST_WIDTH, height: 260};
      const spatial = {x: - HIGHLIGHT_LIST_WIDTH - 4, y: searchY + 48, scale: 1}

      highlightMenuControl = highlightMenu && ValueRangeList_({nodes, dimension: by, onClick: onHighlightSelect, onClose: onHighlightClose, selectedId, listW: MENU_WIDTH, size: highlightSize, spatial})._ValueRangeList;
    }

    return[
      Div_({key: LOGO_BOX, className: css.logoBox, spatial: {x: 0, y: MARGIN, scale: 1}, style: {justifyContent: getConfig('logoAlign')}},
            logo(logoUrl, logoLink))._Div,
      Div_({key: SEARCH_FIELD, className: css.searchField, spatial: {x: 16, y: searchY, scale: 1},
        children: [
            Div_({key: SEARCH_INPUT, className: css.searchInput, tabIndex : 1, contentEditable: true, onKeyUp: this.handleSearchKeyUp, onKeyDown: this.handleSearchKeyDown})._Div,
            ]})._Div,
      Image_({key: 'searchButton', spatial: {x: 16+182, y: searchY, scale: 1}, className:css.searchButton, source:`public/SearchButton.svg`, onClick: this.handleSearch})._Image,
      MenuPanel_({
        key: MENU_PANEL,
        size: { width:  MENU_WIDTH },
        children:[focusHeader, viewMenu, ...optionMenus],
        spatial: {x: 0, y: menuTop, scale: 1}
      })._MenuPanel,
      MenuPanel_({
        key: TOOL_PANEL,
        size: { width:  MENU_WIDTH },
        color: 'gray',
        children:[toolMenu],
        spatial: {x: 0, y: size.height - calcPanelHeight(tools) - 4, scale: 1}
      })._MenuPanel,
      highlightMenuControl,
      (currentSearchResults && SuggestList_({key: 'suggestList', size: {width: MENU_WIDTH - 16},
        spatial: {x: 9, y: searchY + 40, scale: 1}, onSearchResultClick, resultGroups: currentSearchResults})._SuggestList)
    ];
  }

}

ComponentFactory.registerType(Sidebar);
export const Sidebar_ = (props) => ({_Sidebar: {type: SIDEBAR, ...props}});
