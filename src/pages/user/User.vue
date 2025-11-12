<script setup lang="ts">
import { computed, ref } from 'vue'
import { Calendar, CreditCard, Crown } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.ts'
import { useRouter } from 'vue-router'
import BaseInput from '@/components/base/BaseInput.vue'
import BasePage from "@/components/BasePage.vue";
import { APP_NAME, GITHUB } from "@/config/env.ts";
import BaseButton from "@/components/BaseButton.vue";
import { PASSWORD_CONFIG } from "@/config/auth.ts";
import { setPassword } from "@/apis/user.ts";

const authStore = useAuthStore()
const router = useRouter()

// Check login state
const isLoggedIn = computed(() => authStore.isLogin)

// Form data
const username = ref('Brian W')
const email = ref('ttentau@gmail.com')
const receiveNotifications = ref(false)

// Mock subscription data (you can replace with real data from your API)
const subscriptionData = ref({
  plan: 'Premium',
  status: 'active',
  expiresAt: '2025-12-31',
  autoRenew: true,
  paymentMethod: '信用卡 ****1234'
})

// UI state
const isEditingUsername = ref(false)
const isEditingEmail = ref(false)
const showPasswordSection = ref(false)

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}

const editUsername = () => {
  isEditingUsername.value = true
}

const saveUsername = () => {
  isEditingUsername.value = false
  // Here you would typically save to backend
}

const editEmail = () => {
  isEditingEmail.value = true
}

const saveEmail = () => {
  isEditingEmail.value = false
  // Here you would typically save to backend
}

const toggleNotifications = () => {
  receiveNotifications.value = !receiveNotifications.value
}

const downloadPersonalInfo = () => {
  console.log('Download personal info')
}

const deleteAccount = () => {
  if (confirm('确定要删除您的账户吗？此操作无法撤销。')) {
    console.log('Delete account')
  }
}

const contactSupport = () => {
  console.log('Contact support')
}

const leaveTrustpilotReview = () => {
  window.open(GITHUB + '/issues', '_blank')
}

async function changePassword(e) {
  let res = await setPassword(e.target.value)
  //todo


}
</script>

