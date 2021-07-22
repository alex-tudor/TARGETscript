import ErrorHandler from '../error-handler/error-handler.js';

export default class Environment {
    constructor(record = {}, parent = null) {
        this.record = record;
        this.parent = parent;
    }
    define(name, value) {
        // TODO: create code to also accept constant values through "const" keyword or "defineConstant()" method
        this.record[name] = value;
        return value;
    }
    defineConstant(name, value) {
        try {
            Object.defineProperty(this.record, name, {
                value
                , enumerable: true
                // , configurable: false // default value
                // , writable: false     // default value
                
            })
        } catch (error) {
            ErrorHandler.RuntimeError(`Cannot redeclare the variable with identifier \`${name}\` in this instruction block because it is a constant.`);
        }
        return value;
    }

    /**
     * @throws { ErrorHandler.ReferenceError }  If the variable given is not defined in the environment given or in one of its superior environments.
     */
    getVarEnv(name) {
        if (this.record.hasOwnProperty(name)) return this;
        if (this.parent == null)
            ErrorHandler.ReferenceError(
`Variable "${name}" is not defined.
To solve this error, write the following statement at the beginning of your instruction block:                

    let \`${name}\` = "your value here"
`);
        return this.parent.getVarEnv(name);
    }
    get(name) {
        return this.getVarEnv(name).record[name];
    }
    assign(name, value) {
        let env = this.getVarEnv(name);
        try {
            env.record[name] = value;
        }
        catch(error) {
            ErrorHandler.RuntimeError(`Cannot reassign the variable with identifier \`${name}\` in this instruction block because it is a constant.`);
        }
        return value;
    }
}