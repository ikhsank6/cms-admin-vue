<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PageHeader from '@/components/common/PageHeader.vue'
import TaxonomyManager from '@/components/admin/TaxonomyManager.vue'
import { categoryService, tagService } from '@/services/admin'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div>
    <PageHeader
      title="Categories & Tags"
      description="Kelompokkan artikel menggunakan kategori dan tag."
    />
    <Tabs default-value="categories">
      <TabsList>
        <TabsTrigger value="categories">Kategori</TabsTrigger>
        <TabsTrigger v-if="auth.can('tag.view')" value="tags">Tag</TabsTrigger>
      </TabsList>
      <TabsContent value="categories">
        <TaxonomyManager
          :service="categoryService"
          permission="category"
          label="Kategori"
          with-description
        />
      </TabsContent>
      <TabsContent value="tags">
        <TaxonomyManager :service="tagService" permission="tag" label="Tag" />
      </TabsContent>
    </Tabs>
  </div>
</template>
