import {getBearerToken, getGatewayUrl, num_between} from "../../utils";
import BaseComponent from "../BaseComponent.js";
import {html} from "lit";
import {PIPELINE_CHANGED_EVENT} from "../../service/GatewayDataFetcher.js";

export default class TextToSpeech extends BaseComponent {
    constructor() {
        super();
        this.models = [];
        this.gateway = getGatewayUrl()
        this.model_id = ''
        this.description = ''
        this.text= ''
        this.safety_check = false
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
            <section data-nav-item="text-to-speech" class="is-hidden">
                <div class="columns">
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Fill out your input and click generate
                            </div>
                            ${this.successMessage ? html`
                                <div class="notification is-info">${this.successMessage}</div>` : ''}

                            <form @submit=${this._handleSubmit}>
                                ${this.errorMessage ? html`
                                    <div class="notification is-danger">
                                        ${this.errorMessage}
                                    </div>` : ''}
                                <div class="field">
                                    <label for="prompt" class="label">Text</label>
                                    <div class="control">
                                        <textarea class="textarea" id="text" name="text"
                                                  placeholder="Type in your text" required=""
                                                  maxlength="600"
                                                  @input=${this._handleInputChange} .value="${this.text}"></textarea>
                                    </div>
                                </div>

                                <div class="field is-grouped">
                                    <div class="control">
                                        <button class="button is-primary" id="submit-prompt">Generate</button>
                                    </div>
                                    <progress id="text-to-speech-progress" class="progress is-hidden" value="0" max="8">
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
                                    <label for="description" class="label">Description</label>
                                    <div class="control">
                                        <input class="input" type="text" id="description" name="description"
                                               placeholder="A male speaker delivers a slightly expressive and animated speech with a moderate speed and pitch."
                                               @input=${this._handleInputChange} .value="${this.description}"/>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Your speech output will be displayed here.
                            </div>
                            <div id="text-to-speech-output"></div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    // Handle input changes
    _handleInputChange(e) {
        const {name, value} = e.target;
        this[name] = value;
    }

    // Handle form submission
    async _handleSubmit(e) {
        e.preventDefault();
        console.log("[TextToSpeech] _handleSubmit ", e)
        let formData = new FormData(e.target);
        const input_data = Object.fromEntries(formData.entries());
        console.log("[TextToSpeech::_handleSubmit] input_data", input_data);

        let errors = []

        if (!input_data.text) {
            errors.push("Please enter text")
        }

        if (errors.length > 0) {
            let errorMsg = errors.map(e => {
                return (e + "\n")
            })
            this.errorMessage = "errors occurred: \n" + errorMsg;
        } else {
            let body = {
                ...input_data
            };

            this.generateSpeechButton = e.target.querySelector("button")
            this.generateSpeechButton.classList.add("is-loading");
            const outputElement = document.getElementById("text-to-speech-output");
            const handleSpeechGeneration = async (data) => {

                this.generateSpeechButton.classList.remove("is-loading");

                if (data.error) {
                    this.errorMessage = "failed generating speech, please try again";
                    return;
                }
                const {audio} = data;
                let asset_url = audio.url;
                if (asset_url.startsWith("http") === false)
                    asset_url = `${getGatewayUrl()}${audio.url}`;

                const speechCard = document.createElement("speech-card");
                speechCard.setAttribute("audio-src",asset_url)
                outputElement.prepend(speechCard)
            }

            fetch(`${getGatewayUrl()}/text-to-speech`, {
                method: "POST",
                mode: "cors",
                cache: "no-cache",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${getBearerToken()}`
                },
            })
                .then((resp) => resp.json())
                .then(async (data) => {
                    await handleSpeechGeneration(data);
                })
                .catch((err) => {
                    console.error("[TextToSpeech] error: ",err)
                    this.errorMessage = "Failed to generate speech, please try again.";
                })
        }

        //reset and remaining error messages
        setTimeout(() => {
            this.successMessage = '';
            this.errorMessage = '';
        }, 3000);
    }

    updateModels(e) {
        const pipelines = e.detail;
        const filteredPipelines = pipelines
            .filter(pipeline => pipeline.name.startsWith("Text to speech"))
            .map(pipeline => pipeline.models.sort((a, b) => b.Warm - a.Warm))

        if (filteredPipelines.length > 0) {
            [this.models] = filteredPipelines;
        } else {
            this.models = []; // Handle the case where no models were found
        }
    }
}
