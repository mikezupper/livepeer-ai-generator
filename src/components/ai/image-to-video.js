import { getGatewayUrl, num_between } from "../../utils";

const imageToVideoTemplate = document.createElement("template")
imageToVideoTemplate.innerHTML = `
<section data-nav-item="image-to-video" class="is-hidden">
<h3>Image to Video</h3>
<div class="columns">
    <div class="card column m-2">
        <div class="card-content">
            <div class="content">
                Fill out your input and click generate
            </div>
            <div class="notification is-info is-hidden" id="image-to-video-success"></div>

            <form id="image-to-video-form" enctype="multipart/form-data">
                            <div class="notification is-danger is-hidden" id="image-to-video-errors"></div>
                            <div class="file is-small">
                                <label class="file-label is-info " for="image-to-video-file">
                                    <input class="file-input" type="file" name="image-to-video-file" id="image-to-video-file" />
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
                                            <option value="stabilityai/stable-video-diffusion-img2vid-xt-1-1">
                                                stabilityai/stable-video-diffusion-img2vid-xt-1-1
                                            </option>
                                        </select>
                                    </div>
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
                                <label class="label" for="fps">Frames per Second</label>

                                <div class="control">
                                    <input class="input" type="text" id="fps" name="fps" value="6" />
                                </div>
                                <p class="help">Default: 6</p>
                            </div>

                            <div class="field">
                                <label class="label" for="motion_bucket_id">Motion Bucket Id</label>

                                <div class="control">
                                    <input class="input" type="text" id="motion_bucket_id" name="motion_bucket_id"
                                        value="127" />
                                </div>
                                <p class="help">Default: 127</p>
                            </div>

                            <div class="field">
                                <label class="label" for="noise_aug_strength">Noise Aug Strength</label>

                                <div class="control">
                                    <input class="input" type="text" id="noise_aug_strength" name="noise_aug_strength"
                                        value=".002" />
                                </div>
                                <p class="help">Default: ???</p>
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
</section>
`
export default class ImageToVideo extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.template = imageToVideoTemplate.content.cloneNode(true); // true means deep clone
        this.appendChild(this.template);
        this.form = this.querySelector("form");

        const imageFileUpload = document.getElementById("image-to-video-file")
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
        this.success_notif = document.getElementById("image-to-video-success")
        this.error_notif = document.getElementById("image-to-video-errors")
        this.generateImageButton = this.form.querySelector("button")
    }



    generateImage() {
        this.error_notif.classList.add("is-hidden");
        this.success_notif.classList.add("is-hidden");

        let formData = new FormData(this.form);
        const input_data = Object.fromEntries(formData.entries());

        let errors = new Array();

        let image = input_data['image-to-video-file'];

        if (image == undefined || image.size == 0) {
            errors.push("image must be uploaded")
        }

        let height = parseInt(input_data.height)

        if (isNaN(height) || num_between(height, 1, 1024) == false) {
            errors.push("height is must be a number between 1 and 1024")
        }

        let width = parseInt(input_data.width)

        if (isNaN(width) || num_between(width, 1, 1024) == false) {
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

        let safety_check = input_data.safety_check == 'true';

        if (errors.length > 0) {
            let errorMsg = errors.map(e => { return (e + "\n") })
            this.error_notif.textContent = "errors occurred: \n" + errorMsg;
            this.error_notif.classList.remove("is-hidden");
            return
        }
        let body = new FormData();
        body.append("image", image);
        body.append("model_id", input_data.model_id);
        body.append("noise_aug_strength", noise_aug_strength);
        body.append("motion_bucket_id", motion_bucket_id);
        body.append("height", height);
        body.append("width", width);
        body.append("strength", strength);
        body.append("safety_check", safety_check);

        if (input_data.seed != "") {
            body.append("seed", input_data.seed);
        }

        this.generateImageButton.classList.add("is-loading");
        const outputElement = document.getElementById("image-to-video-output");
        const handleVideoGeneration = async (data) => {

            this.generateImageButton.classList.remove("is-loading");
            // outputElement.textContent = "";

            if (data.error) {
                this.error_notif.classList.remove("is-hidden");
                this.error_notif.textContent = "failed generating a video, please try again";
                return;
            }
            let vid_url = data?.images[0]?.url;
            // console.log("image-to-video vid_url",vid_url)

            if(vid_url.startsWith("http") == false)
                vid_url=`${getGatewayUrl()}${vid_url}`;
            // console.log("image-to-image fetching image from ",vid_url)

            const videoElement = document.createElement("video");
            videoElement.setAttribute("src", vid_url);
            videoElement.setAttribute("type", "video/mp4");
            videoElement.setAttribute("autoplay", "true");
            videoElement.setAttribute("controls", "true");
            outputElement.prepend(videoElement);
        }

        fetch(`${getGatewayUrl()}/image-to-video`, {
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
                await handleVideoGeneration(data);
            })
            .catch((err) => {
                console.error("[ImageToVideo ]", err)
                this.error_notif.textContent = "Failed to generate image, please try again.";
                this.generateImageButton.classList.remove("is-loading");
                this.error_notif.classList.remove("is-hidden");
            });
    }
}

