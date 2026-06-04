<script setup lang="ts">
import { t } from '@/lib/i18n'
import HazardStripe from '@/components/public/HazardStripe.vue'
import BrandLogo from '@/components/public/BrandLogo.vue'
</script>

<template>
  <div class="page">
    <HazardStripe />
    <div class="inner">
      <BrandLogo />
      <div class="card">
        <span class="coord text-shelter-accent">404 · NO TABLE</span>
        <h1 class="font-display uppercase tracking-wider text-2xl leading-tight text-shadow-neon mt-2">
          {{ t.noTableTitle }}
        </h1>
        <p class="text-sm text-shelter-muted leading-relaxed mt-3">{{ t.noTableSub }}</p>
        <div class="hazard !h-1 mt-5" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
.inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 32px 20px;
  max-width: 520px;
  margin: 0 auto;
}
.card {
  border: 1px solid var(--line-2);
  background: var(--surface);
  padding: 28px;
  border-radius: var(--radius-lg);
  width: 100%;
}
</style>
