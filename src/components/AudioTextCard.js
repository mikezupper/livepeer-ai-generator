import {getGatewayUrl} from "../utils";

const generateCardTemplate = document.createElement("template");
generateCardTemplate.innerHTML = `
<div class="tags">
    <p>
        <span class="tag is-primary"></span>&nbsp;&nbsp;<span class="tag" ></span>
    </p>
</div>
`

export default class AudioTextCard extends HTMLElement {
    static observedAttributes = ["timestamp", "text"];

    constructor() {
        super();
        // console.log("[AudioTextCard::constructor]");
        this.template = generateCardTemplate.content.cloneNode(true);
    }

    connectedCallback() {
        // console.log("[AudioTextCard::connectedCallback]");
        this.appendChild(this.template);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // console.log(`[AudioTextCard::attributeChangedCallback] name = ${name} oldValue=${oldValue} newValue=${newValue}`);
        const tags = this.template.querySelector('.tags');
        const spans = tags.querySelectorAll('span');

        if (name === "timestamp") {
            spans[0].innerText = formatTime(newValue)
        }

        if (name === "text") {
            spans[1].innerText = newValue
        }
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Pad single digit minutes and seconds with a leading zero
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = remainingSeconds.toString().padStart(2, '0');

    return `${paddedMinutes}:${paddedSeconds}`;
}