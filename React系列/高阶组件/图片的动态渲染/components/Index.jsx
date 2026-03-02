import React, { Component } from "react";
import renderHOC from "../hoc/RenderHoc";
import backgroundImage from "../images/背景图.jpg";

class Index extends Component {
  render() {
    const { setVisible } = this.props;

    return (
      <div className="box">
        <p>Hello,my name is Alien</p>
        <img src={backgroundImage} alt="图片已加载！" />
        <button onClick={() => setVisible()}>卸载当前组件</button>
      </div>
    );
  }
}

export default renderHOC(Index);
