import * as VueRouter from 'vue-router'



const routes = [

  {
    path: '/',
    redirect: '/product'
  },
  {
    path: '/product',
    component: () => {
      return import("../pages/product.vue")
    },
    name: 'Product'
  },
  // {
  //   path: '/index',
  //   component: () => {
  //     return import("../pages/index.vue")
  //   },
  //   name: 'Index'
  // },
  {
    path: '/form',
    component: () => {
      return import("../pages/form.vue")
    },
    name: 'Form'
  },
  {
    path: '/list',
    component: () => {
      return import("../pages/list.vue")
    },
    name: 'List'
  },
]


const router = VueRouter.createRouter({
  // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
  history: VueRouter.createWebHashHistory(),
  routes, // `routes: routes` 的缩写
})

export default router