<template>
  <aside
    :class="[
      'fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-99999 border-r border-gray-200',
      {
        'lg:w-[290px]': isExpanded || isMobileOpen || isHovered,
        'lg:w-[90px]': !isExpanded && !isHovered,
        'translate-x-0 w-[290px]': isMobileOpen,
        '-translate-x-full': !isMobileOpen,
        'lg:translate-x-0': true,
      },
    ]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      :class="[
        'py-6 flex items-center justify-center',
        !isExpanded && !isHovered ? 'lg:px-0' : 'px-2',
      ]"
    >
      <NuxtLink to="/" class="block w-full">
        <!-- Полный логотип при развёрнутом сайдбаре -->
        <Transition
          enter-active-class="transition-all duration-500 ease-out"
          enter-from-class="opacity-0 scale-90"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-300 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-90"
          mode="out-in"
        >
          <img
            v-if="isExpanded || isHovered || isMobileOpen"
            key="full-logo"
            src="/logo.png"
            alt="АТЦ Logo"
            class="w-full h-auto object-contain max-h-20 transition-all duration-300"
          />
          <!-- Favicon при свёрнутом сайдбаре -->
          <div
            v-else
            key="favicon"
            class="flex items-center justify-center mx-auto"
          >
            <div class="relative group">
              <div class="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
              <img
                src="/android-chrome-192x192.png"
                alt="АТЦ"
                class="relative w-12 h-12 rounded-xl object-contain transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
              />
            </div>
          </div>
        </Transition>
      </NuxtLink>
    </div>
    <div
      class="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar"
    >
      <nav class="mb-6">
        <div class="flex flex-col gap-4">
          <div v-for="(menuGroup, groupIndex) in menuGroups" :key="groupIndex">
            <h2
              :class="[
                'mb-4 text-xs uppercase flex leading-[20px] text-gray-400',
                !isExpanded && !isHovered
                  ? 'lg:justify-center'
                  : 'justify-start',
              ]"
            >
              <template v-if="isExpanded || isHovered || isMobileOpen">
                {{ menuGroup.title }}
              </template>
              <HorizontalDots v-else />
            </h2>
            <ul class="flex flex-col gap-4">
              <li v-for="(item, index) in menuGroup.items" :key="item.name">
                <button
                  v-if="item.subItems"
                  @click="toggleSubmenu(groupIndex, index)"
                  :class="[
                    'menu-item group w-full',
                    {
                      'menu-item-active': isSubmenuOpen(groupIndex, index),
                      'menu-item-inactive': !isSubmenuOpen(groupIndex, index),
                    },
                    !isExpanded && !isHovered
                      ? 'lg:justify-center'
                      : 'lg:justify-start',
                  ]"
                >
                  <span
                    :class="[
                      isSubmenuOpen(groupIndex, index)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.name }}</span
                  >
                  <ChevronDownIcon
                    v-if="isExpanded || isHovered || isMobileOpen"
                    :class="[
                      'ml-auto w-5 h-5 transition-transform duration-200',
                      {
                        'rotate-180 text-brand-500': isSubmenuOpen(
                          groupIndex,
                          index
                        ),
                      },
                    ]"
                  />
                </button>
                <NuxtLink
                  v-else-if="item.path"
                  :to="item.path"
                  :class="[
                    'menu-item group',
                    {
                      'menu-item-active': isActive(item.path),
                      'menu-item-inactive': !isActive(item.path),
                    },
                  ]"
                >
                  <span
                    :class="[
                      isActive(item.path)
                        ? 'menu-item-icon-active'
                        : 'menu-item-icon-inactive',
                    ]"
                  >
                    <component :is="item.icon" />
                  </span>
                  <span
                    v-if="isExpanded || isHovered || isMobileOpen"
                    class="menu-item-text"
                    >{{ item.name }}</span
                  >
                </NuxtLink>
                <transition
                  @enter="startTransition"
                  @after-enter="endTransition"
                  @before-leave="startTransition"
                  @after-leave="endTransition"
                >
                  <div
                    v-show="
                      isSubmenuOpen(groupIndex, index) &&
                      (isExpanded || isHovered || isMobileOpen)
                    "
                  >
                    <ul class="mt-2 space-y-1 ml-9">
                      <li v-for="subItem in item.subItems" :key="subItem.name">
                        <NuxtLink
                          :to="subItem.path"
                          :class="[
                            'menu-dropdown-item',
                            {
                              'menu-dropdown-item-active': isActive(
                                subItem.path
                              ),
                              'menu-dropdown-item-inactive': !isActive(
                                subItem.path
                              ),
                            },
                          ]"
                        >
                          {{ subItem.name }}
                          <span class="flex items-center gap-1 ml-auto">
                            <span
                              v-if="subItem.new"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              new
                            </span>
                            <span
                              v-if="subItem.pro"
                              :class="[
                                'menu-dropdown-badge',
                                {
                                  'menu-dropdown-badge-active': isActive(
                                    subItem.path
                                  ),
                                  'menu-dropdown-badge-inactive': !isActive(
                                    subItem.path
                                  ),
                                },
                              ]"
                            >
                              pro
                            </span>
                          </span>
                        </NuxtLink>
                      </li>
                    </ul>
                  </div>
                </transition>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from "vue";

