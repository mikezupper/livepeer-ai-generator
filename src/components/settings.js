import {defaultGatewayUrl, getGatewayUrl, setGatewayUrl} from "../utils";
import BaseComponent from "./BaseComponent.js";
import {html} from "lit";
import {gatewayDataFetcher} from "../service/GatewayDataFetcher.js";

export default class Settings extends BaseComponent {
    static properties = {
        gateway: {type: String},
        successMessage: {type: String},
        errorMessage: {type: String},
        useCustomGateway: {type: Boolean},  // For the custom checkbox
    };

    constructor() {
        super();
        this.gateway = getGatewayUrl();
        this.successMessage = undefined;
        this.errorMessage = undefined;
        this.useCustomGateway = false;  // Default to false (dropdown is used)
    }

    render() {
        return html`
            <section data-nav-item="settings" class="is-hidden">
                <h3>Settings</h3>
                <div class="card">
                    <div class="card-content">
                        <div class="content">
                            Enter your Gateway URL and click save
                        </div>
                        ${this.successMessage ? html`
                            <div class="notification is-info" id="settings-success">${this.successMessage}</div>` : ''}
                        <form @submit=${this._handleSubmit}>
                            ${this.errorMessage ? html`
                                <div class="notification is-danger is-hidden" id="settings-errors">
                                    ${this.errorMessage}
                                </div>` : ''}
                            <div class="field">
                                <label class="label" for="gatewayUrl">Gateway URL</label>
                                <div class="control">
                                    ${this.useCustomGateway
                                            ? html`
                                            <input class="input" type="text" id="gateway" name="gateway" required
                                                   @input=${this._handleInputChange} .value="${this.gateway}"/>
                                            <p class="help">Enter a custom gateway URL</p>`
                                            : html`
                                            <div class="select">
                                                <select id="gateway" name="gateway" @change=${this._handleInputChange}>
                                                    <option value="https://dream-gateway.livepeer.cloud" 
                                                        ?selected="${this.gateway === 'https://dream-gateway.livepeer.cloud'}">dream-gateway.livepeer.cloud</option>
                                                    <option value="https://dream-gateway-us-west.livepeer.cloud"
                                                        ?selected="${this.gateway === 'https://dream-gateway-us-west.livepeer.cloud'}">dream-gateway-us-west.livepeer.cloud</option>
                                                    <option value="https://dream-gateway-us-east.livepeer.cloud"
                                                        ?selected="${this.gateway === 'https://dream-gateway-us-east.livepeer.cloud'}">dream-gateway-us-east.livepeer.cloud</option>
                                                    <option value="https://dream-gateway-eu-central.livepeer.cloud"
                                                        ?selected="${this.gateway === 'https://dream-gateway-eu-central.livepeer.cloud'}">dream-gateway-eu-central.livepeer.cloud</option>
                                                </select>
                                            </div>
                                            <p class="help">Default: https://dream-gateway.livepeer.cloud - The recommended gateway that is closest to your region.</p>`
                                    }
                                </div>
                            </div>

                            <div class="field">
                                <div class="control">
                                    <label class="checkbox">
                                        <input type="checkbox" @change=${this._handleCheckboxChange}/>
                                        Use Custom Gateway URL
                                    </label>
                                </div>
                            </div>

                            <div class="field is-grouped">
                                <div class="control">
                                    <button class="button is-primary" id="submit-prompt">Save Settings</button>
                                </div>
                            </div>

                        </form>
                    </div>
                </div>
            </section>`;
    }

    // Handle input changes
    _handleInputChange(e) {
        const {name, value} = e.target;
        this[name] = value;
    }

    // Handle checkbox change
    _handleCheckboxChange(e) {
        this.useCustomGateway = e.target.checked;
        console.log("handle setting checkbox",this.useCustomGateway,getGatewayUrl(),this.gateway);
        if (this.useCustomGateway == false)
            this.gateway=defaultGatewayUrl;
    }

    // Handle form submission
    async _handleSubmit(e) {
        e.preventDefault();
        console.log("[Settings] _handleSubmit ", e, this['gateway']);
        const gw = this['gateway'];
        if (gw) {
            setGatewayUrl(gw);
            try {
                gatewayDataFetcher.triggerFetchCapabilities();
                console.log('triggerFetchCapabilities invoked.');
                this.successMessage = `Settings Saved Successfully: ${gw}`;
            } catch (error) {
                this.errorMessage = `Failed to update settings.`;
                console.error('Error clearing capabilities or refreshing data:', error);
            }
            // Remove the success message after 3 seconds
            setTimeout(() => {
                this.successMessage = '';
                this.errorMessage = '';
            }, 3000);
        }
    }
}
