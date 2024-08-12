import {getGatewayUrl} from "../../utils";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {catchError, fromEvent, map, switchMap} from "rxjs";
import Handlebars from "handlebars";

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
            <p class="title">Livepeer AI Pipelines Loaded </p>
            <span class="subtitle">Gateway: {{gateway}}</span><br/>
            <br/>
            {{#each this}}
                <p class="title">{{pipeline_name}}</p>
                {{#each values}}
                <span class="subtitle">{{@key}}: Cold - {{Cold}}, Warm - {{Warm}}</span><br/>
                {{/each}}
                <br/>
            {{/each}}
            `);
    }

    connectedCallback() {
        // console.log("[NetworkCapabilities::connectedCallback]")
        this.template = networkCapabilitiesTemplate.content.cloneNode(true);
        this.appendChild(this.template);
        this.gateway = getGatewayUrl();
        const fetchNewCaps = () => {
            let gw = getGatewayUrl();
            let url = `${gw}/getNetworkCapabilities`;
            return fromPromise(fetch(url, {
                method: "GET",
                mode: "cors",
                cache: "no-cache",
                headers:{
                    "Authorization": `Bearer None`
                },
            }).then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            }))
                .pipe(
                    map(data => {
                            let networkCapabilities = [];
                            for (let key in data) {
                                if (isNaN(key)) {
                                    let timestamp = Date.now();
                                    // db.pipelines.put({ pipeline_name: key, values: data[key], timestamp })
                                    networkCapabilities.push({pipeline_name: key, values: data[key], timestamp})
                                }
                            }
                            return networkCapabilities;
                        }
                    ))
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
        var html = this.viewTemplate({gateway: this.gateway, ...this.networkCapabilities});
        content.innerHTML = html;
    }
}