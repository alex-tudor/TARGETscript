const initialState = {
    processing: false,
    errors: []
};

export default function editorReducer(state = initialState, action) {
    switch (action.type) {
        case 'START_PROCESSING':
            console.log('ready to compile:', action.payload);
            // Terminal.compile(action.payload);
            return {
                ...state,
                processing: true,
                errors: []
            }

        case 'END_PROCESSING':
            return {
                ...state,
                processing: false
            }

        case 'HANDLE_ERROR':
            return {
                ...state,
                processing: false,
                errors: [
                    ...state.errors,
                    action.payload
                ]
            }

        default:
            return state;
    }
}