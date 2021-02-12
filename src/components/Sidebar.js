import P from 'prop-types';
import css from './Sidebar.css';
import Cache from '@/graph/Cache';
import Component from "@symb/Component";
import ComponentFactory from "@symb/ComponentFactory";
import {MARGIN, MENU_WIDTH} from "@/Config";
import {MenuPanel_} from "@/components/MenuPanel";
import {Div_} from "@symb/Div";
import {Image_} from "@symb/Image";
import {createOptionControls} from "@/Tools";
import {SuggestList_} from "@/components/SuggestList";

const SIDEBAR = 'sidebar';
const SEARCH_FIELD = 'searchField';
const SEARCH_INPUT = 'searchInput';
const PANEL_HEIGHT = 300;

class Sidebar extends Component {

  static type = SIDEBAR;
  static className = css.sideBar;

  static propTypes = {
    size: P.shape({width: P.number.isRequired, height: P.number.isRequired}),
    menuTop: P.number.isRequired,
    views: P.array,
    tools: P.array,
    onSearch: P.func,
    onViewClick: P.func,
    onToolToggle: P.func,
  };

  constructor(props, parent, domNode) {
    super(props, parent, domNode);
    this.handleSearchKeyUp = this.handleSearchKeyUp.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.state = {currentSearchResults: null};
  }

  handleSearchKeyDown(event) {
    if (event.key === 'Enter') {
      return false;
    }
  }

  handleSearchKeyUp(event) {
    const key = event.key;
    const text = event.target.innerText;
    console.log(key)
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

    const { menuTop, views, tools, onViewClick, onToolToggle, options, currentViewOptions, onOptionSelect, onSearchResultClick} = props;
    const { currentSearchResults } = this.state;
    const optionsWidth = MENU_WIDTH - 16;

    const optionControls = createOptionControls(options, onOptionSelect, currentViewOptions, optionsWidth, 9, menuTop + PANEL_HEIGHT + 16);

    return[
      Div_({key: SEARCH_FIELD, className: css.searchField, spatial: {x: 20, y: MARGIN, scale: 1},
        children: [
            Div_({key: SEARCH_INPUT, className: css.searchInput, tabIndex : 1, contentEditable: true, onKeyUp: this.handleSearchKeyUp, onKeyDown: this.handleSearchKeyDown})._Div,
            Image_({key: 'searchButton', className:css.searchButton, source:`public/SearchButton.svg`, onClick: this.handleSearch})._Image]})._Div,
      MenuPanel_({
        size: { width:  MENU_WIDTH, height: PANEL_HEIGHT },
        views,
        tools,
        onViewClick,
        onToolToggle,
        spatial: {x: 0, y: menuTop, scale: 1}
      })._MenuPanel,
        ...optionControls,
      (currentSearchResults && SuggestList_({key: 'suggestList', size: {width: MENU_WIDTH}, spatial: {x: 9, y: 80, scale: 1}, onSearchResultClick, resultGroups: currentSearchResults})._SuggestList)
    ];
  }

}

ComponentFactory.registerType(Sidebar);
export const Sidebar_ = (props) => ({_Sidebar: {type: SIDEBAR, ...props}});
