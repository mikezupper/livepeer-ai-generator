import { db, fetchNewCaps } from "../db";
import { getGatewayUrl, setGatewayUrl } from "../utils";
import { NAV_LINKS_CLICKED_EVENT } from "./nav-links";
const gatewayUrl =getGatewayUrl();
const settingsTemplate = document.createElement("template")
settingsTemplate.innerHTML=`
<section data-nav-item="settings" class="is-hidden">
                <h3>Settings</h3>
                <div class="card">
                    <div class="card-content">
                        <div class="content">
                            Enter your Gateway URL and click save
                        </div>
                        <div class="notification is-info" id="settings-success"></div>
                        <form id="settings-form">
                            <div class="notification is-danger is-hidden" id="settings-errors"></div>
                            <div class="field">
                                <label class="label" for="gatewayUrl">Gateway URL</label>
                                <div class="control">
                                    <input class="input" type="text" id="gatewayUrl" name="gatewayUrl"
                                        value="${gatewayUrl}" />
                                </div>
                                <p class="help">Default: https://dream-gateway.livepeer.cloud</p>
                            </div>
                            <div class="field is-grouped">
                                <div class="control">
                                    <button class="button is-primary" id="submit-prompt">Save Settings</button>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>
</section>
`
export default class Settings extends HTMLElement {
    static observedAttributes = ["gateway-url"];

    constructor() {
        super();
    }

    connectedCallback() {
        this.template = settingsTemplate.content.cloneNode(true); // true means deep clone
        this.appendChild(this.template);
        this.form = this.querySelector("form");

        this.success_notif =this.querySelector("#settings-success")
        let gwUrl = getGatewayUrl();
        if (!gwUrl ) {
            // console.log("[Settings::connectedCallback] default gateway not in localStorage")
            this.form.gatewayUrl.value = "https://dream-gateway.livepeer.cloud"
            this.saveSettings();
        }else{
            // console.log("[Settings::connectedCallback] default gateway in localStorage",gwUrl)
            this.form.gatewayUrl.value = gwUrl
        }
        document.addEventListener(NAV_LINKS_CLICKED_EVENT, (e) => {
            const { type } = e.detail;
            this.success_notif.classList.add("is-hidden")
          })
        this.form.onsubmit = async (e) => {
            e.preventDefault();
            this.saveSettings();
                try {
                    // Clear the capabilities table
                    await db.capabilities.clear();
                    console.log('Capabilities table cleared.');
                    db.capabilitiesLastFetch.clear()
                    console.log('CapabilitiesLastCheck table cleared.');

        // Trigger a refresh by calling fetchNewCaps
        const pipelines = await fetchNewCaps().toPromise();

        if (pipelines) {
            console.log('Capabilities refreshed and stored:', pipelines);
        } else {
            console.log('Skipped fetching new capabilities, using existing data.');
        }
                } catch (error) {
                    console.error('Error clearing capabilities or refreshing data:', error);
                }
        }
    }
    attributeChangedCallback(name, oldValue, newValue) {
        // console.log(`[settings::attributeChangedCallback] name = ${name} oldValue=${oldValue} newValue=${newValue}`);
        if(name === "gateway-url"){
            this.form.gatewayUrl.value = newValue
        }
    }
    saveSettings() {
        let formData = new FormData(this.form)
        let gw = formData.get("gatewayUrl")
        this.success_notif.classList.remove("is-hidden")
        if(gw){
            setGatewayUrl(gw)
            this.success_notif.textContent = `Settings Saved Successfully: ${gw}`
        } else{
            this.success_notif.textContent = `Gateway URL is missing.`
        }
    }
}

