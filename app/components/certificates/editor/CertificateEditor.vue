<template>
  <div class="certificate-editor">
    <!-- Заголовок редактора -->
    <div class="editor-header">
      <div class="header-left">
        <NuxtLink 
          :to="`/certificates/templates/${templateId}`"
          class="back-button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Назад
        </NuxtLink>
        <h1 class="editor-title">{{ templateName || 'Редактор шаблона' }}</h1>
      </div>
      
      <div class="header-center">
        <button 
          class="toolbar-btn"
          :disabled="!canUndo"
          @click="undo"
          title="Отменить (Ctrl+Z)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
          </svg>
        </button>
        <button 
          class="toolbar-btn"
          :disabled="!canRedo"
          @click="redo"
          title="Повторить (Ctrl+Y)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 7v6h-6"/>
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
          </svg>
        </button>
        
        <div class="toolbar-divider"></div>
        
        <span class="zoom-label">{{ Math.round(zoom * 100) }}%</span>
        <button class="toolbar-btn" @click="zoomOut" :disabled="zoom <= minZoom" title="Уменьшить">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
            <path d="M8 11h6"/>
          </svg>
        </button>
        <button class="toolbar-btn" @click="zoomIn" :disabled="zoom >= maxZoom" title="Увеличить">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
            <path d="M11 8v6"/>
            <path d="M8 11h6"/>
          </svg>
        </button>
        <button class="toolbar-btn" @click="resetZoom" title="Сбросить масштаб">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24"/>
            <path d="M21 3v6h-6"/>
          </svg>
        </button>
      </div>
      
      <div class="header-right">
        <button 
          class="btn-preview"
          @click="$emit('preview')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Предпросмотр
        </button>
        <button 
          class="btn-save"
          :disabled="isSaving || !isDirty"
          @click="$emit('save', exportData())"
        >
          <svg v-if="!isSaving" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/>
            <polyline points="7,3 7,8 15,8"/>
          </svg>
          <svg v-else class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          {{ isSaving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
    
    <!-- Основная область -->
    <div class="editor-main">
      <!-- Панель инструментов слева -->
      <EditorToolbar 
        @add-text="handleAddText"
        @add-variable="handleAddVariable"
        @add-image="handleAddImage"
        @add-qr="handleAddQR"
        @add-shape="handleAddShape"
        @set-layout="setLayout"
        @set-background="setBackground"
        :current-layout="templateData.layout"
      />
      
      <!-- Холст -->
      <div class="canvas-container" ref="canvasContainerRef">
        <EditorCanvas
          :template-data="templateData"
          :selected-element-id="selectedElementId"
          :zoom="zoom"
          @select="selectElement"
          @update-element="updateElement"
          @delete-element="deleteElement"
        />
      </div>
      
      <!-- Панель свойств справа -->
      <EditorSidebar
        :selected-element="selectedElement"
        @update="handleElementUpdate"
        @delete="deleteSelectedElement"
        @duplicate="handleDuplicate"
        @bring-to-front="handleBringToFront"
        @send-to-back="handleSendToBack"
        @toggle-lock="handleToggleLock"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  useCertificateEditor, 
  createTextElement,
  createVariableElement,
  createImageElement,
  createQRElement,
  createShapeElement,
} from '~/composables/useCertificateEditor'
import type { 
  CertificateTemplateData, 
  TemplateElement,
  VariableSource,
  TemplateLayout,
  TemplateBackground,
  ShapeType,
} from '~/server/types/certificate'
import EditorToolbar from './EditorToolbar.vue'
import EditorCanvas from './EditorCanvas.vue'
import EditorSidebar from './EditorSidebar.vue'

const props = defineProps<{
  templateId: string
  templateName?: string
  initialData?: CertificateTemplateData
}>()

const emit = defineEmits<{
  (e: 'save', data: CertificateTemplateData): void
  (e: 'preview'): void
}>()

const canvasContainerRef = ref<HTMLElement | null>(null)

const {
  templateData,
  selectedElementId,
  selectedElement,
  zoom,
  isDirty,
  isSaving,
  canUndo,
  canRedo,
  minZoom,
  maxZoom,
  initTemplate,
  exportData,
  undo,
  redo,
  setLayout,
  setBackground,
  addElement,
  updateElement,
  deleteElement,
  deleteSelectedElement,
  duplicateElement,
  bringToFront,
  sendToBack,
  toggleLock,
  selectElement,
  zoomIn,
  zoomOut,
  resetZoom,
} = useCertificateEditor()

// Инициализация при монтировании
onMounted(() => {
  initTemplate(props.initialData)
  
  // Клавиатурные сочетания
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Обработка клавиатурных сочетаний
function handleKeydown(e: KeyboardEvent) {
  // Ctrl+Z - Undo
  if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    undo()
  }
  // Ctrl+Y или Ctrl+Shift+Z - Redo
  if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
    e.preventDefault()
    redo()
  }
  // Delete - удалить выбранный элемент
  if (e.key === 'Delete' && selectedElementId.value) {
    e.preventDefault()
    deleteSelectedElement()
  }
  // Ctrl+D - дублировать
  if (e.ctrlKey && e.key === 'd' && selectedElementId.value) {
    e.preventDefault()
    duplicateElement(selectedElementId.value)
  }
  // Escape - снять выделение
  if (e.key === 'Escape') {
    selectElement(null)
  }
  // Ctrl+S - сохранить
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    if (isDirty.value) {
      emit('save', exportData())
    }
  }
}

