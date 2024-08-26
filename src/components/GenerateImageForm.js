import { getGatewayUrl, setGatewayUrl, num_between, getBearerToken } from "../utils";
import BaseComponent from "./BaseComponent.js";

const generateImageFormTemplate = document.createElement("template");
generateImageFormTemplate.innerHTML = `
<form id="generate-image">
    <div class="notification is-danger is-hidden" id="generate-image-errors"></div>
    <div class="field">
        <label for="prompt" class="label">Prompt</label>
        <div class="control">
            <textarea class="textarea" id="prompt" name="prompt" placeholder="Type in your prompt"></textarea>
        </div>
    </div>

    <div class="field is-grouped">
        <div class="control">
            <button class="button is-primary" id="submit-prompt">Generate</button>
        </div>
        <progress id="img-progress" class="progress is-hidden" value="0" max="8">0%</progress>
    </div>

    <details>
        <summary>Advanced</summary>
        <div class="field">
          <label class="label" for="gatewayUrl">Gateway URL</label>

          <div class="control">
              <input class="input" type="text" id="gatewayUrl" name="gatewayUrl"
                  value="https://dream-gateway.livepeer.cloud" />
          </div>
          <p class="help">Default: https://dream-gateway.livepeer.cloud</p>
        </div>
        <div class="field">
            <label class="label" for="model_id">Model</label>

            <div class="control">
                <div class="select">
                    <select id="model_id" name="model_id">
                        <option value="SG161222/RealVisXL_V4.0">
                            SG161222/RealVisXL_V4.0</option>
                        <option selected value="SG161222/RealVisXL_V4.0_Lightning">
                            SG161222/RealVisXL_V4.0_Lightning</option>
                        <option value="ByteDance/SDXL-Lightning" >ByteDance/SDXL-Lightning
                        </option>
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
                <input class="input" type="text" id="num_images_per_prompt" name="num_images_per_prompt" value="2" />
            </div>
            <p class="help">Max of 10</p>
        </div>

        <div class="field">
            <label class="label" for="num_inference_steps"># of Inference Steps</label>

            <div class="control">
                <input class="input" type="text" id="num_inference_steps" name="num_inference_steps" value="6" />
            </div>
            <p class="help">Optional</p>
        </div>

        <div class="field">
            <label class="label" for="guidance_scale">Guidance Scale</label>

            <div class="control">
                <input class="input" type="text" id="guidance_scale" name="guidance_scale" value="2" />
            </div>
            <p class="help">Optional</p>
        </div>

        <div class="field">
            <label class="label" for="seed">Seed</label>

            <div class="control">
                <input class="input" type="text" id="seed" name="seed" value="" />
            </div>
            <p class="help">Optional</p>
        </div>
<!--
        <div class="field">
            <label class="label" for="scheduler">Scheduler</label>

            <div class="control">
                <div class="select">
                    <select id="scheduler" name="scheduler">
                        <option value="DDIM">DDIM</option>
                        <option value="DPMSolverMultistep">
                            DPMSolverMultistep
                        </option>
                        <option value="HeunDiscrete">HeunDiscrete</option>
                        <option value="KarrasDPM">KarrasDPM</option>
                        <option value="K_EULER_ANCESTRAL">
                            K_EULER_ANCESTRAL
                        </option>
                        <option value="K_EULER" selected>K_EULER</option>
                        <option value="PNDM">PNDM</option>
                        <option value="DPM++2MSDE">DPM++2MSDE</option>
                    </select>
                </div>
            </div>
        </div>
        -->
        
    </details>
</form>
`

export default class GenerateImgeForm extends BaseComponent {
  // static observedAttributes = ["id", "image-src"];

  constructor() {
    super();

    console.log("[GenerateImgeForm::constructor]");
    this.template = generateImageFormTemplate.content.cloneNode(true);
  }

  connectedCallback() {

    console.log("[GenerateImgeForm::connectedCallback] add gateway url to form input");
    this.gatewayUrl = getGatewayUrl();
    this.template.getElementById("gatewayUrl").value = this.gatewayUrl;

    const imageForm = this.template.getElementById("generate-image")
    const imageButton = this.template.getElementById("submit-prompt")
    const imageErrorElement = this.template.getElementById("generate-image-errors");

    const outputElement = document.getElementById("image-output");
    const videoOutputElement = document.getElementById("video-output");

    const handleImageGeneration = async (data) => {

      imageButton.classList.remove("is-loading");
      outputElement.textContent = "";

      if (data.error) {
        imageErrorElement.classList.remove("is-hidden");
        imageErrorElement.textContent = "failed generating an image, please try again";
        return;
      }

      const { images } = data;
      images.forEach(async (img, index) => {
        let img_url = `${getGatewayUrl()}${img.url}`;
        const imageCardElement = document.createElement("generated-image-card");
        imageCardElement.setAttribute("index", `${index}`);
        imageCardElement.setAttribute("image-src", `${img_url}`);

        outputElement.append(imageCardElement);

      });
    }

    let imgProgressElement = this.template.getElementById('img-progress');

    const submitPrompt = async (e) => {
      e.preventDefault();
      outputElement.innerHTML = '';
      videoOutputElement.innerHTML = '';

      imageErrorElement.classList.add("is-hidden");

      let errors = new Array();
      // POST to gateway
      var formData = new FormData(imageForm);
      const input_data = Object.fromEntries(formData.entries());
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

      if (!input_data.prompt) {
        errors.push("Please enter a prompt")
      }

      if (errors.length > 0) {
        let errorMsg = errors.map(e => { return (e + "\n") })
        imageErrorElement.textContent = "errors occurred: \n" + errorMsg;
        imageErrorElement.classList.remove("is-hidden");
        return
      }
      if (this.gatewayUrl != input_data.gatewayUrl) {
        console.log("[GenerateImgeForm::submitPrompt] user changed the gateway url via form input");
        setGatewayUrl(input_data.gatewayUrl)
        this.gatewayUrl = input_data.gatewayUrl;
      }

      let body = {
        ...input_data
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


      imageButton.classList.add("is-loading");

      imgProgressElement.classList.remove("is-hidden");

      // normally 3-4 seconds to generate an image
      let units_checked = 0;
      const updateProgressBar = () => {
        units_checked++;
        imgProgressElement.value = units_checked;
      }
      const progressBarInterval = setInterval(updateProgressBar, 1000);
      updateProgressBar();
      fetch(`${getGatewayUrl()}/text-to-image`, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getBearerToken()}`
        }
      })
        .then((resp) => resp.json())
        .then(async (data) => {
          await handleImageGeneration(data);
          clearInterval(progressBarInterval);
          imgProgressElement.classList.add("is-hidden");
        })
        .catch((err) => {
          console.error("[GenerateImgeForm::submitPrompt]", err)
          imageErrorElement.textContent = "Failed to generate image, please try again.";
          imageButton.classList.remove("is-loading");
          imageErrorElement.classList.remove("is-hidden");
          imgProgressElement.classList.add("is-hidden");
          clearInterval(progressBarInterval);
        });
    };

    this.template
      .getElementById("generate-image")
      .addEventListener("submit", submitPrompt);

    this.appendChild(this.template);
  }
}