import {LitElement} from "lit";

/**
 * The Base class for all Lit Custom Elements.
 *
 */
export default class BaseComponent extends LitElement {

    /**
     * This method is needed to disable shadow DOM
     * @returns {BaseComponent}
     */
    createRenderRoot() {
        return this;
    }

    constructor() {
        super();
    }
}