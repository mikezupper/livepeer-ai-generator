const generateCardTemplate = document.createElement("template");
generateCardTemplate.innerHTML = `
 <div class="container mt-5">
  <div class="box p-5">
    <div class="content has-text-centered">
      <audio controls class="mb-4">
        <source src="#" type="audio/wav">
        Your browser does not support the audio element.
      </audio>
    </div>
  </div>
`

export default class TextToSpeechOutputCard extends HTMLElement {
    static observedAttributes = ["audio-src"];

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
        const audio = this.template.querySelector('audio');
        if (name === "audio-src") {
            audio.setAttribute("src",newValue);
        }
    }
}
