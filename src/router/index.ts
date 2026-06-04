import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSessionStore } from '@/stores/session'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: to => ({ path: '/menu', query: to.query }),
  },
  {
    path: '/menu',
    name: 'menu',
    component: () => import('@/views/public/MenuView.vue'),
  },
  {
    path: '/menu/swipe',
    name: 'swipe',
    component: () => import('@/views/public/SwipeView.vue'),
  },
  {
    path: '/no-table',
    name: 'no-table',
    component: () => import('@/views/public/NoTableView.vue'),
  },

  // Admin
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('@/views/admin/LoginView.vue'),
  },
  {
    path: '/admin',
    component: () => import('@/views/admin/AdminShell.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'admin', component: () => import('@/views/admin/DashboardView.vue') },
      { path: 'categories', name: 'admin-categories', component: () => import('@/views/admin/CategoriesView.vue') },
      { path: 'categories/:id', name: 'admin-category-edit', component: () => import('@/views/admin/CategoryEditView.vue') },
      { path: 'subcategories', name: 'admin-subcategories', component: () => import('@/views/admin/SubcategoriesView.vue') },
      { path: 'products', name: 'admin-products', component: () => import('@/views/admin/ProductsView.vue') },
      { path: 'products/:id', name: 'admin-product-edit', component: () => import('@/views/admin/ProductEditView.vue') },
      { path: 'banners', name: 'admin-banners', component: () => import('@/views/admin/BannersView.vue') },
      { path: 'call-requests', name: 'admin-calls', component: () => import('@/views/admin/CallRequestsView.vue') },
      { path: 'settings', name: 'admin-settings', component: () => import('@/views/admin/SettingsView.vue') },
    ],
  },

  { path: '/:pathMatch(.*)*', redirect: '/menu' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

router.beforeEach(async (to) => {
  // Capture ?table= on any public-menu navigation and persist.
  // Tableless browsing is allowed; the cart enforces phone fallback at checkout.
  if (to.name === 'menu' || to.name === 'swipe') {
    const session = useSessionStore()
    const t = to.query.table
    if (typeof t === 'string' && t) {
      session.setTable(t)
    }
  }

  if (to.meta.requiresAuth) {
    const auth = useAuthStore()
    if (!auth.ready) await auth.init()
    if (!auth.isStaff) {
      return { name: 'admin-login', query: { redirect: to.fullPath } }
    }
  }
})

export default router
