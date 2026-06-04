<script setup lang="ts">
import { computed } from 'vue'
import type { CategoryBanner } from '@/lib/database.types'
import { pickName, pickDescription, pickCta } from '@/lib/i18n'

const props = defineProps<{ banner: CategoryBanner }>()
const title = computed(() => pickName(props.banner))
const desc = computed(() => pickDescription(props.banner))
const cta = computed(() => pickCta(props.banner))
const hasLink = computed(() => !!props.banner.cta_url)
const tag = computed(() => cta.value || 'EVENT · АКЦІЯ')
</script>

<template>
  <component
    :is="hasLink ? 'a' : 'div'"
    class="banner"
    :class="{ 'banner--link': hasLink }"
    :href="hasLink ? banner.cta_url : undefined"
    :target="hasLink ? '_blank' : undefined"
    :rel="hasLink ? 'noopener' : undefined"
    :style="banner.image_url ? `background-image: linear-gradient(90deg, rgba(13,13,13,0.92) 0%, rgba(13,13,13,0.7) 60%, rgba(13,13,13,0.5) 100%), url('${banner.image_url}')` : undefined"
  >
    <span class="stripe" aria-hidden="true" />
    <div class="inner">
      <span class="tag">◆ {{ tag }}</span>
      <h3 class="title">{{ title }}</h3>
      <p v-if="desc" class="desc">{{ desc }}</p>
    </div>
    <span v-if="hasLink" class="arrow" aria-hidden="true">→</span>
  </component>
</template>

<style scoped>
.banner {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 16px 18px 16px 22px;
  border-radius: var(--radius-lg);
  background-color: var(--bg-2);
  background-size: cover;
  background-position: center;
  border: 1px solid var(--line-2);
  overflow: hidden;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
  text-decoration: none;
  color: inherit;
}
.banner--link { cursor: pointer; transition: border-color 160ms ease, box-shadow 160ms ease; }
.banner--link:hover {
  border-color: rgba(var(--accent-rgb), 0.55);
  box-shadow: 0 8px 28px rgba(var(--accent-rgb), 0.18), 0 8px 22px rgba(0, 0, 0, 0.4);
}

/* Left orange stripe — the signature of the event card. */
.stripe {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  background: var(--accent);
  box-shadow: 0 0 12px rgba(var(--accent-rgb), 0.7);
}

.inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.tag {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  text-shadow: 0 0 6px rgba(var(--accent-rgb), 0.45);
}
.title {
  margin: 0;
  font-family: 'Unbounded', sans-serif;
  font-weight: 700;
  font-size: clamp(18px, 4.6vw, 22px);
  letter-spacing: -0.01em;
  line-height: 1.15;
  color: var(--text);
}
.desc {
  margin: 0;
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  line-height: 1.4;
  color: var(--muted);
}

.arrow {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  border: 1px solid var(--line-2);
  border-radius: 999px;
  color: var(--text);
  font-size: 18px;
  font-weight: 700;
  transition: all 160ms ease;
}
.banner--link:hover .arrow {
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
  box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.6);
}
</style>
