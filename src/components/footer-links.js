import BaseComponent from "./BaseComponent.js";

const footerLinksTemplate = document.createElement("template");
const currentDate = new Date();

footerLinksTemplate.innerHTML = `
<footer>
        <div class="content has-text-centered">
          &copy; Livepeer.Cloud SPE ${currentDate.getFullYear()}
        </div>
</footer>
`;

export default class FooterLinks extends BaseComponent {
  constructor() {
    super();

    // const shadowRoot = this.attachShadow({ mode: "open" });
    this.appendChild(footerLinksTemplate.content.cloneNode(true)); // true means deep clone
  }
}
