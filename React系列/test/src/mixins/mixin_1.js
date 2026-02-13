const mixin_1 = {
    componentDidMount() {
        console.log('mixin_1 componentDidMount');
    },

    say(){
        console.log('mixin_1 say:',this.state.name);
    }
};

function componentClassMixins(Component,mixins){
    for(let key in mixins){
        if(mixins.hasOwnProperty(key)){
            Component.prototype[key] = mixins[key];
        }
    }
};

export { componentClassMixins, mixin_1 };