<template>
  <BasePage>
    <!-- Unauthenticated View -->
    <div v-if="isLoggedIn" class="center h-screen">
      <div class="card shadow-lg text-center flex-col gap-6 w-100 ">
        <div class="w-20 h-20 bg-blue-100 rounded-full center mx-auto">
          <IconFluentPerson20Regular class="text-3xl text-blue-600"/>
        </div>
        <h1 class="text-2xl font-bold">欢迎使用</h1>
        <p class="">请登录以管理您的账户</p>
        <BaseButton
            @click="router.push('/login')"
            size="large"
            class="w-full mt-4"
        >
          登录
        </BaseButton>
        <p class="text-sm text-gray-500">
          还没有账户？
          <router-link to="/login" class="line">立即注册</router-link>
        </p>
      </div>
    </div>

    <!-- Authenticated View -->
    <div v-else class="w-full flex items-start gap-4">
      <!-- Main Account Settings -->
      <div class="card flex-1 flex flex-col gap-2 px-8">
        <h1 class="text-xl font-bold">帐户</h1>
        <!-- Username Section -->
        <div class="flex items-center justify-between ">
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-700 mb-1">用户名</div>
            <div class="flex items-center gap-2">
              <IconFluentPerson20Regular class="text-base text-gray-500"/>
              <BaseInput
                  v-if="isEditingUsername"
                  v-model="username"
                  type="text"
                  size="normal"
                  @blur="saveUsername"
                  @keyup.enter="saveUsername"
                  class="flex-1 max-w-xs"
                  autofocus
              />
              <span v-else class="text-gray-900">{{ username }}</span>
            </div>
          </div>

          <IconFluentTextEditStyle20Regular
              @click="isEditingUsername ? saveUsername() : editUsername()"
              class="text-xl"/>
        </div>
        <div class="line"></div>


        <!-- Email Section -->
        <div class="flex items-center justify-between ">
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-700 mb-1">电子邮箱</div>
            <div class="flex items-center gap-2">
              <IconFluentMail20Regular class="text-base text-gray-500"/>
              <BaseInput
                  v-if="isEditingEmail"
                  v-model="email"
                  type="email"
                  size="normal"
                  @blur="saveEmail"
                  @keyup.enter="saveEmail"
                  class="flex-1 max-w-xs"
                  autofocus
              />
              <span v-else class="text-gray-900">{{ email }}</span>
            </div>
          </div>
          <IconFluentTextEditStyle20Regular
              @click="isEditingEmail ? saveEmail() : editEmail()"
              class="text-xl"/>
        </div>

        <div class="line"></div>

        <!-- Password Section -->
        <div class="flex items-center justify-between cp"
             @click="showPasswordSection = !showPasswordSection"
        >
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-700 mb-1">设置密码</div>
            <div class="text-xs text-gray-500">在此输入密码</div>
          </div>
          <IconFluentChevronLeft28Filled
              class="transition-transform"
              :class="['rotate-270','rotate-180'][showPasswordSection?0:1]"/>
        </div>
        <div v-if="showPasswordSection">
          <BaseInput placeholder="新密码"
                     type="password"
                     autofocus
                     :min="PASSWORD_CONFIG.minLength"
                     :max="PASSWORD_CONFIG.maxLength"/>
          <div class="text-align-end mt-4">
            <BaseButton type="info" @click="showPasswordSection = !showPasswordSection">取消</BaseButton>
            <BaseButton @click="changePassword">保存</BaseButton>
          </div>
        </div>
        <div class="line"></div>

        <!-- Contact Support -->
        <div class="flex py-2 items-center justify-between cp"
             @click="contactSupport">
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-700 mb-1">联系 {{ APP_NAME }} 客服</div>
          </div>
          <IconFluentChevronLeft28Filled class="rotate-180"/>
        </div>
        <div class="line"></div>

        <!-- Trustpilot Review -->
        <div class="flex py-2 items-center justify-between cp"
             @click="leaveTrustpilotReview">
          <div class="flex-1">
            <div class="text-sm font-medium text-gray-700 mb-1">在 {{ APP_NAME }} 上留下评论</div>
          </div>
          <IconFluentChevronLeft28Filled class="rotate-180"/>
        </div>
        <div class="line"></div>

        <!-- Logout Button -->
        <div class="center w-full">
          <BaseButton
              @click="handleLogout"
              size="large"
              class="w-[80%]"
          >
            登出
          </BaseButton>
        </div>

        <div class="text-xs text-center">
          <a href="/user-agreement.html" target="_blank" class="text-gray-500 hover:text-gray-700">用户协议</a>
          、
          <a href="/privacy-policy.html" target="_blank" class="text-gray-500 hover:text-gray-700">隐私政策</a>
        </div>
      </div>

      <!-- Subscription Information -->
      <div class="card w-80">
        <div class="flex items-center gap-3 mb-4">
          <Crown class="w-6 h-6 text-yellow-500"/>
          <h2 class="text-lg font-bold text-gray-900">订阅信息</h2>
        </div>

        <div class="space-y-4">
          <div>
            <div class="text-sm text-gray-500 mb-1">当前计划</div>
            <div class="text-lg font-semibold text-gray-900">{{ subscriptionData.plan }}</div>
          </div>

          <div>
            <div class="text-sm text-gray-500 mb-1">状态</div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span class="text-sm font-medium text-green-700">{{
                  subscriptionData.status === 'active' ? '活跃' : '已过期'
                }}</span>
            </div>
          </div>

          <div>
            <div class="text-sm text-gray-500 mb-1">到期时间</div>
            <div class="flex items-center gap-2">
              <Calendar class="w-4 h-4 text-gray-400"/>
              <span class="text-sm font-medium text-gray-900">{{ subscriptionData.expiresAt }}</span>
            </div>
          </div>

          <div>
            <div class="text-sm text-gray-500 mb-1">自动续费</div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2" :class="subscriptionData.autoRenew ? 'bg-blue-500' : 'bg-gray-400'"
                   rounded-full></div>
              <span class="text-sm font-medium"
                    :class="subscriptionData.autoRenew ? 'text-blue-700' : 'text-gray-600'">
                    {{ subscriptionData.autoRenew ? '已开启' : '已关闭' }}
                  </span>
            </div>
          </div>

          <div>
            <div class="text-sm text-gray-500 mb-1">付款方式</div>
            <div class="flex items-center gap-2">
              <CreditCard class="w-4 h-4 text-gray-400"/>
              <span class="text-sm font-medium text-gray-900">{{ subscriptionData.paymentMethod }}</span>
            </div>
          </div>

          <div class="pt-4 border-t border-gray-200">
            <BaseButton class="w-full">管理订阅</BaseButton>
          </div>
        </div>
      </div>
    </div>
  </BasePage>
</template>