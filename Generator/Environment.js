class Environment {
    constructor(record = {}, parent = null) {
        this.record = record;
        this.parent = parent;
    }
    define(name, value) {
        // TODO: create code to also accept constant values through "const" keyword / defineConstant method
        this.record[name] = value;
        return value;
    }

    /**
     * @throws { ErrorHandler.ReferenceError }  If the variable is not defined
     */
    getVarEnv(name) {
        if (this.record.hasOwnProperty(name)) return this;
        if (this.parent == null) ErrorHandler.ReferenceError(`Variable "${name}" is not defined.`);
        return this.parent.getVarEnv(name);
    }
    get(name) {
        return this.getVarEnv(name).record[name];
    }
    assign(name, value) {
        this.getVarEnv(name).record[name] = value;
        return value;
    }
}