import React from 'react';

// external
import { Switch, Route } from 'react-router-dom';

// pages
import Home from './pages/Home';
import Docs from './pages/Docs';
import Error404 from './pages/Error404';

// css
import './App.css';

class App extends React.Component {
    render() {
        return (
            <div className="App">
                <Switch>
                    <Route
                        exact path="/"
                        component={Home}
                    />
                    <Route
                        path="/docs"
                        component={Docs}
                    />
                    <Route
                        path="*"
                        component={Error404}
                    />
                </Switch>
            </div>
        );
    }
}

export default App;