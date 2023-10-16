import P from 'prop-types';
import Component from "@symb/Component";
import ComponentFactory from '@symb/ComponentFactory';
import css from './ResultGroup.css';
import {Div_} from "@symb/Div";
import Type from "@/graph/Type";
import GraphNode from "@/graph/GraphNode";

export const RESULT_GROUP = 'result-group';

class ResultGroup extends Component {

  static type = RESULT_GROUP;
  static className = css.group;

  static propTypes = {
    nodeType: P.instanceOf(Type),
    results: P.arrayOf(P.instanceOf(GraphNode))
  };

  createChildDescriptors(props) {
    const {nodeType, results, onSearchResultClick, firstTabIndex} = props;
    let tabIndex = firstTabIndex;
    return [
        Div_({key: 'header', className: css.header}, `${nodeType.getName()} (${results.length})`)._Div,
        Div_({key: 'results', className: css.list}, results.map(node =>
            Div_({key: node.getUniqueKey(), className: css.listItem,
                  tabIndex: tabIndex++,
                  onClick: () => onSearchResultClick(node),
                  onKeyUp: (event) => {if (event.key === 'Enter') onSearchResultClick(node)}},
                node.getDisplayName()
            )._Div))._Div,
    ];
  }
}

ComponentFactory.registerType(ResultGroup);

export const ResultGroup_ = (props) => ({_ResultGroup: {type: RESULT_GROUP, ...props}});
