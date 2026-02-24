import React from 'react';

class Index extends React.Component {

    render(){
        return (
            <div>
                Hello World!
            </div>
        )
    }
}

Index.say=function(){
    console.log('My name is Alien');
}

export default Index;