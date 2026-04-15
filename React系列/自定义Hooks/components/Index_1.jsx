import React from 'react'
import useToggle from '../hooks/useToggle';

function Index_1() {
    const {state:isVisible,toggle}=useToggle(false);

    return (
      <div>
        <button onClick={toggle}>{isVisible?'关闭弹窗':'打开弹窗'}</button>
        {isVisible&&<div className="modal">我是弹窗内容</div>}
      </div>
    )
}

export default Index_1;
