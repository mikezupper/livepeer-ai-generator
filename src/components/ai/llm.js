import {getBearerToken, getGatewayUrl} from "../../utils";
import BaseComponent from "../BaseComponent.js";
import {PIPELINE_CHANGED_EVENT} from "../../service/GatewayDataFetcher.js";
import {html} from "lit";
import {marked} from "marked";

export default class LLM extends BaseComponent {
    constructor() {
        super();
        this.models = [];
        this.gateway = getGatewayUrl()
        this.model_id = ''
        this.prompt=''
        this.max_tokens='256'
        this.errorMessage = ""
        this.updateModels = this.updateModels.bind(this);
    }

    static properties = {
        models: {type: Array},
        gateway: {type: String},
        errorMessage: {type: String},
        successMessage: {type: String}
    };

    connectedCallback() {
        super.connectedCallback()
        addEventListener(PIPELINE_CHANGED_EVENT, this.updateModels);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        removeEventListener(PIPELINE_CHANGED_EVENT, this.updateModels);
    }

    render() {
        return html`
            <section data-nav-item="llm" class="is-hidden">
                <h3>LLM</h3>
                <div class="columns">
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Enter your prompt and click Ask
                            </div>
                            <form enctype="multipart/form-data" @submit=${this._handleSubmit}>
                                ${this.errorMessage ? html`
                                    <div class="notification is-danger">
                                        ${this.errorMessage}
                                    </div>` : ''}
                                <div class="field">
                                    <label for="prompt" class="label">Prompt</label>
                                    <div class="control">
                                        <textarea class="textarea" id="prompt" name="prompt"
                                                  placeholder="Type in your prompt" required=""
                                                  @input=${this._handleInputChange} .value="${this.prompt}"></textarea>
                                    </div>
                                </div>
                                <div class="field is-grouped">
                                    <div class="control">
                                        <button class="button is-primary" id="submit-prompt">Ask</button>
                                    </div>
                                    <progress id="llm-progress" class="progress is-hidden" value="0" max="8">
                                        0%
                                    </progress>
                                </div>
                                <div class="field">
                                    <label class="label" for="model_id">Model</label>
                                    <div class="control">
                                        <div class="select">
                                            <select id="model_id" name="model_id" @input=${this._handleInputChange}
                                                    .value="${this.model_id}">
                                                ${this.models.map(model => html`
                                                    <option value="${model.name}">${model.name}</option>
                                                `)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="field">
                                    <label class="label" for="max_tokens">Max Tokens</label>

                                    <div class="control">
                                        <input class="input" type="text" id="max_tokens" name="max_tokens" value="256"
                                               required="" @input=${this._handleInputChange} .value="${this.max_tokens}"/>
                                    </div>
                                    <p class="help">Default: 256</p>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Your text output will be displayed here.
                            </div>
                            <div id="llm-output"></div>
                        </div>
                    </div>
                </div>
            </section>`
    }

    // Handle input changes
    _handleInputChange(e) {
        const {name, value} = e.target;
        this[name] = value;
    }

    // Handle form submission
    async _handleSubmit(e) {
        e.preventDefault();
        console.log("[LLM] _handleSubmit ", e)
        this.llm(e.target);
    }

    updateModels(e) {
        const pipelines = e.detail;
        const filteredPipelines = pipelines
            .filter(pipeline => (pipeline.name.startsWith("Large Language Model") || pipeline.name.startsWith("Llm")))
            .map(pipeline => pipeline.models.sort((a, b) => b.Warm - a.Warm))

        if (filteredPipelines.length > 0) {
            [this.models] = filteredPipelines;
        } else {
            this.models = []; // Handle the case where no models were found
        }
    }

    llm(form) {

        let formData = new FormData(form);
        const input_data = Object.fromEntries(formData.entries());
        const askButton = form.querySelector("button")

        let errors = [];

        if (errors.length > 0) {
            let errorMsg = errors.map(e => {
                return (e + "\n")
            })
            this.errorMessage = "errors occurred: \n" + errorMsg;
        } else {
            let body = new FormData();
            body.append("prompt", input_data.prompt);
            body.append("model_id", input_data.model_id);
            body.append("max_tokens", input_data.max_tokens);

            askButton.classList.add("is-loading");

            const outputElement = document.getElementById("llm-output");
            const handleGeneration = async (data) => {

                askButton.classList.remove("is-loading");
                outputElement.textContent = "";

                if (data.error) {
                    this.errorMessage = "failed generating llm response, please try again";
                } else {
                    const output = await marked(data.response);
                    console.log(output);
                    outputElement.innerHTML=output;
                }
            }

            fetch(`${getGatewayUrl()}/llm`, {
                method: "POST",
                mode: "cors",
                cache: "no-cache",
                headers: {
                    "Authorization": `Bearer ${getBearerToken()}`
                },
                body
            })
                .then((resp) => resp.json())
                .then(async (data) => {
                    await handleGeneration(data);
                })
                .catch((err) => {
                    console.error("failed generating llm output", err)
                    this.errorMesaage = "Failed to generate text, please try again.";
                    askButton.classList.remove("is-loading");
                })
        }
        //reset and remaining error messages
        setTimeout(() => {
            this.successMessage = '';
            this.errorMessage = '';
        }, 3000);
    }
}
