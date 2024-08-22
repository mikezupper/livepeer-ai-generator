
import GenerateImgeForm from './src/components/GenerateImageForm.js';
import GeneratedImageCard from './src/components/GeneratedImageCard.js';
import NavLinks from './src/components/nav-links.js';
import FooterLinks from './src/components/footer-links.js';
import Settings from './src/components/settings.js';
import TextToImage from './src/components/ai/text-to-image.js';
import ImageToImage from './src/components/ai/image-to-image.js';
import ImageToVideo from './src/components/ai/image-to-video.js';
import AudioToText from './src/components/ai/audio-to-text.js';
import Upscale from './src/components/ai/upscale.js';
import NetworkCapabilities from './src/components/ai/network-capabilities.js';
import AudioTextCard from "./src/components/AudioTextCard.js";

console.log("[main] start")

// register all custom elements
customElements.define("generated-image-card", GeneratedImageCard);
customElements.define("generate-image-form", GenerateImgeForm);
customElements.define("audio-text", AudioTextCard);
customElements.define("footer-links", FooterLinks);
customElements.define("nav-links", NavLinks);

customElements.define("ai-settings", Settings);
customElements.define("ai-network-capabilities", NetworkCapabilities);
customElements.define("ai-text-to-image", TextToImage);
customElements.define("ai-image-to-image", ImageToImage);
customElements.define("ai-image-to-video", ImageToVideo);
customElements.define("ai-audio-to-text", AudioToText);
customElements.define("ai-upscale", Upscale);