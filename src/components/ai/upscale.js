import {getBearerToken, getGatewayUrl, num_between} from "../../utils";
import BaseComponent from "../BaseComponent.js";
import {PIPELINE_CHANGED_EVENT} from "../../service/GatewayDataFetcher.js";
import {html} from "lit";

export default class Upscale extends BaseComponent {
    constructor() {
        super();
        this.models = [];
        this.gateway = getGatewayUrl()
        this.model_id = ''
        this.fps = 6
        this.height = 576
        this.width = 1024
        this.motion_bucket_id = 127
        this.noise_aug_strength = .002
        this.safety_check = false
        this.seed = ''
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
        addEventListener(PIPELINE_CHANGED_EVENT, this.updateModels);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        removeEventListener(PIPELINE_CHANGED_EVENT, this.updateModels);
    }

    render() {
        return html`
            <section data-nav-item="upscale" class="is-hidden">
                <h3>Upscale Image</h3>
                <div class="columns">
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Upload your image and click Upscale
                            </div>
                            <form enctype="multipart/form-data" @submit=${this._handleSubmit}>
                                ${this.errorMessage ? html`
                                    <div class="notification is-danger">
                                        ${this.errorMessage}
                                    </div>` : ''}
                                <div class="file is-small">
                                    <label class="file-label is-info " for="upscale-file">
                                        <input class="file-input" type="file" name="upscale-file" id="upscale-file"/>
                                        <span class="file-cta">
                                        <span class="file-icon"><i class="fas fa-upload"></i></span>
                                        <span class="file-label"> Choose a file… </span>
                                    </span>
                                        <span class="file-name"> No file uploaded </span>
                                    </label>
                                </div>
                                <div class="field is-grouped">
                                    <div class="control">
                                        <button class="button is-primary" id="submit-prompt">Upscale Image</button>
                                    </div>
                                    <progress id="upscale-progress" class="progress is-hidden" value="0" max="8">0%
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
                                    <label class="label" for="model_id">Safety Check</label>
                                    <div class="control">
                                        <div class="select">
                                            <select id="safety_check" name="safety_check"
                                                    @input=${this._handleInputChange} .value="${this.safety_check}">
                                                <option value="false">false</option>
                                                <option value="true">true</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="field">
                                    <label class="label" for="seed">Seed</label>

                                    <div class="control">
                                        <input class="input" type="text" id="seed" name="seed" value=""
                                               @input=${this._handleInputChange} .value="${this.seed}"/>
                                    </div>
                                    <p class="help">Optional</p>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Your image output will be displayed here.
                            </div>
                            <div id="upscale-output"></div>
                        </div>
                    </div>
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Your Video output will be displayed here.
                            </div>
                            <div class="notification is-danger is-hidden" id="upscale-video-errors"></div>
                            <div id="upscale-vid-output"></div>
                        </div>
                    </div>
                </div>
            </section>`
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
        const imageFileUpload = document.getElementById("upscale-file")
        imageFileUpload.onchange = () => {
            if (imageFileUpload.files.length > 0) {
                const fileName = this.querySelector(".file-name");
                fileName.textContent = imageFileUpload.files[0].name;
            }
        };
    }

    // Handle input changes
    _handleInputChange(e) {
        const {name, value} = e.target;
        this[name] = value;
    }

    // Handle form submission
    async _handleSubmit(e) {
        e.preventDefault();
        console.log("[Upscale] _handleSubmit ", e)
        this.upscaleImage(e.target);
    }

    updateModels(e) {
        const pipelines = e.detail;
        const filteredPipelines = pipelines
            .filter(pipeline => pipeline.name.startsWith("Upscale"))
            .map(pipeline => pipeline.models.sort((a, b) => b.Warm - a.Warm))

        if (filteredPipelines.length > 0) {
            [this.models] = filteredPipelines;
        } else {
            this.models = []; // Handle the case where no models were found
        }
    }

    upscaleImage(form) {
        let formData = new FormData(form);
        const input_data = Object.fromEntries(formData.entries());
        const generateImageButton = form.querySelector("button")
        let errors = [];

        let image = input_data['upscale-file'];

        if (image === undefined || image.size === 0) {
            errors.push("image must be uploaded")
        }

        let safety_check = input_data.safety_check === 'true';

        if (errors.length > 0) {
            let errorMsg = errors.map(e => {
                return (e + "\n")
            })
            this.errorMessage = "errors occurred: \n" + errorMsg;
        } else {
            let body = new FormData();
            body.append("prompt", 'not needed');
            body.append("image", image);
            body.append("model_id", input_data.model_id);
            body.append("safety_check", safety_check);
            if (input_data.seed !== "") {
                body.append("seed", input_data.seed);
            }

            generateImageButton.classList.add("is-loading");

            const outputElement = document.getElementById("upscale-output");
            const handleImageGeneration = async (data) => {

                generateImageButton.classList.remove("is-loading");
                outputElement.textContent = "";

                if (data.error) {
                    this.errorMessage = "failed generating an image, please try again";
                } else {
                    const {images} = data;
                    for (const img of images) {
                        const index = images.indexOf(img);
                        let img_url = img.url;
                        if (img_url.startsWith("http") === false)
                            img_url = `${getGatewayUrl()}${img.url}`;

                        const imageCardElement = document.createElement("generated-image-card");
                        imageCardElement.setAttribute("index", `${index}`);
                        imageCardElement.setAttribute("image-src", `${img_url}`);
                        imageCardElement.setAttribute("video-output", `upscale-vid-output`);
                        outputElement.append(imageCardElement);
                    }
                }
            }

            fetch(`${getGatewayUrl()}/upscale`, {
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
                    await handleImageGeneration(data);
                })
                .catch((err) => {
                    console.error("failed generating an upscaled imgae", err)
                    this.errorMessage = "Failed to generate image, please try again.";
                    generateImageButton.classList.remove("is-loading");
                })
        }
        //reset and remaining error messages
        setTimeout(() => {
            this.successMessage = '';
            this.errorMessage = '';
        }, 3000);
    }
}