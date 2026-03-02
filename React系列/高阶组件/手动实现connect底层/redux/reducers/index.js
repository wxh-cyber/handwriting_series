//定义初始状态
const initialState = {
    count:0,
    user:'Guest'
}

// 定义 Reducer
// 作用：根据 Action 修改 State
function rootReducer(state=initialState,action){
    switch(action.type){
        case 'ADD':
            return {
                ...state,
                count:state.count+1
            };
        case 'SUB':
            return {
                ...state,
                count:state.count-1
            };
        case 'CHANGE_USER':
            return {
                ...state,
                user:action.payload
            }
        default:
            return state;
    }
}

export default rootReducer;