// Обработчики добавления элементов
function handleAddText() {
  const element = createTextElement({
    x: templateData.value.width / 2 - 150,
    y: templateData.value.height / 2 - 25,
  })
  addElement(element)
}

function handleAddVariable(variableKey: VariableSource) {
  const element = createVariableElement(variableKey, {
    x: templateData.value.width / 2 - 175,
    y: templateData.value.height / 2 - 20,
  })
  addElement(element)
}

function handleAddImage(src: string) {
  const element = createImageElement(src, {
    x: 50,
    y: 50,
  })
  addElement(element)
}

function handleAddQR() {
  const element = createQRElement({
    x: templateData.value.width - 150,
    y: templateData.value.height - 150,
  })
  addElement(element)
}

function handleAddShape(shapeType: ShapeType) {
  const element = createShapeElement(shapeType, {
    x: templateData.value.width / 2 - 100,
    y: templateData.value.height / 2 - 50,
  })
  addElement(element)
}

function handleElementUpdate(id: string, updates: Partial<TemplateElement>) {
  updateElement(id, updates)
}

function handleDuplicate() {
  if (selectedElementId.value) {
    duplicateElement(selectedElementId.value)
  }
}

function handleBringToFront() {
  if (selectedElementId.value) {
    bringToFront(selectedElementId.value)
  }
}

function handleSendToBack() {
  if (selectedElementId.value) {
    sendToBack(selectedElementId.value)
  }
}

function handleToggleLock() {
  if (selectedElementId.value) {
    toggleLock(selectedElementId.value)
  }
}
</script>

<style scoped>
.certificate-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--color-gray-100);
}

:root.dark .certificate-editor {
  background-color: var(--color-gray-900);
}

/* Заголовок */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: white;
  border-bottom: 1px solid var(--color-gray-200);
  gap: 1rem;
}

:root.dark .editor-header {
  background: var(--color-gray-800);
  border-color: var(--color-gray-700);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  color: var(--color-gray-600);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.back-button:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
}

:root.dark .back-button {
  color: var(--color-gray-400);
}

:root.dark .back-button:hover {
  background: var(--color-gray-700);
  color: white;
}

.editor-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin: 0;
}

:root.dark .editor-title {
  color: white;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--color-gray-600);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

:root.dark .toolbar-btn {
  color: var(--color-gray-400);
}

:root.dark .toolbar-btn:hover:not(:disabled) {
  background: var(--color-gray-700);
  color: white;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: var(--color-gray-300);
  margin: 0 0.5rem;
}

:root.dark .toolbar-divider {
  background: var(--color-gray-600);
}

.zoom-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-gray-500);
  min-width: 40px;
  text-align: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-gray-700);
  background: white;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preview:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-400);
}

:root.dark .btn-preview {
  color: var(--color-gray-300);
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
}

:root.dark .btn-preview:hover {
  background: var(--color-gray-600);
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563EB, #1D4ED8);
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.4);
  transform: translateY(-1px);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Основная область */
.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas-container {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: 
    linear-gradient(45deg, var(--color-gray-200) 25%, transparent 25%),
    linear-gradient(-45deg, var(--color-gray-200) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--color-gray-200) 75%),
    linear-gradient(-45deg, transparent 75%, var(--color-gray-200) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  background-color: var(--color-gray-100);
}

:root.dark .canvas-container {
  background-color: var(--color-gray-900);
  background-image:
    linear-gradient(45deg, var(--color-gray-800) 25%, transparent 25%),
    linear-gradient(-45deg, var(--color-gray-800) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--color-gray-800) 75%),
    linear-gradient(-45deg, transparent 75%, var(--color-gray-800) 75%);
}

/* Анимация спиннера */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
