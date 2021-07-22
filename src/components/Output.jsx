import React, { Component } from 'react'
import { connect } from 'react-redux'
class Output extends Component {
    render() {
        const { output } = this.props;
        return (
            <textarea readOnly>
                {
                    output
                }
            </textarea>
        )
    }
}

function mapStateToProps(state) {
    return {
        // recheck syntax + interval to repeat looking
    }
}

export default connect(mapStateToProps, null)(Output);