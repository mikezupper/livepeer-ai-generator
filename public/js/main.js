// src/utils.js
var getGatewayUrl = () => {
  const gw = localStorage.getItem("gatewayUrl");
  console.log("[getGatewayUrl] returning url = ", gw);
  return gw;
};
var setGatewayUrl = (gatewayUrl) => {
  console.log("[setGatewayUrl] setting url = ", gatewayUrl);
  localStorage.setItem("gatewayUrl", gatewayUrl);
  console.log("[setGatewayUrl] completed.");
};

// src/GenerateImageForm.js
var generateImageFormTemplate = document.createElement("template");
generateImageFormTemplate.innerHTML = `
<form id="generate-image">
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
`;
var GenerateImgeForm = class extends HTMLElement {
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
    const imageForm = this.template.getElementById("generate-image");
    const imageButton = this.template.getElementById("submit-prompt");
    const outputElement = document.getElementById("image-output");
    const videoOutputElement = document.getElementById("video-output");
    const imageErrorElement = document.getElementById("generate-image-errors");
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
    };
    const num_between = (x, min, max) => {
      return x >= min && x <= max;
    };
    let imgProgressElement = this.template.getElementById("img-progress");
    const submitPrompt = async (e) => {
      e.preventDefault();
      outputElement.innerHTML = "";
      videoOutputElement.innerHTML = "";
      imageErrorElement.classList.add("is-hidden");
      let errors = new Array();
      var formData = new FormData(imageForm);
      const input_data = Object.fromEntries(formData.entries());
      let height = parseInt(input_data.height);
      if (isNaN(height) || num_between(height, 1, 1024) == false) {
        errors.push("height is must be a number between 1 and 1024");
      }
      let width = parseInt(input_data.width);
      if (isNaN(width) || num_between(width, 1, 1024) == false) {
        errors.push("width is must be a number between 1 and 1024");
      }
      let guidance_scale = parseInt(input_data.guidance_scale);
      if (isNaN(guidance_scale)) {
        errors.push("guidance_scale is must be a number");
      }
      let num_inference_steps = parseInt(input_data.num_inference_steps);
      if (isNaN(num_inference_steps) || num_inference_steps <= 1) {
        errors.push("num_inference_steps is must be a number greater than 1");
      }
      let num_images_per_prompt = parseInt(input_data.num_images_per_prompt);
      if (isNaN(num_images_per_prompt) || num_images_per_prompt > 10) {
        errors.push("Max of 10 Images");
      }
      if (!input_data.prompt) {
        errors.push("Please enter a prompt");
      }
      if (errors.length > 0) {
        let errorMsg = errors.map((e2) => {
          return e2 + "\n";
        });
        imageErrorElement.textContent = "errors occurred: \n" + errorMsg;
        imageErrorElement.classList.remove("is-hidden");
        return;
      }
      if (this.gatewayUrl != input_data.gatewayUrl) {
        console.log("[GenerateImgeForm::submitPrompt] user changed the gateway url via form input");
        setGatewayUrl(input_data.gatewayUrl);
        this.gatewayUrl = input_data.gatewayUrl;
      }
      let body = {
        ...input_data,
        guidance_scale,
        num_inference_steps,
        num_images_per_prompt,
        height,
        width
      };
      delete body.seed;
      if (input_data.seed != "") {
        body = { ...body, seed: parseInt(input_data.seed) };
      }
      imageButton.classList.add("is-loading");
      imgProgressElement.classList.remove("is-hidden");
      let units_checked = 0;
      const updateProgressBar = () => {
        units_checked++;
        imgProgressElement.value = units_checked;
      };
      const progressBarInterval2 = setInterval(updateProgressBar, 1e3);
      updateProgressBar();
      fetch(`${getGatewayUrl()}/text-to-image`, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json"
        }
      }).then((resp) => resp.json()).then(async (data) => {
        await handleImageGeneration(data);
        clearInterval(progressBarInterval2);
        imgProgressElement.classList.add("is-hidden");
      }).catch((err) => {
        console.error("[GenerateImgeForm::submitPrompt]", err);
        imageErrorElement.textContent = "Failed to generate image, please try again.";
        imageButton.classList.remove("is-loading");
        imageErrorElement.classList.remove("is-hidden");
        imgProgressElement.classList.add("is-hidden");
        clearInterval(progressBarInterval2);
      });
    };
    this.template.getElementById("generate-image").addEventListener("submit", submitPrompt);
    this.appendChild(this.template);
  }
  // attributeChangedCallback(name, oldValue, newValue) {
  // }
};

