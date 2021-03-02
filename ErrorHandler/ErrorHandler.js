class ErrorHandler {
    static Error(message) {
        throw new Error(`Neutrino Error: ${message}`);
    }
    static InternalError(message) {
        throw new Error(`Neutrino Internal Error: ${message}`);
    }
    static SyntaxError(message) {
        throw new Error(`Neutrino Syntax Error: ${message}`);
    }
    static ReferenceError(message) {
        throw new Error(`Neutrino Reference Error: ${message}`);
    }
    static RuntimeError(message) {
        throw new Error(`Neutrino Runtime Error: ${message}`);
    }
}