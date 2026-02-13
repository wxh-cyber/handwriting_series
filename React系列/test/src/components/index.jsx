import React, { Component } from 'react'
import { componentClassMixins, mixin_1 } from '../mixins/mixin_1';

class index extends Component {
  constructor(){
    super();
    this.state = {
        name: 'John',
    }
  }

  render() {
    return (
      <div>
         <h4>Hello, world!</h4>
         <button onClick={this.say.bind(this)}>Say</button>
         {/* 输出：mixin_1 say: John */}
      </div>
    )
  }
}

componentClassMixins(index, mixin_1);
export default index;
