import React, { Component } from 'react';
import Input from './Input';
import Output from './Output';


export default class Editor extends Component {
    render() {
        return (
            <div className="">
                <div className="left">
                    <Input />
                </div>
                <div className="right">
                    <Output />
                </div>
            </div>
        )
    }
}

// export default connect(mapStateToProps, mapDispatchToProps)(Editor);