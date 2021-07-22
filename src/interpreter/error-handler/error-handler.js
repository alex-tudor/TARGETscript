export default class ErrorHandler {
    static Error(message) {
        throw new Error(`Target - Error: ${message}`);
    }
    static InternalError(message) {
        // console.log(this.caller);
        throw new Error(`Target - Internal Error: ${message}`);
    }
    static SyntaxError(message) {
        throw new Error(`Target - Syntax Error: ${message}`);
    }
    static ReferenceError(message) {
        throw new Error(`Target - Reference Error: ${message}`);
    }
    static RuntimeError(message) {
        throw new Error(`Target - Runtime Error: ${message}`);
    }
}