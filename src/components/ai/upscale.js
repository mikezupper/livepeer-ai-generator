import { getGatewayUrl, num_between } from "../../utils";

const upscaleTemplate = document.createElement("template")
upscaleTemplate.innerHTML = `
<section data-nav-item="upscale" class="is-hidden">
<h3>Upscale Image</h3>
<div class="columns">
    <div class="card column m-2">
        <div class="card-content">
            <div class="content">
            Upload your image and click Upscale
            </div>
            <div class="notification is-info is-hidden" id="upscale-success"></div>

            <form id="upscale-form" enctype="multipart/form-data">
                            <div class="notification is-danger is-hidden" id="upscale-errors"></div>
                            <div class="file is-small">
                                <label class="file-label is-info " for="upscale-file">
                                    <input class="file-input" type="file" name="upscale-file" id="upscale-file" />
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
                                <progress id="upscale-progress" class="progress is-hidden" value="0" max="8">0%</progress>
                            </div>
                            <div class="field">
                                <label class="label" for="model_id">Model</label>
                                <div class="control">
                                    <div class="select">
                                        <select id="model_id" name="model_id">
                                        <option selected value="stabilityai/stable-diffusion-x4-upscaler">stabilityai/stable-diffusion-x4-upscaler</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="field">
                                <label class="label" for="model_id">Safety Check</label>
                                <div class="control">
                                    <div class="select">
                                        <select id="safety_check" name="safety_check">
                                            <option selected value="true">true</option>
                                            <option value="false">false</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="field">
                                <label class="label" for="seed">Seed</label>

                                <div class="control">
                                    <input class="input" type="text" id="seed" name="seed" value="" />
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
</section>
`
export default class Upscale extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.template = upscaleTemplate.content.cloneNode(true); // true means deep clone
        this.appendChild(this.template);
        this.form = this.querySelector("form");

        const imageFileUpload = document.getElementById("upscale-file")
        imageFileUpload.onchange = () => {
            if (imageFileUpload.files.length > 0) {
                const fileName = this.querySelector(".file-name");
                fileName.textContent = imageFileUpload.files[0].name;
            }
        };

        this.form.onsubmit = (e) => {
            e.preventDefault();
            this.upscaleImage();
        }
        this.success_notif = document.getElementById("upscale-success")
        this.error_notif = document.getElementById("upscale-errors")
        this.generateImageButton = this.form.querySelector("button")
    }

    upscaleImage() {
        this.error_notif.classList.add("is-hidden");
        this.success_notif.classList.add("is-hidden");

        let formData = new FormData(this.form);
        const input_data = Object.fromEntries(formData.entries());

        let errors = new Array();

        let image = input_data['upscale-file'];

        if (image == undefined || image.size == 0) {
            errors.push("image must be uploaded")
        }

        let safety_check = input_data.safety_check == 'true';

        if (errors.length > 0) {
            let errorMsg = errors.map(e => { return (e + "\n") })
            this.error_notif.textContent = "errors occurred: \n" + errorMsg;
            this.error_notif.classList.remove("is-hidden");
            return
        }
        let body = new FormData();
        body.append("prompt", 'not needed');
        body.append("image", image);
        body.append("model_id", input_data.model_id);
        body.append("safety_check", safety_check);
        if (input_data.seed != "") {
            body.append("seed", input_data.seed);
        }

        this.generateImageButton.classList.add("is-loading");

        const outputElement = document.getElementById("upscale-output");
        const handleImageGeneration = async (data) => {

            this.generateImageButton.classList.remove("is-loading");
            outputElement.textContent = "";

            if (data.error) {
                this.error_notif.classList.remove("is-hidden");
                this.error_notif.textContent = "failed generating an image, please try again";
                return;
            }

            const { images } = data;
            images.forEach(async (img, index) => {
                // console.log("upscale img_url",img.url)
                let img_url = img.url;
                if(img_url.startsWith("http") == false)
                    img_url=`${getGatewayUrl()}${img.url}`;
                // console.log("upscale fetching image from ",img_url)

                const imageCardElement = document.createElement("generated-image-card");
                imageCardElement.setAttribute("index", `${index}`);
                imageCardElement.setAttribute("image-src", `${img_url}`);
                imageCardElement.setAttribute("video-output", `upscale-vid-output`);

                outputElement.append(imageCardElement);

            });
        }

        fetch(`${getGatewayUrl()}/upscale`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers:{
                "Authorization": `Bearer None`
            },
            body
        })
            .then((resp) => resp.json())
            .then(async (data) => {
                await handleImageGeneration(data);
            })
            .catch((err) => {
                console.error("failed generating an upscaled imgae", err)
                this.error_notif.textContent = "Failed to generate image, please try again.";
                this.generateImageButton.classList.remove("is-loading");
                this.error_notif.classList.remove("is-hidden");
            });
    }
}

