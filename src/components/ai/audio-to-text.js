import {getBearerToken, getGatewayUrl} from "../../utils";
import BaseComponent from "../BaseComponent.js";
import {PIPELINE_CHANGED_EVENT} from "../../service/GatewayDataFetcher.js";
import {html} from "lit";

export default class AudioToText extends BaseComponent {
    constructor() {
        super();
        this.models = [];
        this.gateway = getGatewayUrl()
        this.model_id = ''
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
            <section data-nav-item="audio-to-text" class="is-hidden">
                <h3>Audio To Text</h3>
                <div class="columns">
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Upload your audio file and click Generate Text
                            </div>
                            <form enctype="multipart/form-data" @submit=${this._handleSubmit}>
                                ${this.errorMessage ? html`
                                    <div class="notification is-danger">
                                        ${this.errorMessage}
                                    </div>` : ''}
                                <div class="file is-small">
                                    <label class="file-label is-info " for="audio-to-text-file">
                                        <input class="file-input" type="file" name="audio-to-text-file"
                                               id="audio-to-text-file"/>
                                        <span class="file-cta">
                                        <span class="file-icon"><i class="fas fa-upload"></i></span>
                                        <span class="file-label"> Choose a file… </span>
                                    </span>
                                        <span class="file-name"> No file uploaded </span>
                                    </label>
                                </div>
                                <div class="field is-grouped">
                                    <div class="control">
                                        <button class="button is-primary" id="submit-prompt">Generate Text</button>
                                    </div>
                                    <progress id="audio-to-text-progress" class="progress is-hidden" value="0" max="8">
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
                            </form>
                        </div>
                    </div>
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Your text output will be displayed here.
                            </div>
                            <div id="audio-to-text-output"></div>
                        </div>
                    </div>
                </div>
            </section>`
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
        const imageFileUpload = document.getElementById("audio-to-text-file")
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
        console.log("[AudioToText] _handleSubmit ", e)
        this.audioToText(e.target);
    }

    updateModels(e) {
        const pipelines = e.detail;
        const filteredPipelines = pipelines
            .filter(pipeline => pipeline.name.startsWith("Audio to text"))
            .map(pipeline => pipeline.models.sort((a, b) => b.Warm - a.Warm))

        if (filteredPipelines.length > 0) {
            [this.models] = filteredPipelines;
        } else {
            this.models = []; // Handle the case where no models were found
        }
    }

    audioToText(form) {
        let formData = new FormData(form);
        const input_data = Object.fromEntries(formData.entries());
        const generateTextButton = form.querySelector("button")
        let errors = [];

        let audio = input_data['audio-to-text-file'];

        if (audio === undefined || audio.size === 0) {
            errors.push("audio must be uploaded")
        }

        if (errors.length > 0) {
            let errorMsg = errors.map(e => {
                return (e + "\n")
            })
            this.errorMessage = "errors occurred: \n" + errorMsg;
        } else {
            let body = new FormData();
            body.append("audio", audio);
            body.append("model_id", input_data.model_id);
            generateTextButton.classList.add("is-loading");

            const outputElement = document.getElementById("audio-to-text-output");
            const handleTextGeneration = async (data) => {

                generateTextButton.classList.remove("is-loading");
                outputElement.textContent = "";

                if (data.error) {
                    this.errorMessage = "failed generating text, please try again";
                } else {
                    const {chunks, text} = data;
                    const blob = new Blob([text], {type: 'text/plain'});
                    const url = URL.createObjectURL(blob);
                    const downloadTextButton = document.createElement("button");
                    downloadTextButton.classList.add("button", "is-primary", "is-small");
                    downloadTextButton.innerText = "Download Text";
                    downloadTextButton.onclick = () => {
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'text-to-audio.txt';
                        a.click();
                    };
                    const pTag = document.createElement("p");
                    pTag.append(downloadTextButton);
                    outputElement.append(pTag);

                    // console.log("audio-to-text text",text,chunks);
                    if (chunks && chunks.length > 0) {
                        for (const chunk of chunks) {
                            const index = chunks.indexOf(chunk);
                            // console.log("audio-to-text chunk",chunk)
                            const textElement = document.createElement("audio-text");
                            textElement.setAttribute("timestamp", `${chunk.timestamp[0]}`);

                            textElement.setAttribute("text", `${chunk.text}`);
                            // textElement.innerText=`${chunk.timestamp[0]}  ${chunk.text}`
                            outputElement.append(textElement);
                        }
                    }
                }
            }

            fetch(`${getGatewayUrl()}/audio-to-text`, {
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
                    await handleTextGeneration(data);
                })
                .catch((err) => {
                    console.error("failed generating audio-to-text output", err)
                    this.errorMesaage = "Failed to generate text, please try again.";
                    generateTextButton.classList.remove("is-loading");
                })
        }
        //reset and remaining error messages
        setTimeout(() => {
            this.successMessage = '';
            this.errorMessage = '';
        }, 3000);
    }
}