import GridIcon from "~/components/icons/GridIcon.vue";
import CalenderIcon from "~/components/icons/CalenderIcon.vue";
import UserCircleIcon from "~/components/icons/UserCircleIcon.vue";
import UserGroupIcon from "~/components/icons/UserGroupIcon.vue";
import ChatIcon from "~/components/icons/ChatIcon.vue";
import MailIcon from "~/components/icons/MailIcon.vue";
import DocsIcon from "~/components/icons/DocsIcon.vue";
import PieChartIcon from "~/components/icons/PieChartIcon.vue";
import ChevronDownIcon from "~/components/icons/ChevronDownIcon.vue";
import HorizontalDots from "~/components/icons/HorizontalDots.vue";
import PageIcon from "~/components/icons/PageIcon.vue";
import TableIcon from "~/components/icons/TableIcon.vue";
import ListIcon from "~/components/icons/ListIcon.vue";
import PlugInIcon from "~/components/icons/PlugInIcon.vue";
import BoxCubeIcon from "~/components/icons/BoxCubeIcon.vue";
import DatabaseIcon from "~/components/icons/DatabaseIcon.vue";
import AcademicCapIcon from "~/components/icons/AcademicCapIcon.vue";
import FolderIcon from "~/components/icons/FolderIcon.vue";
import SidebarWidget from "./SidebarWidget.vue";
import { useSidebar } from "~/composables/useSidebar";

const route = useRoute();

const { isExpanded, isMobileOpen, isHovered, openSubmenu, setIsHovered } = useSidebar();

// Обработчики hover эффекта для сайдбара
const handleMouseEnter = () => {
  if (!isExpanded.value) {
    setIsHovered(true)
  }
}

const handleMouseLeave = () => {
  setIsHovered(false)
}

const menuGroups = [
  {
    title: "Menu",
    items: [

  
      {
        icon: AcademicCapIcon,
        name: "Учебные программы",
        path: "/programs",
      },
      {
        icon: UserGroupIcon,
        name: "Учебные группы",
        path: "/groups",
      },
      {
        icon: CalenderIcon,
        name: "Расписание",
        path: "/schedule",
      },
      {
        icon: DatabaseIcon,
        name: "База данных",
        path: "/database",
      },
      {
        icon: FolderIcon,
        name: "Файловый менеджер",
        path: "/files",
      }
    ],
  },
  {
    title: "Others",
    items: [
         {
        icon: UserGroupIcon,
        name: "Управление пользователями",
        path: "/users",
      },
    ],
  },
];

const isActive = (path) => route.path === path;

const toggleSubmenu = (groupIndex, itemIndex) => {
  const key = `${groupIndex}-${itemIndex}`;
  openSubmenu.value = openSubmenu.value === key ? null : key;
};

const isAnySubmenuRouteActive = computed(() => {
  return menuGroups.some((group) =>
    group.items.some(
      (item) =>
        item.subItems && item.subItems.some((subItem) => isActive(subItem.path))
    )
  );
});

const isSubmenuOpen = (groupIndex, itemIndex) => {
  const key = `${groupIndex}-${itemIndex}`;
  return (
    openSubmenu.value === key ||
    (isAnySubmenuRouteActive.value &&
      menuGroups[groupIndex].items[itemIndex].subItems?.some((subItem) =>
        isActive(subItem.path)
      ))
  );
};

const startTransition = (el) => {
  el.style.height = "auto";
  const height = el.scrollHeight;
  el.style.height = "0px";
  el.offsetHeight; // force reflow
  el.style.height = height + "px";
};

const endTransition = (el) => {
  el.style.height = "";
};
</script>
