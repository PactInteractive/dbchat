import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-okaidia.css';
import { getUniqueId } from '../utils';

const html = String.raw; // For syntax highlighting with the `lit-html` extension

// Configure output rendering
marked.use({
  renderer: {
    code({ text, lang }) {
      const language = lang && Prism.languages[lang] ? lang : 'plaintext';
      const highlighted = Prism.highlight(text, Prism.languages[language], language);
      const codeElementId = `code-${getUniqueId()}`;
      const code = html`<pre><code id="${codeElementId}" class="language-${language}">${highlighted}</code></pre>`;

      if (language === 'sql') {
        return html`
          <div class="relative transition duration-300 ease-in-out group bg-stone-900 rounded-md overflow-clip">
            <div class="flex items-center justify-between text-white border-b border-stone-700 p-3 gap-4 not-prose">
              <p class="font-bold">Query</p>

              <div class="flex gap-2 text-sm">
                <button
                  type="button"
                  class="flex-1 text-white py-1.5 px-4 transition duration-300 ease-in-out bg-stone-800 hover:bg-stone-700 font-bold border border-stone-700 rounded-3xl flex items-center gap-2"
                  data-action="copy"
                  data-target="#${codeElementId}"
                >
                  <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                    <path
                      d="M352 0l96 96 0 288-288 0L160 0 352 0zM64 128l64 0 0 64-64 0 0 256 192 0 0-32 64 0 0 32 0 64-64 0L64 512 0 512l0-64L0 192l0-64 64 0z"
                    />
                  </svg>
                  Copy query
                </button>

                <button
                  type="button"
                  class="flex-1 text-white py-1.5 px-4 transition duration-300 ease-in-out bg-stone-800 hover:bg-stone-700 font-bold border border-stone-700 rounded-3xl flex items-center gap-2"
                  data-action="execute"
                  data-target="#${codeElementId}"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-4 h-4">
                    <path
                      d="M512 32L0 32 0 480l512 0 0-448zM288 96l0 320L64 416 64 96l224 0zm64 0l96 0 0 48-96 0 0-48zm96 96l0 48-96 0 0-48 96 0zm-96 96l96 0 0 48-96 0 0-48z"
                    />
                  </svg>
                  Show results
                </button>
              </div>
            </div>
            ${code}
          </div>
        `;
      }

      return code;
    },
  },
});

export function parse(text: string) {
  return marked.parse(text);
}
