import createStore from './store';
import rootReducer from './reducers';

const store=createStore(rootReducer);
export default store;