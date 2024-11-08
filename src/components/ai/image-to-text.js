import {getBearerToken, getGatewayUrl, num_between} from "../../utils";
import BaseComponent from "../BaseComponent.js";
import {html} from "lit";
import {PIPELINE_CHANGED_EVENT} from "../../service/GatewayDataFetcher.js";

export default class ImageToText extends BaseComponent {
    constructor() {
        super();
        this.models = [];
        this.gateway = getGatewayUrl()
        this.file = undefined
        this.model_id = ''
        this.prompt = ''

        this.successMessage = ""
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
        // console.log("[ImageToImage] connectedCallback ")
        addEventListener(PIPELINE_CHANGED_EVENT, this.updateModels);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // console.log("[ImageToImage] disconnectedCallback ")
        removeEventListener(PIPELINE_CHANGED_EVENT, this.updateModels);
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
        const imageFileUpload = document.getElementById("image-to-text-file")
        imageFileUpload.onchange = () => {
            if (imageFileUpload.files.length > 0) {
                const fileName = this.querySelector(".file-name");

                fileName.textContent = imageFileUpload.files[0].name;
            }
        };
    }

    render() {
        return html`
            <section data-nav-item="image-to-text" class="is-hidden">
                <h3>Image to Text</h3>
                <div class="columns">
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Fill out your input and click generate
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
                                <div class="file is-small">
                                    <label class="file-label is-info " for="image-to-text-file">
                                        <input class="file-input" type="file" name="image-to-text-file"
                                               id="image-to-text-file"/>
                                        <span class="file-cta">
                                        <span class="file-icon"><i class="fas fa-upload"></i></span>
                                        <span class="file-label"> Choose a file… </span>
                                    </span>
                                        <span class="file-name"> No file uploaded </span>
                                    </label>
                                </div>
                                <div class="field is-grouped">
                                    <div class="control">
                                        <button class="button is-primary" id="submit-prompt">Generate</button>
                                    </div>
                                    <progress id="img-progress" class="progress is-hidden" value="0" max="8">0%
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
                            </form>
                        </div>
                    </div>
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Your text output will be displayed here.
                            </div>
                            <div class="notification is-danger is-hidden" id="image-to-text-errors"></div>
                            <div id="image-to-text-output"></div>
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
        // console.log("[ImageToImage] _handleSubmit ", e)
        this.generateText(e.target)
    }

    updateModels(e) {
        const pipelines = e.detail;
        const filteredPipelines = pipelines
            .filter(pipeline => pipeline.name.startsWith("Image to text"))
            .map(pipeline => pipeline.models.sort((a, b) => b.Warm - a.Warm))

        if (filteredPipelines.length > 0) {
            [this.models] = filteredPipelines;
        } else {
            this.models = []; // Handle the case where no models were found
        }
    }

    generateText(form) {
        let formData = new FormData(form);
        const input_data = Object.fromEntries(formData.entries());

        let errors = [];
        let image = input_data['image-to-text-file'];

        if (image === undefined || image.size === 0) {
            errors.push("image must be uploaded")
        }

        if (errors.length > 0) {
            let errorMsg = errors.map(e => {
                return (e + "\n")
            })
            this.errorMessage = "errors occurred: \n" + errorMsg;
        } else {
            let body = new FormData();
            body.append("prompt", input_data.prompt);
            body.append("image", image);
            body.append("model_id", input_data.model_id);

            const generateButton = form.querySelector("button")
            generateButton.classList.add("is-loading");
            const outputElement = document.getElementById("image-to-text-output");
            const handleGeneration = async (data) => {

                generateButton.classList.remove("is-loading");
                // outputElement.textContent = "";

                if (data.error) {
                    this.errorMessage = "failed generating text, please try again";
                } else {
                    const {text} = data;
                    const card = document.createElement("generated-text-card");
                    card.setAttribute("text",text)
                    outputElement.prepend(card)
                }
            }

            fetch(`${getGatewayUrl()}/image-to-text`, {
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
                    console.error("[ImageToText::submitPrompt]", err)
                    this.errorMessage = "Failed to generate text, please try again.";
                    generateButton.classList.remove("is-loading");
                })
        }
        //reset and remaining error messages
        setTimeout(() => {
            this.successMessage = '';
            this.errorMessage = '';
        }, 3000);
    }
}
