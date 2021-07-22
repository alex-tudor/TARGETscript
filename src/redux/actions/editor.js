import Terminal from '../../interpreter/terminal/terminal.js';

// function startProcessing() {
//     return {
//         type: 'START_PROCESSING'
//         , payload: null
//     }
// }

// function endProcessing() {
//     return {
//         type: 'END_PROCESSING'
//         , payload: null
//     }
// }

// function sendError(error) {
//     return {
//         type: 'SEND_ERROR'
//         , payload: error
//     }
// }

export function process(code) {
    return function (dispatch) {
        // dispatch(terminalWillProcess());
        dispatch({
            type: 'START_PROCESSING'
            , payload: code
        });
        let result;
        try {
            result = Terminal.process(code);
        } catch (err) {
            console.log('errors appeared:', err);
            dispatch({
                type: 'HANDLE_ERROR'
                , payload: err
            });
            return;
        }
        
        console.log('final result:', result);
        dispatch({
            type: 'END_PROCESSING'
            , payload: null
        });
    }
}

/*
status = {
    exports: generator.exports
    tokenizer: tokenizer.status
    , parser: parser.status
    , generator: generator.status
}
*/