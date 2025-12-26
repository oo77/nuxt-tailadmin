<template>
  <div class="editor-page">
    <CertificateEditor
      v-if="template"
      :template-id="templateId"
      :template-name="template.name"
      :initial-data="template.templateData || undefined"
      @save="handleSave"
      @preview="handlePreview"
    />
    
    <!-- Загрузка -->
    <div v-else-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Загрузка шаблона...</p>
    </div>
    
    <!-- Ошибка -->
    <div v-else-if="error" class="error-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <path d="m15 9-6 6"/>
        <path d="m9 9 6 6"/>
      </svg>
      <h2>Ошибка загрузки</h2>
      <p>{{ error }}</p>
      <button @click="loadTemplate">Повторить</button>
    </div>
    
    <!-- Модальное окно предпросмотра -->
    <Teleport to="body">
      <div v-if="showPreview" class="preview-modal" @click.self="showPreview = false">
        <div class="preview-content">
          <div class="preview-header">
            <h3>Предпросмотр сертификата</h3>
            <button class="close-btn" @click="showPreview = false">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          <div class="preview-body">
            <div ref="previewContainerRef" class="preview-certificate">
              <!-- Здесь будет рендериться preview -->
              <p class="preview-note">Предпросмотр генерируется...</p>
            </div>
          </div>
          <div class="preview-footer">
            <button class="btn-secondary" @click="showPreview = false">Закрыть</button>
            <button class="btn-primary" @click="generatePDF">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Скачать PDF
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- Уведомления -->
    <Teleport to="body">
      <div v-if="notification" class="notification" :class="notification.type">
        <svg v-if="notification.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <path d="m9 11 3 3L22 4"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4"/>
          <path d="M12 16h.01"/>
        </svg>
        <span>{{ notification.message }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthFetch } from '~/composables/useAuthFetch'
import type { CertificateTemplate, CertificateTemplateData } from '~/server/types/certificate'
import CertificateEditor from '~/components/certificates/editor/CertificateEditor.vue'

definePageMeta({
  layout: 'blank',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const { authFetch } = useAuthFetch()

const templateId = computed(() => route.params.id as string)
const template = ref<CertificateTemplate | null>(null)
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const showPreview = ref(false)
const previewContainerRef = ref<HTMLElement | null>(null)
const notification = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// Загрузка шаблона
async function loadTemplate() {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await authFetch(`/api/certificates/templates/${templateId.value}`)
    
    if (!response.ok) {
      throw new Error('Шаблон не найден')
    }
    
    template.value = await response.json()
    console.log('[CertificateEditor] Шаблон загружен:', template.value?.name)
  } catch (e) {
    console.error('[CertificateEditor] Ошибка загрузки шаблона:', e)
    error.value = e instanceof Error ? e.message : 'Неизвестная ошибка'
  } finally {
    isLoading.value = false
  }
}

// Сохранение шаблона
async function handleSave(data: CertificateTemplateData) {
  isSaving.value = true
  
  try {
    const response = await authFetch(`/api/certificates/templates/${templateId.value}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateData: data,
        layout: data.layout,
      }),
    })
    
    if (!response.ok) {
      throw new Error('Ошибка сохранения')
    }
    
    const updated = await response.json()
    template.value = updated
    
    showNotification('success', 'Шаблон успешно сохранён')
    console.log('[CertificateEditor] Шаблон сохранён')
  } catch (e) {
    console.error('[CertificateEditor] Ошибка сохранения:', e)
    showNotification('error', 'Ошибка сохранения шаблона')
  } finally {
    isSaving.value = false
  }
}

// Предпросмотр
function handlePreview() {
  showPreview.value = true
  // TODO: Рендеринг preview на сервере
}

// Генерация PDF
async function generatePDF() {
  showNotification('success', 'Генерация PDF запущена...')
  // TODO: Реализовать генерацию PDF
}

// Показ уведомления
function showNotification(type: 'success' | 'error', message: string) {
  notification.value = { type, message }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

onMounted(() => {
  loadTemplate()
})
</script>

<style scoped>
.editor-page {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Загрузка */
.loading-state {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--color-gray-100);
}

:root.dark .loading-state {
  background: var(--color-gray-900);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-gray-200);
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: var(--color-gray-600);
  font-size: 0.875rem;
}

/* Ошибка */
.error-state {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: var(--color-gray-100);
  text-align: center;
  padding: 2rem;
}

:root.dark .error-state {
  background: var(--color-gray-900);
}

.error-state svg {
  color: #DC2626;
}

.error-state h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0;
}

:root.dark .error-state h2 {
  color: white;
}

.error-state p {
  color: var(--color-gray-600);
  margin: 0;
}

.error-state button {
  padding: 0.625rem 1.5rem;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}

/* Модальное окно предпросмотра */
.preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.preview-content {
  background: white;
  border-radius: 1rem;
  width: 90vw;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

:root.dark .preview-content {
  background: var(--color-gray-800);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-gray-200);
}

:root.dark .preview-header {
  border-color: var(--color-gray-700);
}

.preview-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-900);
}

:root.dark .preview-header h3 {
  color: white;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  color: var(--color-gray-500);
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
}

:root.dark .close-btn:hover {
  background: var(--color-gray-700);
  color: white;
}

.preview-body {
  flex: 1;
  overflow: auto;
  padding: 2rem;
  background: var(--color-gray-100);
  display: flex;
  align-items: center;
  justify-content: center;
}

:root.dark .preview-body {
  background: var(--color-gray-900);
}

.preview-certificate {
  background: white;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
  min-width: 400px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-note {
  color: var(--color-gray-500);
  font-size: 0.875rem;
}

.preview-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--color-gray-200);
}

:root.dark .preview-footer {
  border-color: var(--color-gray-700);
}

.btn-secondary {
  padding: 0.625rem 1rem;
  background: transparent;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  color: var(--color-gray-700);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-secondary:hover {
  background: var(--color-gray-50);
}

:root.dark .btn-secondary {
  border-color: var(--color-gray-600);
  color: var(--color-gray-300);
}

:root.dark .btn-secondary:hover {
  background: var(--color-gray-700);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563EB, #1D4ED8);
}

/* Уведомления */
.notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  animation: slideIn 0.3s ease;
}

:root.dark .notification {
  background: var(--color-gray-800);
}

.notification.success {
  border-left: 4px solid #10B981;
}

.notification.success svg {
  color: #10B981;
}

.notification.error {
  border-left: 4px solid #EF4444;
}

.notification.error svg {
  color: #EF4444;
}

.notification span {
  color: var(--color-gray-900);
  font-weight: 500;
}

:root.dark .notification span {
  color: white;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
