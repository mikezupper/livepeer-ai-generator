import { getGatewayUrl, num_between } from "../../utils";

const textToImageTemplate = document.createElement("template")
textToImageTemplate.innerHTML = `
<section data-nav-item="text-to-image" class="is-hidden">

<div class="columns">
    <div class="card column m-2">
        <div class="card-content">
            <div class="content">
                Fill out your input and click generate
            </div>
            <div class="notification is-info is-hidden" id="text-to-image-success"></div>

            <form id="text-to-image-form">
                <div class="notification is-danger is-hidden" id="text-to-image-errors"></div>
                <div class="field">
                    <label for="prompt" class="label">Prompt</label>
                    <div class="control">
                        <textarea class="textarea" id="prompt" name="prompt"
                            placeholder="Type in your prompt"></textarea>
                    </div>
                </div>

                <div class="field is-grouped">
                    <div class="control">
                        <button class="button is-primary" id="submit-prompt">Generate</button>
                    </div>
                    <progress id="text-to-image-progress" class="progress is-hidden" value="0" max="8">0%</progress>
                </div>
                <div class="field">
                    <label class="label" for="model_id">Model</label>
                    <div class="control">
                        <div class="select">
                            <select id="model_id" name="model_id">
                                <option value="stabilityai/stable-diffusion-3-medium-diffusers">stabilityai/stable-diffusion-3-medium-diffusers</option>
                                <option value="SG161222/RealVisXL_V4.0">SG161222/RealVisXL_V4.0</option>
                                <option selected value="SG161222/RealVisXL_V4.0_Lightning">SG161222/RealVisXL_V4.0_Lightning</option>
                                <option value="ByteDance/SDXL-Lightning">ByteDance/SDXL-Lightning</option>
                                <option value="ByteDance/SDXL-Lightning-4step">ByteDance/SDXL-Lightning-4step</option>
                                <option value="ByteDance/SDXL-Lightning-6step">ByteDance/SDXL-Lightning-6step</option>
                                <option value="ByteDance/SDXL-Lightning-8step">ByteDance/SDXL-Lightning-8step</option>
                                <option value="runwayml/stable-diffusion-v1-5">runwayml/stable-diffusion-v1-5</option>
                                <option value="stabilityai/stable-diffusion-xl-base-1.0">stabilityai/stable-diffusion-xl-base-1.0</option>
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
                    <label class="label" for="width">Width</label>

                    <div class="control">
                        <input class="input" type="text" id="width" name="width" value="1024" />
                    </div>
                    <p class="help">Default: 1024</p>
                </div>
                <div class="field">
                    <label class="label" for="height">Height</label>

                    <div class="control">
                        <input class="input" type="text" id="height" name="height" value="576" />
                    </div>
                    <p class="help">Default: 576</p>
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
                    <label class="label" for="num_inference_steps"># of Inference Steps</label>

                    <div class="control">
                        <input class="input" type="text" id="num_inference_steps" name="num_inference_steps"
                            value="6" />
                    </div>
                    <p class="help">Optional</p>
                </div>

                <div class="field">
                    <label class="label" for="guidance_scale">Guidance Scale</label>

                    <div class="control">
                        <input class="input" type="text" id="guidance_scale" name="guidance_scale"
                            value="2" />
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
            <div id="text-to-image-output"></div>
        </div>
    </div>
    <div class="card column m-2">
        <div class="card-content">
            <div class="content">
                Your Video output will be displayed here.
            </div>
            <div class="notification is-danger is-hidden" id="text-to-image-video-errors"></div>
            <div id="text-to-image-vid-output"></div>
        </div>
    </div>
</div>
</section>
`
export default class TextToImage extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.template = textToImageTemplate.content.cloneNode(true); // true means deep clone
        this.appendChild(this.template);
        this.form = this.querySelector("form");
        this.form.onsubmit = (e) => {
            e.preventDefault();
            this.generateImage();
        }
        this.success_notif = document.getElementById("text-to-image-success")
        this.error_notif = document.getElementById("text-to-image-errors")
        this.generateImageButton = this.form.querySelector("button")
    }



    generateImage() {
        this.error_notif.classList.add("is-hidden");
        this.success_notif.classList.add("is-hidden");

        let formData = new FormData(this.form);
        const input_data = Object.fromEntries(formData.entries());


        let errors = new Array();

        let height = parseInt(input_data.height)

        if (isNaN(height) || num_between(height, 1, 1024) == false) {
            errors.push("height is must be a number between 1 and 1024")
        }

        let width = parseInt(input_data.width)

        if (isNaN(width) || num_between(width, 1, 1024) == false) {
            errors.push("width is must be a number between 1 and 1024")
        }

        let guidance_scale = parseInt(input_data.guidance_scale)

        if (isNaN(guidance_scale)) {
            errors.push("guidance_scale is must be a number")
        }

        let num_inference_steps = parseInt(input_data.num_inference_steps)

        if (isNaN(num_inference_steps) || num_inference_steps <= 1) {
            errors.push("num_inference_steps is must be a number greater than 1")
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
        let body = {
            ...input_data
            , safety_check
            , guidance_scale
            , num_inference_steps
            , num_images_per_prompt
            , height
            , width
        };

        delete body.seed

        if (input_data.seed != "") {
            body = { ...body, seed: parseInt(input_data.seed) }
        }

        this.generateImageButton.classList.add("is-loading");
        const outputElement = document.getElementById("text-to-image-output");
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
                // console.log("text to image img_url",img.url)
                let img_url = img.url;
                if(img_url.startsWith("http") == false)
                    img_url=`${getGatewayUrl()}${img.url}`;
                // console.log("text to image fetaching image from ",img_url)

                const imageCardElement = document.createElement("generated-image-card");
                imageCardElement.setAttribute("index", `${index}`);
                imageCardElement.setAttribute("image-src", `${img_url}`);
                imageCardElement.setAttribute("video-output", `text-to-image-vid-output`);

                outputElement.append(imageCardElement);

            });
        }

        fetch(`${getGatewayUrl()}/text-to-image`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer None`
            },
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

