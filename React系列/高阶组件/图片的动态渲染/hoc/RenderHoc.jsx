import React, { Component } from "react";
import { SyncOutlined } from "@ant-design/icons";

function renderHOC(WrapComponent) {
  return class Index extends Component {
    constructor(props) {
      super(props);
      this.state = {
        visible: true,
      };
    }

    setVisible() {
      this.setState({
        visible: !this.state.visible,
      });
    }

    render() {
      const { visible } = this.state;
      return (
        <div className="box">
          <button onClick={this.setVisible.bind(this)}>挂载组件</button>
          {visible ? (
            <WrapComponent
              {...this.props}
              setVisible={this.setVisible.bind(this)}
            />
          ) : (
            <div>
              <SyncOutlined />
            </div>
          )}
        </div>
      );
    }
  };
}

export default renderHOC;
