import { createApp } from 'vue';

import App from './App/App.vue';
import { router } from './router';
import './style.css';

createApp(App).use(router).mount('#root');
