const generateCardTemplate = document.createElement("template");
generateCardTemplate.innerHTML = `
 <div class="container mt-5">
  <div class="box p-5">
    <div class="content has-text-centered">
    <p></p>
    </div>
  </div>
`

export default class ImageTextOutputCard extends HTMLElement {
    static observedAttributes = ["text"];

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
        const text = this.template.querySelector('p');
        if (name === "text") {
            text.textContent=newValue;
        }
    }
}
