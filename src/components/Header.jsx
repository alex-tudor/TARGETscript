import React, { Component } from 'react';
import { Link } from 'react-router-dom';

import Home from '../pages/Home';
import Docs from '../pages/Docs';

export default class Header extends Component {
    render() {
        return (
            <div>
                Header Component
                <Link to={Home}> home </Link>
                <Link to={Docs}> docs </Link>
            </div>
        )
    }
}