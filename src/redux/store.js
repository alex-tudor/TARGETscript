import { combineReducers, createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";

import editorReducer from "./reducers/editor";
const rootReducer = combineReducers({
    editor: editorReducer
})

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;