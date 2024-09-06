import {getBearerToken, getGatewayUrl} from "../../utils";
import BaseComponent from "../BaseComponent.js";
import {PIPELINE_CHANGED_EVENT} from "../../service/GatewayDataFetcher.js";
import {html} from "lit";

export default class SegmentAnything2 extends BaseComponent {
    constructor() {
        super();
        this.models = [];
        this.gateway = getGatewayUrl()
        this.model_id = ''
        this.point_coords = ''
        this.point_labels = ''
        this.usePoint = true
        this.box = ''
        this.mask_input = ''
        this.normalize_coords = true
        this.multimask_output = true
        this.return_logits = true
        this.safety_check = false
        this.seed = ''
        this.successMessage = ""
        this.errorMessage = ""

        this.uploadedImage = null;
        this.imageFile= null;
        this.canvas= null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.endX = 0;
        this.endY = 0;

        this.updateModels = this.updateModels.bind(this);
        this.mouseDownHandler = this.mouseDownHandler.bind(this);
        this.mouseUpHandler = this.mouseUpHandler.bind(this);
        this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
        this.clickHandler = this.clickHandler.bind(this);

    }

    static properties = {
        models: {type: Array},
        gateway: {type: String},
        point_coords: {type: String},
        point_labels: {type: String},
        box: {type: String},
        usePoint: {type: Boolean},
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
            <section data-nav-item="segment-anything-2" class="is-hidden">
                <h3>Segment Anything 2</h3>
                <div class="columns">
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Upload your image and click Segment Anything 2
                            </div>
                            <form enctype="multipart/form-data" @submit=${this._handleSubmit}>
                                ${this.errorMessage ? html`
                                    <div class="notification is-danger">
                                        ${this.errorMessage}
                                    </div>` : ''}
                                <div class="file is-small">
                                    <label class="file-label is-info " for="segment-anything-2-file">
                                        <input class="file-input" type="file" name="segment-anything-2-file" id="segment-anything-2-file"/>
                                        <span class="file-cta">
                                        <span class="file-icon"><i class="fas fa-upload"></i></span>
                                        <span class="file-label"> Choose a file… </span>
                                    </span>
                                        <span class="file-name"> No file uploaded </span>
                                    </label>
                                </div>
                                <div class="field is-grouped">
                                    <div class="control">
                                        <button class="button is-primary" id="submit-prompt">Segment Anything 2</button>
                                    </div>
                                    <progress id="segment-anything-2-progress" class="progress is-hidden" value="0" max="8">0%
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
                                    <label for="PointBox" class="label">Use Point</label>
                                    <div class="control">
                                        <input class="checkbox" type="checkbox" id="usePoint" name="usePoint"
                                               placeholder=""
                                               @input=${this.handleUsePoint} .checked="${this.usePoint}"/>
                                    </div>
                                    <p class="help">Default: on</p>
                                </div>
                                ${this.usePoint ?  html`
                                    <div class="field">
                                        <label for="point_coords" class="label">Point Coordinates</label>
                                        <div class="control">
                                            <input class="input" type="text" id="point_coords" name="point_coords"
                                                   placeholder=""
                                                   @input=${this._handleInputChange} .value="${this.point_coords}"/>
                                        </div>
                                        <p class="help">Optional: [[120,100],[120,50]]</p>
                                    </div>
                                    <div class="field">
                                        <label for="point_labels" class="label">Point Labels</label>
                                        <div class="control">
                                            <input class="input" type="text" id="point_labels" name="point_labels"
                                                   placeholder=""
                                                   @input=${this._handleInputChange} .value="${this.point_labels}"/>
                                        </div>
                                        <p class="help">Optional: [0,1]</p>
                                    </div>
                                `: html`
                                        <div class="field">
                                            <label for="box" class="label">Box</label>
                                            <div class="control">
                                                <input class="input" type="text" id="box" name="box"
                                                       placeholder=""
                                                       @input=${this._handleInputChange} .value="${this.box}"/>
                                            </div>
                                            <p class="help">Optional</p>
                                        </div>
                                        `}
                                <div class="field">
                                    <label for="mask_input" class="label">Mask Input</label>
                                    <div class="control">
                                        <input class="input" type="text" id="mask_input" name="mask_input"
                                               placeholder=""
                                               @input=${this._handleInputChange} .value="${this.mask_input}"/>
                                    </div>
                                    <p class="help">Optional</p>
                                </div>
                                <div class="field">
                                    <label class="label" for="multimask_output">Multimask Output</label>
                                    <div class="control">
                                        <div class="select">
                                            <select id="multimask_output" name="multimask_output"
                                                    @input=${this._handleInputChange} .value="${this.multimask_output}">
                                                <option value="true">true</option>
                                                <option value="false">false</option>
                                            </select>
                                        </div>
                                    </div>
                                    <p class="help">Optional: Default true</p>
                                </div>
                                <div class="field">
                                    <label class="label" for="return_logits">Return Logits</label>
                                    <div class="control">
                                        <div class="select">
                                            <select id="return_logits" name="return_logits"
                                                    @input=${this._handleInputChange} .value="${this.return_logits}">
                                                <option value="false">false</option>
                                                <option value="true">true</option>
                                            </select>
                                        </div>
                                    </div>
                                    <p class="help">Optional: Default true</p>
                                </div>
                                <div class="field">
                                    <label class="label" for="normalize_coords">Normalize Coords</label>
                                    <div class="control">
                                        <div class="select">
                                            <select id="normalize_coords" name="normalize_coords"
                                                    @input=${this._handleInputChange} .value="${this.normalize_coords}">
                                                <option value="false">false</option>
                                                <option value="true">true</option>
                                            </select>
                                        </div>
                                    </div>
                                    <p class="help">Optional: Default true</p>
                                </div>
                                <div class="field">
                                    <label class="label" for="safety_check">Safety Check</label>
                                    <div class="control">
                                        <div class="select">
                                            <select id="safety_check" name="safety_check"
                                                    @input=${this._handleInputChange} .value="${this.safety_check}">
                                                <option value="false">false</option>
                                                <option value="true">true</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="field">
                                    <label class="label" for="seed">Seed</label>

                                    <div class="control">
                                        <input class="input" type="text" id="seed" name="seed" value=""
                                               @input=${this._handleInputChange} .value="${this.seed}"/>
                                    </div>
                                    <p class="help">Optional</p>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div class="card column m-2">
                        <div class="card-content">
                            <div class="content">
                                Your Uploaded image will be displayed here.
                            </div>
                            <canvas id="imageCanvas" style="border:1px solid #000;"></canvas>
                        </div>
                    
                        <div class="card-content">
                            <div class="content">
                                Your Selected Image output will be displayed here.
                            </div>
                            <div id="segment-anything-2-output"></div>
                        </div>
                    </div>
                </div>
            </section>`
    }

    mouseDownHandler(event)  {
        const rect = this.canvas.getBoundingClientRect();
        this.startX = event.clientX - rect.left;
        this.startY = event.clientY - rect.top;
        this.isDragging = true;
    }

    mouseMoveHandler(event)  {
        if (this.isDragging) {
            const rect = this.canvas.getBoundingClientRect();
            const context =this.canvas.getContext("2d");
            this.endX = event.clientX - rect.left;
            this.endY = event.clientY - rect.top;

            // Redraw image to clear previous rectangle
            context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            context.drawImage(this.uploadedImage, 0, 0);

            // Draw the selection rectangle
            context.beginPath();
            context.rect(this.startX, this.startY, this.endX - this.startX, this.endY - this.startY);
            context.strokeStyle = 'red';
            context.lineWidth = 2;
            context.stroke();
            context.closePath();
        }
    }

    mouseUpHandler(event)  {
        this.isDragging = false;

        // Calculate XYXY format
        const x1 = this.startX;
        const y1 = this.startY;
        const x2 = this.endX;
        const y2 = this.endY;

        // Update the coordinates display in XYXY format
        //console.log(`XYXY Format: [${x1.toFixed(2)}, ${y1.toFixed(2)}, ${x2.toFixed(2)}, ${y2.toFixed(2)}]`)
        this.box=`[${x1.toFixed(2)}, ${y1.toFixed(2)}, ${x2.toFixed(2)}, ${y2.toFixed(2)}]`
    }

    clickHandler(event)  {
        event.preventDefault()
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const context =this.canvas.getContext("2d");

        // Clear previous drawings and draw the image again
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        context.drawImage(this.uploadedImage, 0, 0);

        // Mark the selected point
        context.beginPath();
        context.arc(x, y, 5, 0, 2 * Math.PI);
        context.fillStyle = 'red';
        context.fill();
        context.closePath();

        // Store and display the selected point coordinates
        // selectedPoint = { x, y };
        this.point_coords = `[[${x.toFixed(2)},${y.toFixed(2)}]]`
        this.point_labels= '[0]'
        //console.log(` single point : X: ${x}, Y: ${y}`);
    }

    handleUsePoint(e) {
        this.usePoint = e.target.checked === true
        const canvas = document.getElementById('imageCanvas')
        this.updateListeners(canvas);
    }


    updateListeners(canvas) {
        this.box=''
        this.point_labels=''
        this.point_coords=''

        if(this.usePoint){
            //  Handle click event to capture the single point
            canvas.addEventListener('click',this.clickHandler)

            canvas.removeEventListener('mousedown', this.mouseDownHandler);
            canvas.removeEventListener('mousemove', this.mouseMoveHandler);
            canvas.removeEventListener('mouseup', this.mouseUpHandler)
        }
        else {
            canvas.removeEventListener('click',this.clickHandler)
            canvas.addEventListener('mousedown', this.mouseDownHandler);
            canvas.addEventListener('mousemove', this.mouseMoveHandler);
            canvas.addEventListener('mouseup', this.mouseUpHandler)
        }
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
        const imageFileUpload = document.getElementById("segment-anything-2-file")
        const canvas = document.getElementById('imageCanvas')
        const context = canvas.getContext('2d');

        imageFileUpload.onchange = (event) => {
            if (imageFileUpload.files.length > 0) {
                const fileName = this.querySelector(".file-name");
                fileName.textContent = imageFileUpload.files[0].name;

                const file = event.target.files[0];
                this.imageFile = file;
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            context.drawImage(img, 0, 0);
                            this.uploadedImage = img;
                            this.canvas = canvas;
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);

                    this.updateListeners(canvas);
                }
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
        this.segmentAnything2Image(e.target);
    }

    updateModels(e) {
        const pipelines = e.detail;
        const filteredPipelines = pipelines
            .filter(pipeline => pipeline.name.startsWith("Segment Anything 2"))
            .map(pipeline => pipeline.models.sort((a, b) => b.Warm - a.Warm))

        if (filteredPipelines.length > 0) {
            [this.models] = filteredPipelines;
        } else {
            this.models = []; // Handle the case where no models were found
        }
    }

    segmentAnything2Image(form) {
        let formData = new FormData(form);
        const input_data = Object.fromEntries(formData.entries());
        const generateImageButton = form.querySelector("button")
        let errors = [];

        let image = input_data['segment-anything-2-file'];

        if (image === undefined || image.size === 0) {
            errors.push("image must be uploaded")
        }

        let safety_check = input_data.safety_check === 'true';
        let multimask_output = input_data.multimask_output === 'true';
        let return_logits = input_data.return_logits === 'true';
        let normalize_coords = input_data.normalize_coords === 'true';

        if (errors.length > 0) {
            let errorMsg = errors.map(e => {
                return (e + "\n")
            })
            this.errorMessage = "errors occurred: \n" + errorMsg;
        } else {
            let body = new FormData();
            body.append("image", image);
            body.append("model_id", input_data.model_id);
            if (input_data.point_coords   !== undefined && input_data.point_coords !== "") {
                body.append("point_coords", input_data.point_coords);
            }
            if (input_data.point_labels  !== undefined && input_data.point_labels!== "") {
                body.append("point_labels", input_data.point_labels);
            }
            if (input_data.box  !== undefined && input_data.box !== "") {
                body.append("box", input_data.box);
            }
            if (input_data.mask_input !== "") {
                body.append("mask_input", input_data.mask_input);
            }

            body.append("multimask_output", multimask_output);
            body.append("return_logits", return_logits);
            body.append("normalize_coords", normalize_coords);

            body.append("safety_check", safety_check);
            if (input_data.seed !== "") {
                body.append("seed", input_data.seed);
            }

            generateImageButton.classList.add("is-loading");

            const outputElement = document.getElementById("segment-anything-2-output");
            const handleImageGeneration = async (data) => {
                console.log("[SegmentAnything2] RESPONSE ",data)
                generateImageButton.classList.remove("is-loading");
                outputElement.textContent = "";

                if (data.error) {
                    this.errorMessage = "failed generating an image, please try again";
                } else {
                    const masks =  JSON.parse(data.masks);
                    const scores =  JSON.parse(data.scores);

                    console.log(" masks ",masks.length)
                    console.log(" scores ",scores.length)

                    outputElement.textContent='';

                    // Assuming 'scores' is an array of scores for each mask
                    const threshold = 0.2;  // Define a threshold score
                    const filteredMasks = masks.filter((mask, index) => {
                        console.log("mask score ",scores[index],scores[index] >= threshold)
                        return scores[index] >= threshold
                    }
                    );
                    const topN = 10;  // Number of top masks to render
                    const topMasks = filteredMasks.slice(0, topN);

                    const drawImageWithMask=(maskData)=> {
                        const canvas = document.createElement('canvas')
                        const ctx = canvas.getContext('2d');
                        outputElement.appendChild(canvas);

                        const reader = new FileReader();
                        reader.onload = function (event) {
                            const img = new Image();
                            img.src = event.target.result;

                            img.onload = function () {
                                const width = img.width;
                                const height = img.height;

                                // Set canvas dimensions to match the image
                                canvas.width = width;
                                canvas.height = height;

                                // Draw the uploaded image onto the canvas
                                ctx.drawImage(img, 0, 0, width, height);

                                // Get the image data for manipulation
                                const imageData = ctx.getImageData(0, 0, width, height);
                                const data = imageData.data; // Pixel data array

                                // Loop through the mask data and apply a transparent red tint on the highlighted areas
                                for (let y = 0; y < maskData.length; y++) {
                                    for (let x = 0; x < maskData[0].length; x++) {
                                        const pixelIndex = (y * width + x) * 4; // 4 values per pixel (R, G, B, A)

                                        // Get the mask value (assume the mask is normalized between 0 and 1)
                                        const maskValue = maskData[y][x];

                                        // Apply a transparent red tint for maskValue > threshold
                                        if (maskValue > 0.5) { // Example threshold for selection
                                            // Get the original color values from the image
                                            const originalRed = data[pixelIndex];
                                            const originalGreen = data[pixelIndex + 1];
                                            const originalBlue = data[pixelIndex + 2];

                                            // Blend the original color with red tint (transparency)
                                            const redTint = 255; // Red component for tint
                                            const alpha = 0.4; // Transparency level (0 = fully transparent, 1 = fully opaque)

                                            // Blend the original pixel color with the red tint
                                            data[pixelIndex] = originalRed * (1 - alpha) + redTint * alpha;  // Red channel (tinted)
                                            data[pixelIndex + 1] = originalGreen * (1 - alpha);              // Green channel (unchanged)
                                            data[pixelIndex + 2] = originalBlue * (1 - alpha);               // Blue channel (unchanged)
                                            data[pixelIndex + 3] = 255;                                      // Alpha (fully opaque)
                                        }
                                    }
                                }

                                // Put the modified image data back onto the canvas
                                ctx.putImageData(imageData, 0, 0);
                            };
                        };

                        // Read the image file as a data URL
                        reader.readAsDataURL(this.imageFile);
                    }
                    topMasks.forEach(mask=>drawImageWithMask(mask));
                }
            }

            fetch(`${getGatewayUrl()}/segment-anything-2`, {
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
                    await handleImageGeneration(data);
                })
                .catch((err) => {
                    console.error("failed generating segment-anything-2 image", err)
                    this.errorMessage = "Failed to generate image, please try again.";
                    generateImageButton.classList.remove("is-loading");
                })
        }
        //reset and remaining error messages
        setTimeout(() => {
            this.successMessage = '';
            this.errorMessage = '';
        }, 3000);
    }
}