import {getBearerToken, getGatewayUrl, num_between} from "../../utils";
import BaseComponent from "../BaseComponent.js";
import {PIPELINE_CHANGED_EVENT} from "../../service/GatewayDataFetcher.js";
import {html} from "lit";

export default class ImageToVideo extends BaseComponent {
    constructor() {
        super();
        this.models = [];
        this.gateway = getGatewayUrl()
        this.model_id = ''
        this.fps = 4
        this.height = 576
        this.width = 1024
        this.motion_bucket_id = 127
        this.noise_aug_strength = 0.065
        // this.safety_check = false
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
            <section data-nav-item="image-to-video" class="is-hidden">
                <h3>Image to Video</h3>
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
                                <div class="file is-small">
                                    <label class="file-label is-info " for="image-to-video-file">
                                        <input class="file-input" type="file" name="image-to-video-file"
                                               id="image-to-video-file"/>
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
                                <div class="field">
                                    <label class="label" for="width">Width</label>

                                    <div class="control">
                                        <input class="input" type="text" id="width" name="width" value="1024"
                                               required=""
                                               @input=${this._handleInputChange}
                                               .value="${this.width}"/>
                                    </div>
                                    <p class="help">Default: 1024</p>
                                </div>
                                <div class="field">
                                    <label class="label" for="height">Height</label>

                                    <div class="control">
                                        <input class="input" type="text" id="height" name="height" value="576"
                                               required=""
                                               @input=${this._handleInputChange}
                                               .value="${this.height}"/>
                                    </div>
                                    <p class="help">Default: 576</p>
                                </div>

                                <div class="field">
                                    <label class="label" for="fps">Frames per Second</label>

                                    <div class="control">
                                        <input class="input" type="text" id="fps" name="fps" value="4" required=""
                                               @input=${this._handleInputChange}
                                               .value="${this.fps}"/>
                                    </div>
                                    <p class="help">Default: 4</p>
                                </div>

                                <div class="field">
                                    <label class="label" for="motion_bucket_id">Motion Bucket Id</label>

                                    <div class="control">
                                        <input class="input" type="text" id="motion_bucket_id" name="motion_bucket_id"
                                               value="127" required="" @input=${this._handleInputChange}
                                               .value="${this.motion_bucket_id}"/>
                                    </div>
                                    <p class="help">Default: 127</p>
                                </div>

                                <div class="field">
                                    <label class="label" for="noise_aug_strength">Noise Aug Strength</label>

                                    <div class="control">
                                        <input class="input" type="text" id="noise_aug_strength"
                                               name="noise_aug_strength"
                                               value=".002" required="" @input=${this._handleInputChange}
                                               .value="${this.noise_aug_strength}"/>
                                    </div>
                                    <p class="help">Default: ???</p>
                                </div>
                                <!--
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
                                </div>-->
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
                    <div class="card column is-two-thirds m-2">
                        <div class="card-content">
                            <div class="content">
                                Your Video output will be displayed here.
                            </div>
                            <div class="notification is-danger is-hidden" id="image-to-video-errors"></div>
                            <div id="image-to-video-output"></div>
                        </div>
                    </div>
                </div>
            </section>`
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);

        const imageFileUpload = document.getElementById("image-to-video-file")
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
        console.log("[ImageToVideo] _handleSubmit ", e)
        this.generateImage(e.target);
    }

    updateModels(e) {
        const pipelines = e.detail;
        const filteredPipelines = pipelines
            .filter(pipeline => pipeline.name.startsWith("Image to video"))
            .map(pipeline => pipeline.models.sort((a, b) => b.Warm - a.Warm))

        if (filteredPipelines.length > 0) {
            [this.models] = filteredPipelines;
        } else {
            this.models = []; // Handle the case where no models were found
        }
    }

    generateImage(form) {

        let formData = new FormData(form);
        const input_data = Object.fromEntries(formData.entries());
        const generateImageButton = form.querySelector("button")
        let errors = [];

        let image = input_data['image-to-video-file'];

        if (image === undefined || image.size === 0) {
            errors.push("image must be uploaded")
        }

        let height = parseInt(input_data.height)

        if (isNaN(height) || num_between(height, 1, 1024) === false) {
            errors.push("height is must be a number between 1 and 1024")
        }

        let width = parseInt(input_data.width)

        if (isNaN(width) || num_between(width, 1, 1024) === false) {
            errors.push("width is must be a number between 1 and 1024")
        }

        let motion_bucket_id = parseInt(input_data.motion_bucket_id)

        if (isNaN(motion_bucket_id)) {
            errors.push("motion_bucket_id is must be a number")
        }

        let fps = parseInt(input_data.fps)

        if (isNaN(fps)) {
            errors.push("fps is must be a number")
        }

        let noise_aug_strength = parseFloat(input_data.noise_aug_strength)

        if (isNaN(noise_aug_strength)) {
            errors.push("noise_aug_strength is must be a number")
        }

        let safety_check = input_data.safety_check === 'true';

        if (errors.length > 0) {
            let errorMsg = errors.map(e => {
                return (e + "\n")
            })
            this.errorMessage = "errors occurred: \n" + errorMsg;
        } else {
            let body = new FormData();
            body.append("image", image);
            body.append("model_id", input_data.model_id);
            body.append("noise_aug_strength", noise_aug_strength);
            body.append("motion_bucket_id", motion_bucket_id);
            body.append("height", height);
            body.append("width", width);
            body.append("fps", fps);
            // body.append("safety_check", safety_check);

            if (input_data.seed !== "") {
                body.append("seed", input_data.seed);
            }

            generateImageButton.classList.add("is-loading");
            const outputElement = document.getElementById("image-to-video-output");
            const handleVideoGeneration = async (data) => {

                generateImageButton.classList.remove("is-loading");

                if (data.error) {
                    this.errorMessage = "failed generating a video, please try again";
                } else {
                    let vid_url = data?.images[0]?.url;

                    if (vid_url.startsWith("http") === false)
                        vid_url = `${getGatewayUrl()}${vid_url}`;

                    const videoElement = document.createElement("video");
                    videoElement.setAttribute("src", vid_url);
                    videoElement.setAttribute("type", "video/mp4");
                    videoElement.setAttribute("autoplay", "true");
                    videoElement.setAttribute("controls", "true");
                    outputElement.prepend(videoElement);
                }
            }

            fetch(`${getGatewayUrl()}/image-to-video`, {
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
                    await handleVideoGeneration(data);
                })
                .catch((err) => {
                    console.error("[ImageToVideo ]", err)
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