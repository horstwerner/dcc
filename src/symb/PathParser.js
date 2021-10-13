import {getConfig, PATH_SEPARATOR} from "@/Config";

const whiteSpace = ' \t\n';

export default class PathParser {

  constructor(str) {
    this.str = str;
    this.idx = 0;
    this.separator = getConfig(PATH_SEPARATOR);
  }

  skipWhitespace() {
    while(this.idx < this.str.length && whiteSpace.includes(this.str.charAt(this.idx))) {
      this.idx++;
    }
  }

  skipSeparator() {
    let pos = this.str.indexOf(this.separator, this.idx);
    if (pos === -1) {
      pos = this.str.length;
    }
    const rest = this.str.substring(this.idx, pos);
    this.idx = pos + this.separator.length;
    return rest;
  }

  getNextSegment() {
     this.skipWhitespace();
     if (this.idx === this.str.length) return null;
    let edgeType;
    let multiStep;
    let recursive = false;

    if (this.str.charAt(this.idx) === '(') {
       const closingIdx = this.str.indexOf(')', this.idx + 1);
       if (closingIdx === -1) {
         throw new Error(`Error parsing path "${this.str}": no closing bracket after pos ${this.idx} found.`);
       }
       edgeType = this.str.substring(this.idx + 1, closingIdx);
       if (edgeType.includes('*')) {
         throw new Error(`Error parsing path ${this.str}: Recursion only allowed after path bracket`);
       }
       multiStep = true;
       this.idx = closingIdx + 1;
       if (this.str.charAt(this.idx) === '*') {
         recursive = true;
         this.idx++;
       }
       this.skipWhitespace();
       const rest = this.skipSeparator();
       if (rest) {
         throw new Error(`Error parsing path ${this.str} Unexpected rest between closing bracket and separator: ${rest}`);
       }
     } else {
       const sepIdx = this.str.indexOf(this.separator, this.idx);
       const path = this.str.substring(this.idx, sepIdx === -1 ? this.str.length : sepIdx);
       const lastPos = path.length - 1;
       if ( path.charAt(lastPos) === '*' ) {
         edgeType = path.substring(0, lastPos);
         recursive = true;
       } else {
         edgeType = path;
       }
       this.idx = (sepIdx === -1 ? this.str.length : sepIdx + this.separator.length);
       multiStep = false;
    }
      return {edgeType, multiStep, recursive};
  }

  getSegments() {
    const result = [];
    this.skipWhitespace();
    while (this.idx < this.str.length) {
      const segment = this.getNextSegment();
      if (segment) {
        result.push(segment)
      }
    }
    return result;
  }


}