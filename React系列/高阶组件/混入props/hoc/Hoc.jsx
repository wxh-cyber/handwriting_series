import React from 'react';

function HOC(Component){   //直接继承需要包装的组件
    return class WrapComponent extends React.Component {
        state={
            name:'Alien'
        };

        componentDidMount(){
            console.log('HOC componentDidMount');
        }

        render(){
            return (
                <Component {...this.props} {...this.state} />
            )
        }
    }
}

export default HOC;