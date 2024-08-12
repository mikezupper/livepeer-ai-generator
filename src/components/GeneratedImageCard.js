import { getGatewayUrl } from "../utils";

const generateCardTemplate = document.createElement("template");
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
`

export default class GeneratedImageCard extends HTMLElement {
  static observedAttributes = ["id", "image-src", "video-output"];

  constructor() {
    super();
    console.log("[GeneratedImageCard::constructor]");
    this.template = generateCardTemplate.content.cloneNode(true);
  }

  connectedCallback() {
    console.log("[GeneratedImageCard::connectedCallback]");
    this.appendChild(this.template);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`[GeneratedImageCard::attributeChangedCallback] name = ${name} oldValue=${oldValue} newValue=${newValue}`);
    const card = this.template.querySelector('.card');
    const generateVideoButton = card.querySelector('button');
    const cardImage = card.querySelector('.card-image');

    if (name == "video-output") {
      this.videoOutput = document.getElementById(newValue);
    }

    if (name == "image-src") {
      cardImage.src = newValue;
    }

    if(this.videoOutput && cardImage.src ){
      generateVideoButton.onclick = async (event) => {
        event.preventDefault();
        const formElement = card.querySelector('form');
        generateVideoButton.classList.add("is-loading");

        let img_url = cardImage.src;
        const response = await fetch(img_url);
        const blob = await response.blob();
        const filename = img_url.substring(img_url.lastIndexOf("/") + 1);
        const file = new File([blob], filename);

        const formData = new FormData(formElement);
        formData.append("image", file);

        try {
          const resp = await fetch(`${getGatewayUrl()}/image-to-video`, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
              headers: {
              Authorization: "Bearer None"
            },
            body: formData,
          });
          const data = await resp.json();
          generateVideoButton.classList.remove("is-loading");
          let vid_url = data?.images[0]?.url;
          // console.log("image to video url",vid_url)
          if(vid_url.startsWith("http") == false)
            vid_url=`${getGatewayUrl()}${vid_url}`;
          // console.log("image to video fetching image from ",vid_url)

          // let video_url = `${getGatewayUrl()}${vid_url}`;

          const videoElement = document.createElement("video");
          videoElement.setAttribute("src", vid_url);
          videoElement.setAttribute("type", "video/mp4");
          videoElement.setAttribute("autoplay", "true");
          videoElement.setAttribute("controls", "true");
          this.videoOutput.prepend(videoElement);
        }
        catch (e) {
          console.error(`[GeneratedImageCard::generateVideoButton.onclick]`, e);
          generateVideoButton.classList.remove("is-loading");
        }
      }
    }

    if (name == "index") {
      card.setAttribute("id", newValue);
    }
  }
}