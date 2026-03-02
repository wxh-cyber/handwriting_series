import React, { Component } from "react";
import renderHOC from "../hoc/RenderHoc";
import backgroundImage from "../images/背景图.jpg";

class Index extends Component {
  componentDidMount() {
    const { name, tryRender } = this.props;
    //上一部分渲染完毕，进行下一部分渲染
    tryRender();
    console.log(name + "组件已渲染！");
  }

  render() {
    return (
      <div className="box">
        <img src={backgroundImage} alt="图片已加载！" />
      </div>
    );
  }
}

export default renderHOC(Index);
