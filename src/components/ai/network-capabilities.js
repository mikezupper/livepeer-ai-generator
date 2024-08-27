import {html} from 'lit';
import {getGatewayUrl} from '../../utils.js';
import {gatewayDataFetcher, PIPELINE_CHANGED_EVENT} from '../../service/GatewayDataFetcher.js';
import BaseComponent from "../BaseComponent.js";

export default class NetworkCapabilities extends BaseComponent {
    static properties = {
        networkCapabilities: {type: Array},
        gateway: {type: String},
    };

    constructor() {
        super();
        this.networkCapabilities = [];
        this.gateway = '';
        this.updatePipelines = (event)=>{
            //console.log('[NetworkCapabilities] handle pipeline changed event');
            this.networkCapabilities = event.detail;
            this.gateway = getGatewayUrl();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        //console.log('[NetworkCapabilities::connectedCallback]');
        addEventListener(PIPELINE_CHANGED_EVENT, this.updatePipelines);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        removeEventListener(PIPELINE_CHANGED_EVENT, this.updatePipelines);
    }

    _handleNetworkCapabilitiesRefresh(){
        gatewayDataFetcher.triggerFetchCapabilities()
    }

    render() {
        //console.log('[NetworkCapabilities::render]',this.networkCapabilities);
        return html`
            <section data-nav-item="network-capabilities" class="is-hidden">
                <h3>Network Capabilities - <a @click=${this._handleNetworkCapabilitiesRefresh}>Refresh</a></h3>
                <div class="card">
                    <div class="card-content" id="net-caps-content">
                        <p class="title">Livepeer AI Pipelines Loaded</p>
                        <span class="subtitle">Gateway: ${this.gateway}</span><br/><br/>
                        ${this.networkCapabilities.map(pipeline => html`
                            <p class="title">${pipeline.name}</p>
                            ${pipeline.models.map(model => html`
                                <span class="subtitle">${model.name} - Cold: ${model.Cold}, Warm: ${model.Warm}</span>
                                <details>
                                    <summary>model details</summary>
                                    ${model.orchestrators.map(orchestrator => html`
                                        <span class="${orchestrator.warm ? 'has-text-warning' : 'has-text-info'}">
                      ${orchestrator.ethAddress} - ${orchestrator.warm ? 'Warm' : 'Cold'}
                    </span><br/>
                                    `)}
                                </details><br/>
                            `)}
                        `)}
                    </div>
                </div>
            </section>
        `;
    }
}
