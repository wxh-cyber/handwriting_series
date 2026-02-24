import React from 'react';
import HOC from '../hoc/Hoc.jsx';

class Index extends React.Component {
    say(){
        const {name}=this.props;
        console.log(name);
    }

    render(){
        return (
            <div>
                Hello World!
                <button onClick={this.say.bind(this)}>点击</button>
            </div>
        )
    }
}

export default HOC(Index);