// src/GeneratedImgeCard.js
var generateCardTemplate = document.createElement("template");
generateCardTemplate.innerHTML = `
<div class="card"><img class="card-image">
    <div class="card-content">
        <button class="is-primary button">Generate Video</button>
        <progress class="progress is-hidden" value="0" max="120">0%</progress>
        <details>
            <summary>Advanced</summary>
            <form>
                <div class="field">
                  <label class="label" for="model_id">Model</label>

                  <div class="control">
                      <div class="select">
                          <select id="model_id" name="model_id">
                              <option value="stabilityai/stable-video-diffusion-img2vid-xt-1-1">
                              stabilityai/stable-video-diffusion-img2vid-xt-1-1</option>
                          </select>
                      </div>
                  </div>
                </div>
                <div class="field">
                    <label class="label" for="width">Width</label>
                    <div class="control">
                        <input class="input" type="text" id="width" name="width" value="1024">
                    </div>
                    <p class="help">Default: 1024</p>
                </div>
                <div class="field">
                    <label class="label" for="height">Height</label>
                    <div class="control">
                        <input class="input" type="text" id="height" name="height" value="576">
                    </div>
                    <p class="help">Default: 576</p>
                </div>
                <div class="field">
                    <label for="noise_aug_strength" class="label">Noise Aug Strength</label>
                    <div class="control">
                        <input class="input" type="text" id="noise_aug_strength" name="noise_aug_strength"
                            placeholder="0.065" value="0.065">
                    </div>
                </div>
                <div class="field">
                    <label for="motion_bucket_id" class="label">Motion Bucket Id</label>
                    <div class="control">
                        <input class="input" type="text" id="motion_bucket_id" name="motion_bucket_id" placeholder="127"
                            value="127">
                    </div>
                </div>
                <div class="field">
                    <label for="fps" class="label">Frames Per Second</label>
                    <div class="control">
                        <input class="input" type="text" id="fps" name="fps" placeholder="8"
                            value="8">
                    </div>
                    <p class="help">Default: 8</p>
                </div>
            </form>
        </details>
    </div>
</div>
`;
var GeneratedImgeCard = class extends HTMLElement {
  static observedAttributes = ["id", "image-src"];
  constructor() {
    super();
    console.log("[GeneratedImgeCard::constructor]");
    this.template = generateCardTemplate.content.cloneNode(true);
  }
  connectedCallback() {
    console.log("[GeneratedImgeCard::connectedCallback]");
    this.appendChild(this.template);
  }
  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`[GeneratedImgeCard::attributeChangedCallback] name = ${name} oldValue=${oldValue} newValue=${newValue}`);
    const card = this.template.querySelector(".card");
    const generateVideoButton = card.querySelector("button");
    const cardImage = card.querySelector(".card-image");
    const videoErrorElement = document.getElementById("generate-video-errors");
    let vidProgressElement = this.template.querySelector("progress");
    if (name == "image-src") {
      cardImage.src = newValue;
    }
    generateVideoButton.onclick = async (event) => {
      event.preventDefault();
      const formElement = card.querySelector("form");
      generateVideoButton.classList.add("is-loading");
      videoErrorElement.classList.add("is-hidden");
      vidProgressElement.classList.remove("is-hidden");
      let img_url = cardImage.src;
      console.log("main: img_url ",img_url)
      const response = await fetch(img_url);
      const blob = await response.blob();
      const filename = img_url.substring(img_url.lastIndexOf("/") + 1);
      const file = new File([blob], filename);
      const formData = new FormData(formElement);
      formData.append("image", file);
      try {
        let units_checked = 0;
        const updateProgressBar = () => {
          units_checked = units_checked + 5;
          vidProgressElement.value = units_checked;
        };
        const progressBarInterval2 = setInterval(updateProgressBar, 5e3);
        updateProgressBar();
        const resp = await fetch(`${getGatewayUrl()}/image-to-video`, {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          body: formData
        });
        const data = await resp.json();
        generateVideoButton.classList.remove("is-loading");
        clearInterval(progressBarInterval2);
        vidProgressElement.classList.add("is-hidden");
        const vid_url = data?.images[0]?.url;
        console.log(" WTF images !!!! ",img);

        let video_url = `${getGatewayUrl()}${vid_url}`;
        const videoElement = document.createElement("video");
        videoElement.setAttribute("src", video_url);
        videoElement.setAttribute("type", "video/mp4");
        videoElement.setAttribute("autoplay", "true");
        videoElement.setAttribute("controls", "true");
        document.getElementById("video-output").prepend(videoElement);
      } catch (e) {
        console.error(`[GeneratedImgeCard::generateVideoButton.onclick]`, e);
        videoErrorElement.textContent = "failed to generate video, please try again";
        generateVideoButton.classList.remove("is-loading");
        videoErrorElement.classList.remove("is-hidden");
        clearInterval(progressBarInterval);
        vidProgressElement.classList.add("is-hidden");
      }
    };
    if (name == "index") {
      card.setAttribute("id", newValue);
    }
  }
};

// src/main.js
console.log("[main]");
if (!getGatewayUrl()) {
  console.log("[main] gatewayUrl NOT in local storage...setting the default now");
  const gatewayUrl = "https://dream-gateway.livepeer.cloud";
  setGatewayUrl(gatewayUrl);
  console.log("[main] default gateway set in localStorage ", gatewayUrl);
}
console.log("[main] registering custom elements");
customElements.define("generated-image-card", GeneratedImgeCard);
customElements.define("generate-image-form", GenerateImgeForm);
