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
    this.state = {};
  }

  updateTransform(x, y, scale) {

    if (!this.hasPosition()) {
      this.setState({hasPosition: true, x, y, scale});
    } else {
      Object.assign(this.state, {x, y, scale});
      this.div.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }
  }

  updateAlpha(alpha) {
    this.setState({alpha});
  }

  getPos() {
    const {initialX, initialY, initialScale} = this.props;
    const {x, y, scale} = {x: initialX, y: initialY, scale: initialScale, ...this.state};
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
    return this.state.hasPosition;
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
    console.log(`${x},${y},${scale} -> `);
    return {
      x: x + (xAnchor || 0) * scale * (width || 0),
      y: y + (yAnchor || 0) * scale * (height || 0)
    }
  };

  render() {
    const {children, xAnchor, yAnchor, width, height, initialX, initialY, initialScale} = this.props;

    const {x, y, scale, alpha} = this.state;

    return (
        <div className={css.moveable} ref={(div) => {
          this.div = div;
        }}
             style={{
               width, height,
               transformOrigin: `${xAnchor * 100}% ${yAnchor * 100}%`,
               transform: `translate(${x || initialX }px, ${y || initialY}px) scale(${scale || initialScale})`,
               opacity: {alpha}
             }}>
          {children}
        </div>
    );
  }
}