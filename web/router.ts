import { createWebHistory, createRouter } from 'vue-router';

import Chat from './Chat/Chat.vue';
import Settings from './Settings/Settings.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/settings', },
    { path: '/settings', component: Settings },
    { path: '/chats/:id', component: Chat },
  ],
});
