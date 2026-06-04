<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <div class="empty">
    <div class="empty-mark">×</div>
    <h3 class="font-display uppercase tracking-wider text-lg">{{ title }}</h3>
    <p v-if="description" class="text-sm text-shelter-muted">{{ description }}</p>
    <slot />
  </div>
</template>

<style scoped>
.empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px;
  padding: 40px 24px;
  text-align: center;
  border: 1px dashed var(--line-2);
  border-radius: var(--radius-lg);
}
.empty-mark {
  width: 56px; height: 56px;
  border-radius: 999px;
  border: 1px solid var(--line-2);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Unbounded', sans-serif;
  font-size: 28px;
  color: var(--muted);
}
</style>
