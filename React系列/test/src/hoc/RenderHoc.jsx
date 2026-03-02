import React, { useState, useEffect } from "react";
import { SyncOutlined } from "@ant-design/icons";

const renderQueue = []; //渲染队列
let isFirstRender = false; //是否第一次渲染

const tryRender = () => {
  const render = renderQueue.shift();

  if (!render) return;
  setTimeout(() => {
    render(); //执行下一段渲染
  }, 3000);
};

function renderHOC(WrapComponent) {
  return function Index(props) {
    const [isRender, setIsRender] = useState(false);
    useEffect(() => {
      renderQueue.push(() => {
        //放入待渲染队列中
        setIsRender(true);
      });

      if (!isFirstRender) {
        //如果不是第一次渲染，直接执行下一段渲染
        tryRender();
        isFirstRender = true;
      }
    }, []);

    return isRender ? (
      <WrapComponent {...props} tryRender={tryRender} />
    ) : (
      <div>
        <SyncOutlined />
      </div>
    );
  };
}

export default renderHOC;
