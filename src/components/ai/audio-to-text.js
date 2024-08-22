import {getBearerToken, getGatewayUrl} from "../../utils";

const audioToTextTemplate = document.createElement("template")
audioToTextTemplate.innerHTML = `
<section data-nav-item="audio-to-text" class="is-hidden">
<h3>Audio To Text</h3>
<div class="columns">
    <div class="card column m-2">
        <div class="card-content">
            <div class="content">
            Upload your audio file and click Generate Text
            </div>
            <div class="notification is-info is-hidden" id="audio-to-text-success"></div>

            <form id="audio-to-text-form" enctype="multipart/form-data">
                            <div class="notification is-danger is-hidden" id="audio-to-text-errors"></div>
                            <div class="file is-small">
                                <label class="file-label is-info " for="audio-to-text-file">
                                    <input class="file-input" type="file" name="audio-to-text-file" id="audio-to-text-file" />
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
                                <progress id="audio-to-text-progress" class="progress is-hidden" value="0" max="8">0%</progress>
                            </div>
                            <div class="field">
                                <label class="label" for="model_id">Model</label>
                                <div class="control">
                                    <div class="select">
                                        <select id="model_id" name="model_id">
                                        <option selected value="openai/whisper-large-v3">openai/whisper-large-v3</option>
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
</section>
`
export default class AudioToText extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.template = audioToTextTemplate.content.cloneNode(true); // true means deep clone
        this.appendChild(this.template);
        this.form = this.querySelector("form");

        const imageFileUpload = document.getElementById("audio-to-text-file")
        imageFileUpload.onchange = () => {
            if (imageFileUpload.files.length > 0) {
                const fileName = this.querySelector(".file-name");
                fileName.textContent = imageFileUpload.files[0].name;
            }
        };

        this.form.onsubmit = (e) => {
            e.preventDefault();
            this.audioToText();
        }
        this.success_notif = document.getElementById("audio-to-text-success")
        this.error_notif = document.getElementById("audio-to-text-errors")
        this.generateTextButton = this.form.querySelector("button")
    }

    audioToText() {
        this.error_notif.classList.add("is-hidden");
        this.success_notif.classList.add("is-hidden");

        let formData = new FormData(this.form);
        const input_data = Object.fromEntries(formData.entries());

        let errors = [];

        let audio = input_data['audio-to-text-file'];

        if (audio === undefined || audio.size === 0) {
            errors.push("audio must be uploaded")
        }

        if (errors.length > 0) {
            let errorMsg = errors.map(e => {
                return (e + "\n")
            })
            this.error_notif.textContent = "errors occurred: \n" + errorMsg;
            this.error_notif.classList.remove("is-hidden");
            return
        }
        let body = new FormData();
        body.append("audio", audio);
        body.append("model_id", input_data.model_id);
        this.generateTextButton.classList.add("is-loading");

        const outputElement = document.getElementById("audio-to-text-output");
        const handleTextGeneration = async (data) => {

            this.generateTextButton.classList.remove("is-loading");
            outputElement.textContent = "";

            if (data.error) {
                this.error_notif.classList.remove("is-hidden");
                this.error_notif.textContent = "failed generating text, please try again";
                return;
            }

            const {chunks, text} = data;
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const downloadTextButton = document.createElement("button");
            downloadTextButton.classList.add("button","is-primary","is-small");
            downloadTextButton.innerText="Download Text";
            downloadTextButton.onclick=()=>{
                const a = document.createElement('a');
                a.href = url;
                a.download = 'text-to-audio.txt';
                a.click();
            };
            const pTag = document.createElement("p");
            pTag.append(downloadTextButton);
            outputElement.append(pTag);

            // console.log("audio-to-text text",text,chunks);
            chunks.forEach(async (chunk, index) => {
                // console.log("audio-to-text chunk",chunk)
                const textElement = document.createElement("audio-text");
                textElement.setAttribute("timestamp", `${chunk.timestamp[0]}`);

                textElement.setAttribute("text", `${chunk.text}`);
                // textElement.innerText=`${chunk.timestamp[0]}  ${chunk.text}`
                outputElement.append(textElement);
            });
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
                this.error_notif.textContent = "Failed to generate text, please try again.";
                this.generateTextButton.classList.remove("is-loading");
                this.error_notif.classList.remove("is-hidden");
            });
    }
}

