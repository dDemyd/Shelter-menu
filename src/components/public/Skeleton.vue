<script setup lang="ts">
defineProps<{ count?: number }>()
</script>

<template>
  <div class="space-y-3">
    <div v-for="i in (count ?? 4)" :key="i" class="skel">
      <div class="skel-img" />
      <div class="skel-body">
        <div class="skel-line w-2/3" />
        <div class="skel-line w-1/3" />
        <div class="skel-line w-full" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.skel {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 14px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
}
.skel-img { width: 96px; height: 96px; border-radius: 4px; background: var(--surface-2); animation: shimmer 1.4s ease-in-out infinite; }
.skel-body { display: flex; flex-direction: column; gap: 8px; padding-top: 8px; }
.skel-line { height: 10px; border-radius: 3px; background: var(--surface-2); animation: shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
