<template>
  <div class="space-y-6">
    <!-- Приветственный блок -->
    <div class="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-2xl font-bold text-black dark:text-white mb-1">
            Добро пожаловать, {{ user?.name || 'Студент' }}! 👋
          </h2>
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
            Сегодня {{ currentDate }}. У вас запланировано {{ stats?.upcomingEvents?.length || 0 }} занятие(я).
          </p>
        </div>
        <NuxtLink to="/schedule" class="inline-flex items-center justify-center rounded bg-primary py-2 px-6 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
          Посмотреть расписание
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <!-- Ближайшие занятия -->
      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-2">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
          <h3 class="font-semibold text-black dark:text-white">
            Ближайшие занятия
          </h3>
          <NuxtLink to="/schedule" class="text-sm text-primary hover:underline">Все</NuxtLink>
        </div>
        <div class="p-6.5">
          <div v-if="!stats?.upcomingEvents?.length" class="text-center text-gray-500 py-4">
            Нет предстоящих занятий на ближайшее время
          </div>
          <div v-else class="flex flex-col gap-5">
            <div 
              v-for="event in stats.upcomingEvents" 
              :key="event.id"
              class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h4 class="text-lg font-bold text-black dark:text-white">
                    {{ event.title }}
                  </h4>
                  <p class="text-sm font-medium text-gray-500">
                    {{ event.course_name }}
                    <span v-if="event.classroom_name" class="ml-1">• Ауд. {{ event.classroom_name }}</span>
                  </p>
                </div>
                <div class="text-right">
                  <span class="block text-lg font-bold text-primary">{{ formatTime(event.start_time) }}</span>
                  <span class="text-xs text-gray-500">{{ formatDate(event.start_time) }}</span>
                </div>
              </div>
              <div>
                <span class="inline-flex rounded bg-gray-200 py-1 px-2 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                  {{ getEventTypeLabel(event.event_type) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Дедлайны и тесты -->
      <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
           <h3 class="font-semibold text-black dark:text-white">
            Горящие дедлайны
          </h3>
        </div>
        <div class="p-6.5">
           <div v-if="!stats?.upcomingDeadlines?.length" class="flex flex-col items-center justify-center py-8 text-center">
              <span class="bg-success/10 text-success p-3 rounded-full mb-3">
                 <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                 </svg>
              </span>
              <p class="text-sm text-gray-500">Нет просроченных тестов</p>
           </div>
           <div v-else class="flex flex-col gap-4">
              <div 
                 v-for="test in stats.upcomingDeadlines" 
                 :key="test.id" 
                 class="flex items-start gap-3 border-b border-stroke pb-4 last:border-0 last:pb-0 dark:border-strokedark"
              >
                  <div class="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded bg-danger/10 text-danger">
                     <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                  </div>
                  <div>
                     <h5 class="font-medium text-black dark:text-white">{{ test.test_name }}</h5>
                     <p class="text-xs text-gray-500 mb-1">{{ test.course_name }}</p>
                     <p class="text-xs font-medium text-danger">До: {{ formatDateTime(test.end_date) }}</p>
                     <NuxtLink :to="`/tests/my`" class="mt-1 text-xs text-primary hover:underline">
                        Пройти тест
                     </NuxtLink>
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Мои курсы (активные) -->
    <div class="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div class="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
          <h3 class="font-semibold text-black dark:text-white">
            Мои курсы
          </h3>
          <NuxtLink to="/my-courses" class="text-sm text-primary hover:underline">Все курсы</NuxtLink>
        </div>
        <div class="p-6.5">
           <div v-if="!stats?.activeCourses?.length" class="text-gray-500">Нет активных курсов</div>
           <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div 
                 v-for="course in stats.activeCourses" 
                 :key="course.group_id"
                 class="group rounded-lg border border-stroke p-4 transition-all hover:bg-gray-50 dark:border-strokedark dark:hover:bg-gray-800"
               >
                 <h4 class="font-bold text-black dark:text-white mb-1 group-hover:text-primary transition-colors">
                    <NuxtLink :to="`/my-courses/${course.group_id}`">{{ course.course_name }}</NuxtLink>
                 </h4>
                 <p class="text-sm text-gray-500 mb-4">{{ course.group_name }}</p>
                 
                 <div class="flex items-center justify-between text-xs mb-1">
                    <span class="text-gray-600 dark:text-gray-400">Прогресс</span>
                    <span class="font-medium text-primary">{{ course.progress }}%</span>
                 </div>
                 <div class="relative h-2 w-full rounded-full bg-stroke dark:bg-strokedark">
                    <div 
                      class="absolute left-0 h-full rounded-full bg-primary"
                      :style="{ width: `${course.progress}%` }"
                    ></div>
                 </div>
               </div>
           </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
const { user } = useAuth();
const stats = ref(null);

const currentDate = new Date().toLocaleDateString('ru-RU', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

const { authFetch } = useAuthFetch();

const fetchDashboardStats = async () => {
  try {
    const data = await authFetch('/api/students/dashboard');
    if (data) {
      stats.value = data;
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
  }
};

// Utils
const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
   return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

const formatDateTime = (dateStr) => {
   return new Date(dateStr).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

const getEventTypeLabel = (type) => {
  const map = {
    theory: 'Лекция',
    practice: 'Практика',
    assessment: 'Тест',
    other: 'Другое'
  };
  return map[type] || type;
};

onMounted(() => {
  fetchDashboardStats();
});
</script>

