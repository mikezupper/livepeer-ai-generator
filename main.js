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
import SegmentAnything2 from "./src/components/ai/segment-anything-2.js";
import LLM from "./src/components/ai/llm.js";
import TextToSpeech from "./src/components/ai/text-to-speech.js";
import TextToSpeechOutputCard from "./src/components/TextToSpeechOutputCard.js";
import ImageToText from "./src/components/ai/image-to-text.js";
import ImageTextOutputCard from "./src/components/ImageToTextOutputCard.js";

// register all custom elements
customElements.define("generated-image-card", GeneratedImageCard);
customElements.define("generate-image-form", GenerateImgeForm);
customElements.define("audio-text", AudioTextCard);
customElements.define("speech-card", TextToSpeechOutputCard);
customElements.define("generated-text-card", ImageTextOutputCard);

customElements.define("footer-links", FooterLinks);

customElements.define("ai-settings", Settings);
customElements.define("ai-network-capabilities", NetworkCapabilities);
customElements.define("ai-text-to-image", TextToImage);
customElements.define("ai-image-to-image", ImageToImage);
customElements.define("ai-image-to-text", ImageToText);
customElements.define("ai-image-to-video", ImageToVideo);
customElements.define("ai-audio-to-text", AudioToText);
customElements.define("ai-text-to-speech", TextToSpeech);
customElements.define("ai-upscale", Upscale);
customElements.define("ai-segment-anything-2", SegmentAnything2);
customElements.define("ai-llm", LLM);

//NavLinks must be the last element loaded, it requires all other elements to be rendered prior to itself.
// This is because NavLinks is going to find all "sections" and make sure it detects when they are clicked and displayed.
customElements.define("nav-links", NavLinks);
