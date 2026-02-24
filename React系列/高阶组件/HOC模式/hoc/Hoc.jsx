import React from 'react';

function HOC(Component){
    return class WrapComponent extends React.Component {
        constructor(){
            super();
            this.state={
                name:'Alien'
            }
        }

        render=()=><Component {...this.props} {...this.state} />
    }
}

export default HOC;