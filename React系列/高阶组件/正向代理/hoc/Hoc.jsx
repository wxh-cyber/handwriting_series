import React from 'react';

function HOC(Component){
    return class WrapComponent extends React.Component {
        render=()=><Component {...this.props} {...this.state} />
    }
}

export default HOC;