import React, { Component } from 'react';
import { connect } from 'react-redux';
import { process } from '../redux/actions/editor';
class Input extends Component {
    constructor() {
        super();
        this.state = {};
        this.timeout = null;
        this.TIMEOUT_DELAY = 1000; // in miliseconds
    }
    render() {
        return (
            <textarea onKeyUp={ eventDetails => this.handleKeyUp(eventDetails) }>
                
            </textarea>
        )
    }

    handleKeyUp({ target: { value } } = {}) {
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => this.props.handleProcessingWithDispatch(value), this.TIMEOUT_DELAY);
    }

    componentWillUnmount() {
        clearTimeout(this.timeout);
    }
}

function mapDispatchToProps(dispatch) {
    return {
        handleProcessingWithDispatch: code => {
            dispatch(process(code));
        }
    }
}

export default connect(null, mapDispatchToProps)(Input);