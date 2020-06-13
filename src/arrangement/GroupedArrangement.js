import {sliceBy} from "@/graph/Grouping";

export default class GroupedArrangement extends Arrangement {
  constructor(groupBy, padding, childSize) {
    super(padding, childSize);
    this.groupBy = groupBy;
  }

  /**
   *
   * @param {Array<GraphNode>} elements
   * @param {function} callback
   */
  forEachRasterpos = function (elements, callback) {

    if (!elements || elements.length === 0) return;

    const slices = sliceBy(elements, this.groupBy);

    const childaspectratio = this.childAspectRatio

    //FIXME: implement
  };

}