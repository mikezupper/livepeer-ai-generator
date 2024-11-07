import {fromEvent} from "rxjs";
import {getDefaultNavLink, getGatewayUrl, setDefaultNavLink} from "../utils";
import BaseComponent from "./BaseComponent.js";
import {html} from "lit";

export const NAV_LINKS_CLICKED_EVENT = "NavLinksClicked"

export default class NavLinks extends BaseComponent {
    constructor() {
        super();
    }

    // Lit Lifecycle function to ensure render() has executed prior to running this logic
    firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);
        //console.log('[NavLinks::firstUpdated] Component and all its elements have been rendered and loaded!');
        const navLinks = document.getElementById("navLinks")
        //console.log(`[NavLinks::firstUpdated]`, navLinks)
        if (getGatewayUrl())
            navLinks.defaultNavLinkSelection();

        let navLinksClicked$ = fromEvent(this, NAV_LINKS_CLICKED_EVENT);

        navLinksClicked$
            .subscribe(e => {
                //console.log(`[NavLinks::firstUpdated ] subscribe`, e)

                const {type} = e.detail;

                let sectionLinks = document.querySelectorAll(`section[data-nav-item]`);
                //console.log(`[NavLinks::firstUpdated ] subscribe  sections `, sectionLinks)

                sectionLinks.forEach((link) => {
                    //console.log(`[NavLinks::firstUpdated] subscribe section `, link, type)

                    if (link.dataset.navItem.startsWith(type))
                        link.classList.remove("is-hidden")
                    else
                        link.classList.add("is-hidden")
                });
            });
        this.defaultNavLinkSelection();

        const $navbarBurgers = Array.prototype.slice.call(this.querySelectorAll('.navbar-burger'), 0);
        // Add a click event on each of them
        $navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {
                //console.log(`[NavLinks ] click handler`)

                // Get the target from the "data-target" attribute
                const target = el.dataset.target;
                const $target = this.querySelector(`#${target}`);

                // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
                el.classList.toggle('is-active');
                $target.classList.toggle('is-active');
            });
        });

        const links = this.querySelectorAll(".navbar-item");
        links.forEach((link) => {
            link.addEventListener('click', (e) => {
                const {type} = e.target?.dataset;
                this.dispatchNavLinkSelection(type)
                setDefaultNavLink(type);
            });
        });
    }

    render() {
        return html`
            <nav class="navbar" role="navigation" aria-label="main navigation">
                <a role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="mainNavBar">
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                </a>

                <div id="mainNavBar" class="navbar-menu ">
                    <div class="navbar-start">
                        <a class="navbar-item" id="nav-links-0" data-type="text-to-image">
                            Text to Image
                        </a>
                        <a class="navbar-item" id="nav-links-1" data-type="image-to-image">
                            Image to Image
                        </a>
                        <a class="navbar-item" id="nav-links-2" data-type="image-to-video">
                            Image to Video
                        </a>
                        <a class="navbar-item" id="nav-links-2" data-type="audio-to-text">
                            Audio to Text
                        </a>
                        <a class="navbar-item" id="nav-links-3" data-type="text-to-speech">
                            Text to Speech
                        </a>
                        <a class="navbar-item" id="nav-links-3" data-type="upscale">
                            Upscale an Image
                        </a>
                        <a class="navbar-item" id="nav-links-3" data-type="segment-anything-2">
                            Segment Anything 2
                        </a>
                        <a class="navbar-item" id="nav-links-3" data-type="llm">
                            LLM
                        </a>
                        <a class="navbar-item" id="nav-links-4" data-type="network-capabilities">
                            Network Capabilities
                        </a>
                        <a class="navbar-item" id="nav-links-4" data-type="settings">
                            Settings
                        </a>
                    </div>
                </div>
            </nav>`
    }

    defaultNavLinkSelection() {
        let link = getDefaultNavLink()

        if (!link) {
            link = "text-to-image";
            setDefaultNavLink(link);
        }

        this.dispatchNavLinkSelection(link)
    }

    dispatchNavLinkSelection(type) {
        this.dispatchEvent(
            new CustomEvent(NAV_LINKS_CLICKED_EVENT, {
                detail: {
                    type
                },
                bubbles: true,
                composed: true,
            })
        );
    }
}
