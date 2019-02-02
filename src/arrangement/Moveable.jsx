import React, {Component} from 'react';
import P from 'prop-types';
import css from './Moveable.module.css';

export class Moveable extends Component {

  static propTypes = {
    width: P.number.isRequired,
    height: P.number.isRequired,
    xAnchor: P.number,
    yAnchor: P.number,
    children: P.node.isRequired
  };

  constructor() {
    super();
    this.state = {x: 0, y: 0, scale: 1, alpha: 1};
  }

  updateTransform(x, y, scale) {
    this.setState({x, y, scale});
  }

  updateAlpha(alpha) {
    this.setState({alpha});
  }

  getPos() {
    const {x, y, scale} = this.state;
    return {x, y, scale};
  }

  getSize() {
    const {width, height} = this.props;
    return {width, height};
  }

  getAspectRatio() {
    return this.props.width / this.props.height;
  }

  getAlpha() {
    return this.state.alpha;
  }

  hasPosition() {
    return true;
  }

  /**
   * @param {number} x - center x coordinate
   * @param {number} y - center y coordinate
   * @param scale
   * @return {{x: *, y: *}} position for this moveable so that the center is at the specified position
   */
  getPos2Center(x, y, scale) {

    const {xAnchor, yAnchor, width, height} = this.props;

    return {
      x: x + ((xAnchor || 0) - 0.5) * scale * width,
      y: y + ((yAnchor || 0) - 0.5) * scale * height
    }
  };

  /**
   * @param {number} x - center x coordinate
   * @param {number} y - center y coordinate
   * @param scale
   * @return {{x: *, y: *}} position for this moveable so that the top left corner is at the specified position
   */
  getPos2TopLeft(x, y, scale) {
    const {xAnchor, yAnchor, width, height} = this.props;
    return {
      x: x + (xAnchor || 0) * scale * (width || 0),
      y: y + (yAnchor || 0) * scale * (height || 0)
    }
  };

  render() {
    const {children} = this.props;
    const {x, y, scale, alpha} = this.state;

    return (
        <div className={css.moveable}
             style={{transform: `translate(${x}px, ${y}px) scale(${scale})`, opacity: {alpha}}}>
          {children}
        </div>
    );
  }
}