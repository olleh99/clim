import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import SignUpView from '../views/SignUpView.vue'
import HomeView from '../views/HomeView.vue'
import GymsView from '../views/GymsView.vue'
import GymDetailView from '../views/GymDetailView.vue'
import BoardView from '../views/BoardView.vue'
import BoardDetailView from '../views/BoardDetailView.vue' // 추가
import BoardWriteView from '../views/BoardWriteView.vue'
import MyPageView from '../views/MyPageView.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignUpView
  },
  {
    path: '/main',
    name: 'main',
    component: HomeView
  },
  {
    path: '/gyms',
    name: 'gyms',
    component: GymsView
  },
  {
    path: '/gyms/:id',
    name: 'gymDetail',
    component: GymDetailView
  },
  {
    path: '/board',
    name: 'board',
    component: BoardView
  },
  {
    path: '/board/:id',  // 게시글 상세보기 경로 추가
    name: 'boardDetail',
    component: BoardDetailView
  },
  {
    path: '/board/write',
    name: 'boardWrite',
    component: BoardWriteView
  },
  {
    path: '/mypage',
    name: 'mypage',
    component: MyPageView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router