import React from 'react';

function HOC(Component){   //直接继承需要包装的组件
    return class WrapComponent extends React.Component {
        constructor(){
            super();
            this.state={
                name:'Alien'
            }
        }

        changeName(name){
            this.setState({name});
        }

        render(){
            return (
                <Component {...this.props} {...this.state} changeName={this.changeName.bind(this)} />
            )
        }
    }
}

export default HOC;