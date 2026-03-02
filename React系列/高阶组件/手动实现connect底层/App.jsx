import React from 'react'
import store from './redux/index.js'
import {Provider} from './context/ReduxContext.jsx';
import Child from './components/Child.jsx';


export default function App() {
  return (
    <Provider store={store}>
      {/* 注意：由于在context中定义provider时，参数设定为store和children，所以这里不同于默认的value，为store */}
        <Child />
    </Provider>
  )
}
