import { getGatewayUrl } from "../../utils";
import { fromPromise } from "rxjs/internal/observable/innerFrom";
import { catchError, fromEvent, map, switchMap } from "rxjs";
import Handlebars from "handlebars";
import { db } from "../../db";

const networkCapabilitiesTemplate = document.createElement("template")
networkCapabilitiesTemplate.innerHTML = `
<section data-nav-item="network-capabilities" >
    <h3>Network Capabilities - <a id="refresh-net-caps">Refresh</a></h3>
    <div class="card">
        <div class="card-content"  id="net-caps-content">
        </div>
    </div>
</section>
`
export default class NetworkCapabilities extends HTMLElement {
    constructor() {
        super();
        this.viewTemplate = Handlebars.compile(`
            <p class="title">Livepeer AI Pipelines Loaded</p>
            <span class="subtitle">Gateway: {{gateway}}</span><br/>
            {{#each pipelines}}
                <br/>
                <p class="title">{{name}}</p>
                {{#each models}}
                    <span class="subtitle">{{name}} - Cold: {{Cold}}, Warm: {{Warm}}</span><br/>
                    <details>
                <summary>Orchestrators</summary>
                <ul>
                    {{#each orchestrators}}
                        <li>{{ethAddress}} - Warm: {{warm}}</li>
                    {{/each}}
                </ul>
            </details>
                    <br/>
                {{/each}}
            {{/each}}
        `);
    }

    connectedCallback() {
        // console.log("[NetworkCapabilities::connectedCallback]")
        this.template = networkCapabilitiesTemplate.content.cloneNode(true);
        this.appendChild(this.template);
        this.gateway = getGatewayUrl();
        const fetchNewCaps = async () => {
            try {
                const capabilities = await db.capabilities.toArray();
                return capabilities;
            } catch (error) {
                console.error('Error fetching capabilities from Dexie:', error);
                return [];
            }
        }
        if (!this.capabilities) {
            console.log("fetching initial capabilities")
            fetchNewCaps().then(capabilities => {
                this.networkCapabilities = capabilities;
                this.render();
            });
        }

        let refreshButton = document.querySelector('#refresh-net-caps');
        let refreshButtonClicks$ = fromEvent(refreshButton, 'click');

        refreshButtonClicks$
            .pipe(
                switchMap(() => fetchNewCaps()),
                catchError(err => {
                    console.error('Error fetching network capablilities:', err);
                    return of(null);
                }))
            .subscribe(values => {
                this.networkCapabilities = values;
                this.render();
            });
    }

    render() {
        console.log("[NetworkCapabilities::render]  ")

        let content = this.querySelector("#net-caps-content");
        content.textContent = ''
        var html = this.viewTemplate({ gateway: this.gateway, pipelines: this.networkCapabilities });
        content.innerHTML = html;
    }
}