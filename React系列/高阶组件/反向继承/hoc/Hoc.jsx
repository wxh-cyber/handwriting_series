import React from 'react';

function HOC(Component){   //直接继承需要包装的组件
    return class WrapComponent extends Component {
        
    }
}

export default HOC;