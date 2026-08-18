<template>
  <div class="flex min-h-screen flex-col bg-parchment text-charcoal">
    <!-- ===== Sticky Navigation Bar（Warm parchment 风格） ===== -->
    <header
      class="sticky top-0 z-50 border-b border-linen-border bg-parchment/80 backdrop-blur-sm"
    >
      <div class="mx-auto flex h-12 max-w-page items-center gap-2 px-6">
        <router-link
          to="/images-icon"
          class="mr-2 flex shrink-0 items-center gap-2"
          aria-label="imgage-tools 首页"
        >
          <span
            class="flex h-6 w-6 items-center justify-center rounded-lg bg-charcoal text-[13px] font-semibold leading-none text-parchment"
            >i</span
          >
          <span class="hidden text-[15px] font-semibold sm:block">
            工具箱
          </span>
        </router-link>

        <nav class="flex items-center gap-1" aria-label="主导航">
          <template v-for="item in menus" :key="item.path">
            <!-- 父级 + 子菜单（hover 展开） -->
            <div v-if="item.children?.length" class="group relative">
              <div
                class="flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-[15px] hover:cursor-pointer"
                :class="
                  isActive(item)
                    ? 'bg-warm-sand font-[480] text-charcoal'
                    : 'text-dim-gray hover:text-charcoal'
                "
              >
                <z-icon :icon="item.icon" :size="16" />
                {{ item.name }}
                <z-icon
                  :icon="ChevronDown"
                  :size="12"
                  class="opacity-60"
                  aria-hidden="true"
                />
              </div>
              <div
                class="invisible absolute left-0 top-full mt-1.5 min-w-[160px] rounded-card bg-warm-sand p-1.5 opacity-0 shadow-subtle-2 transition-all duration-150 group-hover:visible group-hover:opacity-100"
              >
                <router-link
                  v-for="child in item.children"
                  :key="child.path"
                  :to="child.path"
                  class="block whitespace-nowrap rounded-pill px-3 py-1.5 text-[15px]"
                  :class="
                    isChildActive(child.path)
                      ? 'bg-parchment font-[480] text-charcoal'
                      : 'text-dim-gray hover:text-charcoal'
                  "
                >
                  {{ child.name }}
                </router-link>
              </div>
            </div>
            <!-- 无子菜单：普通链接 -->
            <router-link
              v-else
              :to="item.path"
              class="flex shrink-0 items-center gap-1.5 rounded-pill px-3 py-1.5 text-[15px]"
              :class="
                isActive(item)
                  ? 'bg-warm-sand font-[480] text-charcoal'
                  : 'text-dim-gray hover:text-charcoal'
              "
            >
              <z-icon :icon="item.icon" :size="16" />
              {{ item.name }}
            </router-link>
          </template>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from "lucide-vue-next";
import { useRoute } from "vue-router";
import ZIcon from "@/components/z-icon/index.vue";
import { menus, type MenuItem } from "@/layout/menu";

const route = useRoute();

/** 父级激活：当前路由命中自身或其任意子级 */
const isActive = (item: MenuItem) =>
  item.path === route.path ||
  (item.children?.some((c) => c.path === route.path) ?? false);

/** 子级激活：路径精确匹配 */
const isChildActive = (path: string) => route.path === path;
</script>
