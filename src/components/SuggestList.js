import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from '@symb/ComponentFactory';
import css from './SuggestList.css';
import {Div_} from "@symb/Div";
import Type from "@/graph/Type";
import GraphNode from "@/graph/GraphNode";
import {ResultGroup_} from "@/components/ResultGroup";

export const SUGGEST_LIST = 'suggest-list';

class Button extends Component {

  static type = SUGGEST_LIST;
  static className = css.suggestList;

  static propTypes = {
    resultGroups: P.arrayOf(P.shape({nodeType: P.instanceOf(Type), results: P.arrayOf(P.instanceOf(GraphNode))}))
  };

  createChildDescriptors(props) {
    const {resultGroups, onSearchResultClick} = props;
    if (resultGroups.length === 0) {
      return Div_({key: 'empty', className: css.emptyLabel}, 'No Matches')._Div;
    }

    let tabIndex = 2;
    return resultGroups.map(group => {
      const firstTabIndex = tabIndex;
      tabIndex += group.results.length;
      return ResultGroup_({key: group.nodeType.getName(), firstTabIndex, onSearchResultClick,...group})._ResultGroup
    });
  }
}

ComponentFactory.registerType( Button);

export const SuggestList_ = (props) => ({_SuggestList: {type: SUGGEST_LIST, ...props}});
