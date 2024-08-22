import { getBearerToken, getGatewayUrl, num_between } from "../../utils";

const imageToImageTemplate = document.createElement("template")
imageToImageTemplate.innerHTML = `
<section data-nav-item="image-to-image" class="is-hidden">
<h3>Image to Image Example</h3>
<div class="columns">
    <div class="card column m-2">
        <div class="card-content">
            <div class="content">
                Fill out your input and click generate
            </div>
            <div class="notification is-info is-hidden" id="image-to-image-success"></div>

            <form id="image-to-image-form" enctype="multipart/form-data">
                            <div class="notification is-danger is-hidden" id="image-to-image-errors"></div>
                            <div class="field">
                                <label for="prompt" class="label">Prompt</label>
                                <div class="control">
                                    <textarea class="textarea" id="prompt" name="prompt"
                                        placeholder="Type in your prompt"></textarea>
                                </div>
                            </div>
                            <div class="file is-small">
                                <label class="file-label is-info " for="image-to-image-file">
                                    <input class="file-input" type="file" name="image-to-image-file" id="image-to-image-file" />
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
                                <progress id="img-progress" class="progress is-hidden" value="0" max="8">0%</progress>
                            </div>
                            <div class="field">
                                <label class="label" for="model_id">Model</label>
                                <div class="control">
                                    <div class="select">
                                        <select id="model_id" name="model_id">
                                            <option selected value="timbrooks/instruct-pix2pix">timbrooks/instruct-pix2pix</option>
                                            <option value="ByteDance/SDXL-Lightning">ByteDance/SDXL-Lightning</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div class="field">
                                <label for="negative_prompt" class="label">Negative Prompt</label>
                                <div class="control">
                                    <input class="input" type="text" id="negative_prompt" name="negative_prompt"
                                        placeholder="worst quality, low quality" />
                                </div>
                            </div>
                            <div class="field">
                                <label class="label" for="width">Strength</label>

                                <div class="control">
                                    <input class="input" type="text" id="strength" name="strength" value="1" />
                                </div>
                                <p class="help">Default: ???</p>
                            </div>
                            <div class="field">
                                <label class="label" for="num_inference_steps"># of Inference Steps</label>
                                <div class="control">
                                    <input class="input" type="text" id="num_inference_steps" name="num_inference_steps"
                                    value="10" />
                                </div>
                                <p class="help">Optional</p>
                            </div>
        
                            <div class="field">
                                <label class="label" for="num_images_per_prompt"># of Images</label>

                                <div class="control">
                                    <input class="input" type="text" id="num_images_per_prompt"
                                        name="num_images_per_prompt" value="2" />
                                </div>
                                <p class="help">Max of 10</p>
                            </div>

                            <div class="field">
                                <label class="label" for="guidance_scale">Guidance Scale</label>

                                <div class="control">
                                    <input class="input" type="text" id="guidance_scale" name="guidance_scale"
                                        value="1" />
                                </div>
                                <p class="help">Optional</p>
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
            <div id="image-to-image-output"></div>
        </div>
    </div>
    <div class="card column m-2">
        <div class="card-content">
            <div class="content">
                Your Video output will be displayed here.
            </div>
            <div class="notification is-danger is-hidden" id="image-to-image-video-errors"></div>
            <div id="image-to-image-vid-output"></div>
        </div>
    </div>
</div>
</section>
`
export default class ImageToImage extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.template = imageToImageTemplate.content.cloneNode(true); // true means deep clone
        this.appendChild(this.template);
        this.form = this.querySelector("form");

        const imageFileUpload = document.getElementById("image-to-image-file")
        imageFileUpload.onchange = () => {
            if (imageFileUpload.files.length > 0) {
                const fileName = this.querySelector(".file-name");

                fileName.textContent = imageFileUpload.files[0].name;
            }
        };

        this.form.onsubmit = (e) => {
            e.preventDefault();
            this.generateImage();
        }
        this.success_notif = document.getElementById("image-to-image-success")
        this.error_notif = document.getElementById("image-to-image-errors")
        this.generateImageButton = this.form.querySelector("button")
    }



    generateImage() {
        this.error_notif.classList.add("is-hidden");
        this.success_notif.classList.add("is-hidden");

        let formData = new FormData(this.form);
        const input_data = Object.fromEntries(formData.entries());

        let errors = [];
        let image = input_data['image-to-image-file'];

        if (image === undefined || image.size === 0) {
            errors.push("image must be uploaded")
        }
        let num_inference_steps = parseInt(input_data.num_inference_steps)

        if (isNaN(num_inference_steps) || num_inference_steps <= 1) {
            errors.push("num_inference_steps is must be a number greater than 1")
        }

        let guidance_scale = parseInt(input_data.guidance_scale)

        if (isNaN(guidance_scale)) {
            errors.push("guidance_scale is must be a number")
        }

        let strength = parseInt(input_data.strength)

        if (isNaN(strength)) {
            errors.push("strength is must be a number greater than 1")
        }

        let num_images_per_prompt = parseInt(input_data.num_images_per_prompt);

        if (isNaN(num_images_per_prompt) || num_images_per_prompt > 10) {
            errors.push("Max of 10 Images")
        }

        let safety_check = input_data.safety_check == 'true';

        if (!input_data.prompt) {
            errors.push("Please enter a prompt")
        }

        if (errors.length > 0) {
            let errorMsg = errors.map(e => { return (e + "\n") })
            this.error_notif.textContent = "errors occurred: \n" + errorMsg;
            this.error_notif.classList.remove("is-hidden");
            return
        }

        let body = new FormData();
        body.append("prompt", input_data.prompt);
        body.append("negative_prompt", input_data.negative_prompt);
        body.append("image", image);
        body.append("model_id", input_data.model_id);
        body.append("guidance_scale", guidance_scale);
        body.append("strength", strength);
        body.append("num_images_per_prompt", num_images_per_prompt);
        body.append("num_inference_steps", num_inference_steps);
        body.append("safety_check", safety_check);
        if (input_data.seed !== "") {
            body.append("seed", input_data.seed);
        }

        this.generateImageButton.classList.add("is-loading");
        const outputElement = document.getElementById("image-to-image-output");
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
                // console.log("image to image img_url",img.url)
                let img_url = img.url;
                if(img_url.startsWith("http") == false)
                    img_url=`${getGatewayUrl()}${img.url}`;
                // console.log("image to image fetching image from ",img_url)

                const imageCardElement = document.createElement("generated-image-card");
                imageCardElement.setAttribute("index", `${index}`);
                imageCardElement.setAttribute("image-src", `${img_url}`);
                imageCardElement.setAttribute("video-output", `image-to-image-vid-output`);

                outputElement.append(imageCardElement);

            });
        }

        fetch(`${getGatewayUrl()}/image-to-image`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            headers:{
                "Authorization": `Bearer ${getBearerToken()}`
            },
            body
        })
            .then((resp) => resp.json())
            .then(async (data) => {
                await handleImageGeneration(data);
            })
            .catch((err) => {
                console.error("[GenerateImgeForm::submitPrompt]", err)
                this.error_notif.textContent = "Failed to generate image, please try again.";
                this.generateImageButton.classList.remove("is-loading");
                this.error_notif.classList.remove("is-hidden");
            });
    }
}

