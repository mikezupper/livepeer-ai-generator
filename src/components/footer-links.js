const footerLinksTemplate = document.createElement("template");
const currentDate = new Date();

footerLinksTemplate.innerHTML = `
<footer>
        <div class="content has-text-centered">
          &copy; The Zoop Troop, Inc ${currentDate.getFullYear()}
        </div>
</footer>
`;

export default class FooterLinks extends HTMLElement {
  constructor() {
    super();

    // const shadowRoot = this.attachShadow({ mode: "open" });
    this.appendChild(footerLinksTemplate.content.cloneNode(true)); // true means deep clone
  }
}
